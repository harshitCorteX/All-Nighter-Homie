/* Shared browser / Node logic. No credentials or DOM state are persisted here. */
(function (root) {
  'use strict';
  const MAX_NOTES = 200000;
  const CONTEXT_LIMIT = 12000;
  function validateNotes(value) {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Add some notes in My notes first.');
    if (value.length > MAX_NOTES) throw new Error('Please use notes shorter than 200,000 characters.');
    return value.trim();
  }
  function selectContext(notes, query = '', limit = CONTEXT_LIMIT) {
    if (notes.length <= limit) return { text: notes, partial: false };
    const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])];
    const chunks = notes.match(/[\s\S]{1,800}(?:\n|$)|[\s\S]{1,800}/g) || [];
    const ranked = chunks.map((text, i) => ({ text, i, score: terms.reduce((n, word) => n + (text.toLowerCase().includes(word) ? 1 : 0), 0) }));
    // Relevant passages first; sample across the document for broad tasks.
    if (terms.length) ranked.sort((a, b) => b.score - a.score || a.i - b.i);
    else ranked.sort((a, b) => ((a.i * 37) % chunks.length) - ((b.i * 37) % chunks.length));
    let used = 0;
    const selected = [];
    for (const chunk of ranked) {
      if (used + chunk.text.length + 2 > limit) continue;
      selected.push(chunk); used += chunk.text.length + 2;
    }
    selected.sort((a, b) => a.i - b.i);
    return { text: selected.map(x => x.text).join('\n\n'), partial: true };
  }
  function parseJSON(raw) {
    try { return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch { throw new Error('The AI returned incomplete or invalid data. Please generate again.'); }
  }
  const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 6000;
  function validateQuiz(data, count) {
    const list = data?.questions;
    if (!Array.isArray(list) || list.length !== count || !list.every(q => text(q.question) && Array.isArray(q.options) && q.options.length === 4 && q.options.every(text) && new Set(q.options.map(o => o.trim().toLowerCase())).size === 4 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && text(q.explanation))) {
      throw new Error('The quiz response is missing valid questions or answers. Please generate again.');
    }
    return list;
  }
  function validateCards(data) {
    const list = data?.cards;
    if (!Array.isArray(list) || list.length < 3 || list.length > 12 || !list.every(c => text(c.front) && text(c.back))) throw new Error('The flashcards are incomplete. Please generate again.');
    return list;
  }
  function validatePlan(data, weeks) {
    const list = data?.weeks;
    if (!Array.isArray(list) || list.length !== weeks || !list.every((w, i) => w.week === i + 1 && text(w.theme) && Array.isArray(w.tasks) && w.tasks.length === 7 && w.tasks.every(text))) throw new Error('The plan needs seven daily tasks for every week. Please generate again.');
    return list;
  }
  function apiError(status) {
    if (status === 401) return 'Your Groq key was rejected. Check or replace it in Connect AI.';
    if (status === 403) return 'This key cannot access the selected model. Check Groq model permissions or choose another model.';
    if (status === 429) return 'Groq is rate limiting requests. Wait a minute, or choose the faster model, then try again.';
    if (status === 404) return 'The selected model is unavailable. Choose another model in AI settings.';
    if (status >= 500) return 'Groq is temporarily unavailable. Please try again shortly.';
    return `Groq could not complete this request (${status}). Try shorter notes or a smaller task.`;
  }
  async function readStream(body, onChunk) {
    if (!body) throw new Error('No response stream was received. Please try again.');
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', reply = '', complete = false;
    function consume(line) {
      if (!line.startsWith('data:')) return;
      const payload = line.slice(5).trim();
      if (!payload) return;
      if (payload === '[DONE]') { complete = true; return; }
      let event;
      try { event = JSON.parse(payload); } catch { throw new Error('The AI stream was interrupted. Please try again.'); }
      if (event.error) throw new Error('The AI reported a streaming error. Please try again.');
      const choice = event.choices?.[0];
      if (choice?.finish_reason === 'length') throw new Error('The answer reached its length limit. Try a smaller task.');
      if (choice?.finish_reason === 'stop') complete = true;
      const chunk = choice?.delta?.content;
      if (typeof chunk === 'string') { reply += chunk; onChunk?.(chunk); }
    }
    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) !== -1) { consume(buffer.slice(0, newline).replace(/\r$/, '')); buffer = buffer.slice(newline + 1); }
        if (done) { if (buffer.trim()) consume(buffer.trim()); break; }
      }
      if (!reply.trim()) throw new Error('The AI returned an empty response. Please try again.');
      if (!complete) throw new Error('The connection ended before the answer finished. Please try again.');
      return reply;
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
  async function request({ key, model, messages, json = false, maxTokens = 1600, signal, onChunk, fetcher = globalThis.fetch, timeoutMs = 90000 }) {
    if (!key?.trim()) throw new Error('Connect your Groq API key to continue, or try the sample lesson.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const res = await fetcher('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key.trim()}` }, signal: controller.signal,
        body: JSON.stringify({ model, messages, stream: !json, temperature: json ? 0.3 : 0.6, max_completion_tokens: maxTokens, ...(json ? { response_format: { type: 'json_object' } } : {}) })
      });
      if (!res.ok) throw new Error(apiError(res.status));
      if (!json) return await readStream(res.body, onChunk);
      let data;
      try { data = await res.json(); } catch { throw new Error('Groq returned an unreadable response. Please try again.'); }
      const choice = data.choices?.[0];
      if (choice?.finish_reason === 'length') throw new Error('The AI response was cut short. Try fewer questions or fewer weeks.');
      if (choice?.finish_reason !== 'stop' || typeof choice?.message?.content !== 'string' || !choice.message.content.trim()) throw new Error('Groq did not return a complete answer. Please try again.');
      return parseJSON(choice.message.content);
    } catch (error) {
      if (timedOut) throw new Error('This request took too long. Please try again.');
      if (controller.signal.aborted) throw new Error('Request cancelled.');
      if (error instanceof TypeError) throw new Error('Cannot reach Groq. Check your internet connection and browser network settings.');
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  const api = { MAX_NOTES, CONTEXT_LIMIT, validateNotes, selectContext, parseJSON, validateQuiz, validateCards, validatePlan, apiError, readStream, request };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StudyCore = api;
})(globalThis);
