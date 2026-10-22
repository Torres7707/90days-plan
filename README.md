# 90 Days — React → AI Agent Front-End

I'm Torres, a React developer. This repo documents my 90-day plan (22 Oct 2026 – 19 Jan 2027) to become an AI agent front-end developer — building real AI apps with streaming, tool calling, structured output, and evals, not just following tutorials.

**Goal:** by Day 90, independently ship one genuinely usable AI app, and be able to explain how it's designed, how it handles errors, how it controls cost, and how its answers are verified.

## Projects

| Folder | What it is | Status |
| --- | --- | --- |
| `phase-1-starter/` | Streaming support chatbot (Acme Store) built with Next.js + Vercel AI SDK. Three Zod-typed tools: order lookup, help-docs search, and support-ticket creation. | In progress — Phase 1 |
| `trace/` | **Trace** — AI daily-review assistant (the main project). Log activities and feelings; AI generates structured weekly reports with evidence-based suggestions, and says so when the data is insufficient. | Planned — starts in Phase 2 |

More small experiments will be added as their own folders as the plan progresses.

## The plan

- **Phase 1 (22 Oct – 20 Nov 2026) — Make an AI app actually run.** LLM basics, model calls, streaming / stop / errors / retry, tool calling with Zod, API routes, data persistence, env vars, input validation — plus a fixed set of 5–10 eval questions from Week 1.
- **Phase 2 (21 Nov – 20 Dec 2026) — From chatbot to AI app.** Structured output, generative UI, chat history with basic auth, RAG where it's genuinely needed, and a small MCP experiment. Deliverable: Trace v1.
- **Phase 3 (21 Dec 2026 – 19 Jan 2027) — Engineering reliability.** Eval suite, timeouts and rate limits, prompt-injection safety, token / latency / cost logging, data protection, deployment, demo video, and written-ups of one technical decision and one failure case.

## How I learn

Every topic follows the same loop: **Watch** (one focused tutorial) → **Close** (rebuild it from an empty file, no tutorial) → **Break** (make it fail on purpose, then fix it) → **Use** (integrate it into a project and commit) → **Explain** (write up the design, the alternatives, and the failure points). A topic only counts as learned when I can debug it and explain it — not when AI generates it for me.

Pace: 5–6 hours a week — two short weekday sessions, one weekend build, and a 15-minute weekly review.

## Run the starter

```bash
cd phase-1-starter
npm install
cp .env.example .env.local   # then add your own API key
npm run dev
```

Try asking it for the status of order `ACME-1001` — it answers by calling the order-lookup tool, and if you ask about an order that doesn't exist, it says so instead of making one up.

## Stack

TypeScript · React · Next.js · Vercel AI SDK · Zod

## Progress log

- **2026-10-22 — Day 1:** Phase 1 starter running locally. First tool call working end to end (order lookup with a grounded answer). Repo created.
