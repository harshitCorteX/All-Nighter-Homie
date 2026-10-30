# All Nighter Homie ✦

**Late night. Bright ideas. Good company.**

A cozy study workspace that turns your notes into clear explanations, practice quizzes, flashcards and a revision plan. Made with plain HTML, CSS and JavaScript, so you can open it on a laptop, host it on GitHub Pages, or share one link with a friend.

## Open the app

**[Use All Nighter Homie](https://all-nighter-homie.hp4277467.chatgpt.site)**

No account or installation is needed. Choose **Meet your study homie** to explore a sample lesson without an API key. For your own notes, open **Connect AI**, add your own [Groq key](https://console.groq.com/keys), test it, and save the settings. Each visitor uses their own key and browser storage.

## What's inside

| Tool | Your next small win |
| --- | --- |
| My notes | Paste, autosave, import `.txt`/`.md`, export a backup |
| Explain it | Understand a topic at beginner, high-school or college level |
| Practice quiz | Generate 3, 5 or 10 questions with feedback and a running score |
| Flashcards | Flip, review, and track what you remember |
| Study plan | Make a 1-, 2-, 4- or 8-week plan and check off daily tasks |
| Ask your notes | Work through questions in a conversation grounded in your material |
| Focus room | Start, pause, resume or reset a 25-minute session on any screen size |

The interface includes a midnight theme, a light theme, a learning snapshot, a moon mascot, responsive layouts and a Share button. Notes and generated study progress restore after a reload. The original AI Study Buddy note storage is retained for users on the same browser origin.

## Put it on your GitHub profile

See **[PUBLISH-TO-GITHUB.md](PUBLISH-TO-GITHUB.md)** for the exact steps. A GitHub Actions workflow is included; it checks the app, builds static files and publishes them to Pages.

For a repository named `All-Nighter-Homie` under `harshitCorteX`, the Pages address will be:

```text
https://harshitcortex.github.io/All-Nighter-Homie/
```

That address becomes live only after you upload the files, enable GitHub Pages and complete a successful deployment. If you update the existing `AI-Study-Buddy` repository instead, its existing repository name remains in the Pages URL; the app itself still displays **All Nighter Homie**.

## Give it to someone for their laptop

Send them the live link above, or your GitHub Pages link after deployment. They open it in Chrome, Edge, Firefox, Safari or another modern browser. No Node.js, terminal or file download is required for normal use.

They can also unzip the project and double-click `index.html`. Keep the `assets` folder and the other application files beside it. Local files work without a server; the app-shell offline cache requires a hosted HTTPS origin or localhost. AI features always require an internet connection and a Groq key.

After a first successful online visit, the hosted app caches its public interface for reopening offline. Notes and sample study tools can still be used; live AI cannot. Bookmarking the link is the simplest way to come back. Browsers that support app installation may also offer **Install** or **Add to home screen**.

## Run and develop locally

The application has **zero runtime dependencies** and requires no build to open directly. For a consistent local origin, use Node.js **20.19+**:

```sh
npm start
```

Open [localhost:4173](http://localhost:4173). The optional development server binds only to localhost and serves known public app files. Use the `PORT` environment variable if 4173 is already in use.

For development checks and a deployable static bundle:

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run build
```

The static output is `dist/`. Tests use `linkedom` as a development dependency. All **28 automated tests** cover data validation, interrupted AI streams, sample flows, storage migration, progress restoration, safe text rendering, theme switching, focus controls and sharing. AI responses are mocked in these tests. Use **Test connection** with your own key to verify your Groq access.

## How AI and storage work

- The browser calls [Groq's chat completions API](https://console.groq.com/docs/api-reference) directly with your key. No shared owner key is embedded in the app.
- Explanations and chat stream safely into text nodes. Quizzes, flashcards and plans use JSON mode and validate fields before rendering.
- Requests support cancellation and a 90-second timeout. Authentication, model permissions, rate limits and network errors have recovery messages.
- Notes are limited to 200,000 characters; imported files to 200 KB. For longer documents, up to 12,000 characters of selected excerpts are sent, with a visible status message. Topic matches are prioritised for targeted requests. Split a large syllabus into chapters for better coverage.
- Notes and study progress are stored in this browser's `localStorage`. Your theme preference is stored there too. Your API key and conversation history stay in tab memory and are cleared on reload.
- The Share button copies only the app address. It does not send notes, messages or API keys to friends.
- The service worker caches only the public interface files. It does not cache Groq requests or keys.
- Editing notes resets prior generated results and chat context. Clearing notes clears their study progress. Export notes before replacing them if you need a backup.
- Every hostname and browser profile has separate storage. Notes saved on the hosted demo, GitHub Pages, localhost or a local file do not automatically sync.

Sample mode uses clearly labelled prepared responses about photosynthesis and makes no AI requests. AI may make mistakes; verify important answers against your course material. PDF and Word imports are not supported; paste their text instead. If local storage is blocked or full, export a backup of your notes.

## Project files

```text
index.html                  Workspace and dialogs
styles.css                  Midnight/light themes and responsive layouts
app.js                      Study flows, local state and interactions
core.js                     Groq transport and response validators
assets/                     Moon icon and original desk illustration
manifest.webmanifest        App metadata
sw.js                       Public-interface offline cache
server.cjs                  Optional local development server
build.cjs                   Static bundle preparation
tests/                      28 core and DOM integration tests
.github/workflows/          Checks and GitHub Pages publishing
PUBLISH-TO-GITHUB.md         Upload, deploy and share instructions
IBM_BOB_USAGE.md             Original project's tooling notes
```

Built for your lightbulb moments. Take breaks. Keep going. ✦
