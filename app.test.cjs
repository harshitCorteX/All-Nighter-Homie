const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const core = require('../core.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
function setup({ storage = new Map(), fetcher, storageBlocked = false } = {}) {
  const { document, Event } = parseHTML(html);
  const $ = id => document.getElementById(id);
  // linkedom does not implement select value or dialog methods.
  for (const select of document.querySelectorAll('select')) Object.defineProperty(select, 'value', { value: select.querySelector('[selected]')?.textContent || select.options[0].getAttribute('value') || select.options[0].textContent, writable: true });
  for (const id of ['settingsDialog', 'focusDialog', 'shareDialog']) {
    $(id).showModal = () => $(id).setAttribute('open', '');
    $(id).close = () => $(id).removeAttribute('open');
  }
  const handlers = new Map(), timers = new Set(), calls = [];
  const window = { StudyCore: { ...core, request: options => { calls.push(options); return core.request({ ...options, fetcher: fetcher || (() => { throw new Error('Unexpected network request'); }) }); } }, addEventListener: (name, fn) => handlers.set(name, fn) };
  const localStorage = { getItem: name => { if (storageBlocked) throw new Error('Blocked'); return storage.get(name) ?? null; }, setItem: (name, value) => { if (storageBlocked) throw new Error('Blocked'); storage.set(name, String(value)); } };
  const env = { window, document, location: { hash: '', protocol: 'https:', href: 'https://example.com/All-Nighter-Homie/' }, localStorage, confirm: () => true, AbortController, Blob, URL, console,
    setTimeout: (fn, ms) => { const timer = setTimeout(fn, ms); timers.add(timer); return timer; }, clearTimeout,
    setInterval: (fn, ms) => { const timer = setInterval(fn, ms); timers.add(timer); return timer; }, clearInterval };
  vm.runInNewContext(source, env);
  async function settle(type) { for (let i = 0; i < 100 && $(type + 'Form').querySelector('button[type=submit]')?.disabled; i++) await new Promise(resolve => setTimeout(resolve, 2)); await new Promise(resolve => setImmediate(resolve)); }
  return { $, document, storage, calls, env, cleanup: () => timers.forEach(clearTimeout),
    input: (id, value) => { $(id).value = value; $(id).dispatchEvent(new Event('input')); },
    submit: async type => { $(type + 'Form').onsubmit({ preventDefault() {} }); await settle(type); },
    nav: page => { env.location.hash = '#' + page; handlers.get('hashchange')(); },
    flush: () => handlers.get('pagehide')(),
    connect: () => { $('apiKey').value = 'test-not-a-real-key'; $('settingsForm').onsubmit({ preventDefault() {} }); }
  };
}
test('original plain-string notes migrate, autosave and restore without storing a key', () => {
  const storage = new Map([['sb_notes', 'My original notes']]); const app = setup({ storage });
  try { assert.equal(app.$('notesText').value, 'My original notes'); app.input('notesText', 'My improved notes'); app.connect(); app.flush(); assert.equal(JSON.parse(storage.get('sb_notes')), 'My improved notes'); assert.ok(![...storage.values()].join('').includes('test-not-a-real-key')); }
  finally { app.cleanup(); }
  const reloaded = setup({ storage }); try { assert.equal(reloaded.$('notesText').value, 'My improved notes'); assert.equal(reloaded.$('connectionLabel').textContent, 'Connect AI'); } finally { reloaded.cleanup(); }
});
test('sample lesson completes explanation and a quiz, with answers locked after selection', async () => {
  const app = setup(); try {
    app.$('sampleLoad').onclick(); assert.equal(app.$('sampleBanner').hidden, false); app.nav('explain'); await app.submit('explain'); assert.match(app.$('explainResult').textContent, /solar-powered kitchen/);
    app.nav('quiz'); await app.submit('quiz'); assert.equal(app.$('quizResult').querySelectorAll('.question').length, 5);
    const options = app.$('quizResult').querySelectorAll('.question')[0].querySelectorAll('button'); options[0].onclick(); options[1].onclick(); assert.equal(options[0].disabled, true); assert.match(app.$('quizScore').textContent, /1 \/ 5 answered · 1 correct/); assert.equal(app.calls.length, 0);
  } finally { app.cleanup(); }
});
test('flashcards flip, navigate, track recall and restore it after reload', async () => {
  const app = setup(); try { app.$('sampleLoad').onclick(); await app.submit('cards'); assert.equal(app.$('cardSide').textContent, 'THINK IT THROUGH'); app.$('flashcard').onclick(); assert.equal(app.$('cardSide').textContent, 'THE ANSWER'); app.$('cardMark').onclick(); app.$('cardNext').onclick(); assert.equal(app.$('cardPosition').textContent, 'CARD 2 / 5'); assert.equal(app.$('cardSide').textContent, 'THINK IT THROUGH'); } finally { app.cleanup(); }
  const reload = setup({ storage: app.storage }); try { assert.equal(reload.$('cardsResult').hidden, false); assert.equal(reload.$('cardKnown').textContent, '1 / 5 remembered'); } finally { reload.cleanup(); }
});
test('eight-week sample plan has 56 checkable tasks and persists progress', async () => {
  const app = setup(); try { app.$('sampleLoad').onclick(); app.$('planWeeks').value = '8'; await app.submit('plan'); assert.equal(app.$('planResult').querySelectorAll('input').length, 56); const task = app.$('planResult').querySelector('input'); task.checked = true; task.onchange(); } finally { app.cleanup(); }
  const reload = setup({ storage: app.storage }); try { assert.equal(reload.$('planResult').querySelector('input').checked, true); } finally { reload.cleanup(); }
});
test('chat uses separate DOM nodes, sample answers and a clear-conversation action', async () => {
  const app = setup(); try { app.$('sampleLoad').onclick(); app.$('chatInput').value = 'What does chlorophyll do?'; await app.submit('chat'); const bubbles = app.$('chatMessages').querySelectorAll('.message p'); assert.equal(bubbles.length, 3); assert.equal(bubbles[1].textContent, 'What does chlorophyll do?'); assert.match(bubbles[2].textContent, /absorbs light/); app.$('chatClear').onclick(); assert.equal(app.$('chatMessages').querySelectorAll('.message').length, 1); } finally { app.cleanup(); }
});
test('editing notes invalidates old outputs, sample mode and generated study state', async () => {
  const app = setup(); try { app.$('sampleLoad').onclick(); await app.submit('cards'); await app.submit('quiz'); app.input('notesText', 'New chapter'); assert.equal(app.$('sampleBanner').hidden, true); assert.equal(app.$('cardsResult').hidden, true); assert.equal(app.$('quizResult').children.length, 0); await app.submit('quiz'); assert.match(app.$('quizStatus').textContent, /Connect your Groq/); assert.equal(app.$('settingsDialog').hasAttribute('open'), true); } finally { app.cleanup(); }
});
test('unavailable local storage does not crash notes or sample study tools', async () => {
  const app = setup({ storageBlocked: true }); try { app.$('sampleLoad').onclick(); assert.match(app.$('saveStatus').textContent, /Storage unavailable/); await app.submit('cards'); assert.equal(app.$('cardsResult').hidden, false); } finally { app.cleanup(); }
});
test('failed chat requests keep failed turns out of future AI history and allow retry', async () => {
  let attempt = 0; const sent = []; const encoder = new TextEncoder();
  const app = setup({ fetcher: async (_, init) => { sent.push(JSON.parse(init.body)); if (!attempt++) return new Response('', { status: 401 }); return new Response(new ReadableStream({ start(c) { c.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"A real mocked reply"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n')); c.close(); } })); } });
  try { app.input('notesText', 'Chlorophyll absorbs light.'); app.connect(); app.$('chatInput').value = '<img src=x onerror=alert(1)>'; await app.submit('chat'); assert.match(app.$('chatStatus').textContent, /key was rejected/); assert.equal(app.$('chatForm').querySelector('button').disabled, false); assert.equal(app.$('chatMessages').querySelectorAll('img').length, 0); app.$('chatInput').value = 'What absorbs light?'; await app.submit('chat'); assert.equal(sent[1].messages.length, 2); assert.equal(sent[1].messages[1].content, 'What absorbs light?'); assert.match(app.$('chatMessages').lastElementChild.textContent, /real mocked reply/); } finally { app.cleanup(); }
});
test('malformed quiz leaves the previous valid quiz available and re-enables generation', async () => {
  let attempt = 0;
  const valid = { questions: Array(5).fill({ question: 'What absorbs light?', options: ['Chlorophyll', 'Water', 'Glucose', 'Oxygen'], answer: 0, explanation: 'Chlorophyll absorbs light.' }) };
  const app = setup({ fetcher: async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: attempt++ ? '{"questions":[{"options":[]}]}' : JSON.stringify(valid) } }] })) });
  try { app.input('notesText', 'Chlorophyll absorbs light.'); app.connect(); await app.submit('quiz'); assert.equal(app.$('quizResult').children.length, 5); await app.submit('quiz'); assert.match(app.$('quizStatus').textContent, /missing valid/); assert.equal(app.$('quizForm').querySelector('button').disabled, false); assert.equal(app.$('quizResult').children.length, 5); } finally { app.cleanup(); }
});
test('night and light themes switch accessibly and restore across sessions', () => {
  const app = setup();
  try { assert.equal(app.document.documentElement.dataset.theme, 'night'); app.$('themeToggle').onclick(); assert.equal(app.document.documentElement.dataset.theme, 'light'); assert.equal(app.$('themeToggle').getAttribute('aria-label'), 'Switch to night theme'); }
  finally { app.cleanup(); }
  const reload = setup({ storage: app.storage }); try { assert.equal(reload.document.documentElement.dataset.theme, 'light'); } finally { reload.cleanup(); }
});
test('focus room opens, starts, pauses and resets without losing navigation', () => {
  const app = setup(); try { app.$('focusOpen').onclick(); assert.ok(app.$('focusDialog').hasAttribute('open')); app.$('timerToggle').onclick(); assert.equal(app.$('timerToggle').textContent, 'Pause'); app.$('focusClose').onclick(); assert.equal(app.$('focusDialog').hasAttribute('open'), false); app.$('focusOpen').onclick(); assert.equal(app.$('timerToggle').textContent, 'Pause'); app.$('timerToggle').onclick(); assert.equal(app.$('timerToggle').textContent, 'Resume'); app.$('timerReset').onclick(); assert.equal(app.$('timer').textContent, '25:00'); assert.equal(app.$('timerToggle').textContent, 'Start focus'); } finally { app.cleanup(); }
});
test('sharing copies only the app address, without notes, query strings or chat', async () => {
  const app = setup(); try { app.input('notesText', 'My private chapter notes'); app.env.location.href = 'https://example.com/All-Nighter-Homie/?ref=private#chat'; let copied; app.env.window.navigator = { clipboard: { writeText: async value => { copied = value; } } }; app.$('shareOpen').onclick(); assert.equal(app.$('shareUrl').value, 'https://example.com/All-Nighter-Homie/'); await app.$('copyLink').onclick(); assert.equal(copied, 'https://example.com/All-Nighter-Homie/'); assert.match(app.$('shareStatus').textContent, /Copied/); } finally { app.cleanup(); }
});
test('learning snapshot follows current notes, quiz scores and flashcard recall', async () => {
  const app = setup(); try { app.input('notesText', 'one two three four'); assert.equal(app.$('snapshotWords').textContent, '4'); app.$('sampleLoad').onclick(); await app.submit('quiz'); app.$('quizResult').querySelector('button').onclick(); assert.equal(app.$('snapshotQuiz').textContent, '1 / 5 correct'); await app.submit('cards'); app.$('cardMark').onclick(); assert.equal(app.$('snapshotCards').textContent, '1 / 5 cards'); app.input('notesText', 'A fresh chapter'); assert.equal(app.$('snapshotQuiz').textContent, "Let's find out"); assert.equal(app.$('snapshotCards').textContent, 'A fresh start'); } finally { app.cleanup(); }
});
