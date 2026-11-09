# 90 Days — React → AI Agent Front-End

I'm Torres, a React developer. This repo documents my 90-day plan (22 Oct 2026 – 19 Jan 2027) to become an AI application front-end developer — building a real AI agent with streaming, structured output, tool calling, evals, a Skill and an MCP server, not just following tutorials.

**Goal:** by Day 90, independently ship one genuinely usable AI app, and be able to explain how it's designed, how it handles errors, how it controls cost, and how its answers are verified.

## Projects

| Where | What it is | Status |
| --- | --- | --- |
| [code-review-agent](https://github.com/Torres7707/code-review-agent) | **The main project.** A React code-review agent built with Next.js + AI SDK 7: streaming reviews, structured review cards (Zod), tool calling, an eval set, then real GitHub PR reviews, a review Skill and a TypeScript MCP server. | In progress — Phase 1 |
| `phase-1-starter/` | Streaming support chatbot (Acme Store) built with Next.js + Vercel AI SDK. Three Zod-typed tools: order lookup, help-docs search, and support-ticket creation. | Done — Week 1 warm-up |
| `ai-sdk-fundamentals-starter/` | Exercises from Vercel's AI SDK course. | Done — Week 1 |
| `ts-exercise/` | Small TypeScript type exercises. | Ongoing |
| `notes/` | Study notes (agents, skills, harness engineering, code review). | Ongoing |

## The plan (v2)

- **Phase 1 (22 Oct – 22 Nov 2026, Weeks 1–4) — Basics, streaming UI, structured output, tool loop.** AI SDK 7 basics, `useChat` streaming UI with cancel on both ends, Zod structured review cards, a first eval set (recall / false-positive rate), tool calling and the agent loop.
- **Phase 2 (23 Nov – 20 Dec 2026, Weeks 5–8) — Real PRs, Skill, MCP.** Review real GitHub PRs (including large diffs), write a review Skill and a TypeScript MCP server and use them in Claude Code / Cursor; Postgres history if time allows.
- **Phase 3 (21 Dec 2026 – 19 Jan 2027, Weeks 9–12) — Reliability and release.** Background runs with human approval (optional), rendering performance and trace visualisation, prompt-injection / timeout / cost control and tests, then deploy, demo video, bilingual README and resume update.

## How I learn

Every topic follows the same loop: **Watch** (one focused tutorial) → **Use** (build it into the code-review agent and commit) → **Break** (make it fail on purpose, then fix it) → **Explain** (write up the design, the alternatives, and the failure points). A topic counts as learned when I can predict what a change will do, debug it from a symptom, apply it to a new case, and explain it in my own words — not when I can retype it from memory, and not when AI generates it for me.

Pace: at least 6 hours a week. Saturday is family day — no study.

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
