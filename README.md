# Messaging Playwright Assignment

A minimal static messaging UI with a Playwright + TypeScript test framework. The tests intercept the message API with Playwright routing, so no backend is needed.

## Setup instructions

### Prerequisites

- Node.js 20 or newer
- npm

### Install

```bash
npm ci
npx playwright install
```

### Run locally

The test runner starts a small Node.js static-file server on `http://127.0.0.1:4173` automatically. To browse the app manually, start it yourself and open that URL:

```bash
node server/static-server.mjs
```

The server only serves the files in `app/` (`/` returns `dummy-messaging-app.html`) and does not implement a message API. Stop it with `Ctrl+C` when finished.

### Run tests

```bash
npm run typecheck     # type-check specs, page objects and utilities
npm test              # run the full suite on Chromium (Chrome project by default)
npm run test:headed   # run on Chromium with a visible browser
npm run test:all      # run the full suite on Chromium, Firefox and WebKit
npx playwright test --project=firefox  # run in one browser
npx playwright test tests/send-message.negative.spec.ts   # run one spec file
```

### View reports

```bash
npm run test:report
```

The HTML report is written to `playwright-report/`. After every run a copy is also saved with the current date as `MM-DD-YYYY.html` (for example `11-22-2026.html`). Traces for retried failures are written under `test-results/`. In CI, both folders are uploaded as the `playwright-report` artifact.

The messaging page logs navigation and input/button actions without recording message contents. The shared fixture attaches these logs to each test as a `Test Summary`.

## Project structure

```text
app/                       Provided dummy-messaging-app.html (unmodified)
server/static-server.mjs   Tiny static server that hosts app/ for the tests
pages/                     Page objects (POM): locators and user actions only
tests/                     Spec files (send-message positive and negative)
utils/
  fixtures.ts              Extended Playwright `test` providing an opened `messagingPage`
  logger.ts                Action logger used by the messaging page object
  mock-response.ts         API mocks built on page.route(); each returns the recorded requests
  dated-report-reporter.ts Custom reporter that saves the dated HTML report copy
playwright.config.ts       Runner, web server and reporter configuration
.github/workflows/         CI pipeline (typecheck + tests on push and pull request)
.github/agents/            Copilot custom agent for writing and validating tests
.vscode/mcp.json           Playwright MCP server configuration for VS Code
```

New features follow the same pattern: add a page object in `pages/`, API mocks in `utils/mock-response.ts`, a fixture in `utils/fixtures.ts` if the page needs setup, and specs in `tests/`. Specs import `test`/`expect` from `utils/fixtures.ts`, never from `@playwright/test` directly.

## Test scenarios

- **Positive:** 200 happy flow; exact success response shape (`success: true`, `message: string`) and request body; delayed response; HTML-like text rendered as plain text.
- **Negative:** empty message; whitespace-only message rejected by the API; invalid request and response schemas; HTTP 400, 401, 429 and 500 responses with the exact error response shape (`success: false`, `error: string`); aborted network request. Failed submissions do not add a message and retain the entered text.

## Tools and AI used

- **Stack:** Node.js, TypeScript, Playwright Test, GitHub Actions.
- **GitHub Copilot (AI-assisted):** The `Messaging Test Agent` custom agent (`.github/agents/messaging-test.agent.md`) uses the Playwright MCP server (`.vscode/mcp.json`) to inspect the local app and help write tests. To use it, run the setup steps, open the workspace in VS Code with the Copilot session target, select **Messaging Test Agent**, and approve the MCP server and tool requests when prompted.

## Decisions and reasoning

- **Static app and built-in Node server:** keeps the demo self-contained and avoids adding an application backend or another runtime dependency.
- **Playwright route mocking (`page.route`):** gives deterministic API outcomes (success, delay, HTTP errors, malformed body, aborted request) that are hard to trigger on demand against a real service, and lets tests assert the outgoing request. A real network abort is simulated with `route.abort()` and asserted through the `requestfailed` event.
- **Response schema assertions on the real response:** tests wait for the actual `POST /api/send-message` response and assert its status and exact body shape, so a contract change fails the test rather than only changing the UI.
- **Page Object Model, fixtures and mock helpers:** selectors live in page objects, API behaviour in reusable mock helpers, and setup in a fixture, so specs read as scenarios and stay free of routing boilerplate.
- **Positive/negative spec split:** each file has one purpose, which keeps failures easy to triage and lets suites scale independently.
- **Native Playwright HTML reporter:** gives a useful report with minimal configuration and no third-party reporting service.
- **Chromium, Firefox and WebKit projects:** the default suite exercises the same messaging scenarios in all three browser engines. Use `--project=<name>` to target one engine when iterating.

## Future improvements

- No real backend coverage: The mocked tests cannot establish whether a real API behaves correctly. Add separate backend contract and integration tests when the service exists.
- No complete schema validation in the app: The app checks success but does not validate all required response fields.
- No user-facing error handling: Failed or aborted requests retain input, but the app does not show an error message or catch network failures explicitly.
- If this becomes a chatbot, add an LLM-based judge for semantic evaluation of the generated responses.
