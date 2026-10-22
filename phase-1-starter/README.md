# Phase 1 Starter — Streaming Support Chatbot

Your hands-on starting point for **Phase 1** of the 90-day plan (Days 1–30):
a streaming support chatbot with **three typed tools**, built on
Next.js + the Vercel AI SDK.

By the end of Phase 1 you'll be able to explain — and show a UI for —
**streaming**, **tool calling**, and **structured output**. This project
teaches the first two.

## What it does

- `app/api/chat/route.ts` — streams model responses with `streamText` and
  defines three tools with Zod schemas:
  - `lookupOrder` — order status / items / ETA (try `ACME-1001`)
  - `searchHelpDocs` — help-center search (try "return policy")
  - `createTicket` — opens a support ticket (try "my keyboard arrived broken")
- `app/page.tsx` — chat UI with `useChat`. Renders text parts as they stream
  and tool parts through every state (`input-streaming` → `input-available`
  → `output-available` / `output-error`), plus stop / error / retry controls.

## Setup

1. **Prerequisites:** Node.js 22+ (the AI SDK v7 needs it), npm.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your OpenAI API key:
   ```bash
   cp .env.example .env.local
   # edit .env.local → OPENAI_API_KEY=sk-...
   ```
   Get a key at https://platform.openai.com/api-keys
   (any provider works — see `route.ts`; OpenAI is the cheapest way to start).
4. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Things to try (each teaches a concept)

1. **"Where is order ACME-1001?"** — watch the tool card flip through
   `input-streaming` → `input-available` → `output-available`.
2. **"What's your return policy?"** — `searchHelpDocs` runs; notice the model
   grounds its answer in the tool result instead of guessing.
3. **"My keyboard arrived broken."** — `createTicket` fires; this is the tool
   you'll later gate behind a human-in-the-loop approval (Phase 2).
4. **"Where is order ACME-9999?"** — the tool returns `found: false`; see how
   the model handles a tool result that says "no".
5. Hit **Stop** mid-stream — this is the cancelled-stream handling from the plan.

## How it maps to your learning

- **Vercel Academy** (Builders Guide to the AI SDK) → the *Conversational AI*
  section: Phase 1 there (streaming chat with `useChat` + `streamText`) is
  exactly this codebase; Phase 4 (tool calling) is the three tools above.
- **Official docs to keep open:** https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
  and https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **Phase 1 project goal** (Days 1–30): extend this — add a 4th tool of your
  own, swap the mock data for a real API, then deploy it.

## Troubleshooting

- **401 / "Incorrect API key"** — `.env.local` is missing or the key is wrong.
  Restart `npm run dev` after editing env files.
- **"Model not found"** — check the model name in `route.ts` against the
  provider's current list.
- **Blank page / build errors** — run `npx tsc --noEmit` to surface type
  errors; this codebase typechecks clean on the pinned dependency versions.
