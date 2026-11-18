# React Code Review Agent（练习主项目）

粘贴一段 React 代码，让模型评审。这是 90 天计划里**自己手写**的主项目，每周在这里加一层能力。
AI 写的最终形态在 `~/Projects/code-review-agent`（GitHub: Torres7707/code-review-agent），只在自己实现完之后拿来对照。

技术栈：Next.js 16（App Router，TS strict）· AI SDK 7（`ai@7` + `@ai-sdk/react@4`）· Zod 4 · Tailwind 4 · pnpm

## 运行

```bash
nvm use                       # Node 24（.nvmrc）
pnpm install
cp .env.example .env.local    # 填 AI_GATEWAY_API_KEY + AI_MODEL，或 LOCAL_LLM_*
pnpm dev                      # http://localhost:3000
```

两个页面：

- `/`：第 2 周的文字流式版（右上角有链接跳到 `/cards`）
- `/cards`：第 3 周的结构化卡片版（左上角有链接跳回 `/`）

## 命令一览

| 命令 | 做什么 | 调用真实模型？ |
| --- | --- | --- |
| `pnpm dev` / `pnpm build` | 开发 / 生产构建 | 页面上点“评审”才会调用 |
| `pnpm typecheck` | `tsc --noEmit` | 否 |
| `pnpm lint` | ESLint | 否 |
| `pnpm check-cases` | 检查 `evals/cases.json`：24 条、12 find / 12 clean | 否 |
| `pnpm eval` | 评测脚本默认模式：只读用例、检查参数 | 否 |
| `pnpm check-imports` | 确认 `MockLanguageModelV4`、`simulateReadableStream` 能导入 | 否 |
| `pnpm test:mock` | 模拟模型测试（**还是 TODO**，目前以退出码 1 结束） | 否 |
| `pnpm eval:run --limit 1` | 真实评测 1 条 × 3 次，结果写进 `results/` | **是，花额度** |
| `pnpm eval:run` | 全量 24 条 × 3 次 = 72 次调用 | **是，花额度** |

> ⚠️ `--limit` 要写成 `--limit 1`（空格），不能写 `--limit=1`。`scripts/eval.ts` 的 `parseArgs` 只认空格形式，写成等号会被忽略，直接跑全量 72 次。
> 脚本注释里写的 `pnpm eval:run -- --limit=1` 不生效。

模型配置在 `lib/model.ts` 的 `getModel()`：填了 `LOCAL_LLM_BASE_URL` + `LOCAL_LLM_MODEL` 就走 OpenAI 兼容接口，否则用 `AI_GATEWAY_API_KEY` + `AI_MODEL`（AI Gateway 的 `provider/model` 字符串）。它只在真正调用时才创建，缺配置时抛出明确的错误。
第 2 周的 `/api/review` 仍然直接读 `AI_MODEL`，没有改。

## 按周看

### 第 1 周 · AI SDK 基础（不在本项目里）

练习在同级目录：`../ai-sdk-fundamentals-starter/`（Vercel Builders Guide 课程）、`../phase-1-starter/`。

### 第 2 周 · v7 流式文字评审 + Stop + 错误处理

| 文件 | 做了什么 |
| --- | --- |
| `app/api/review/route.ts` | `convertToModelMessages` → `streamText({ instructions, messages, abortSignal: req.signal })` → `createUIMessageStreamResponse(toUIMessageStream(...))`；`messageMetadata` 在 start 写 `createdAt`/`model`，在 finish 写 `totalTokens`；`onError` 只给浏览器一句通用提示，完整错误留在服务端日志 |
| `lib/prompt.ts` | `REVIEW_PROMPT`（系统提示词） |
| `lib/types.ts` | `MyUIMessage`（带 metadata 类型的 UIMessage） |
| `app/page.tsx` | `useChat` + `DefaultChatTransport`，`?variant=A|B|C` 切换三种布局 |
| `app/prototype-ui/*`、`app/components/PrototypeSwitcher.tsx` | 三个布局原型和共用的 `ReviewStream`（用 Streamdown 渲染 text part） |
| `note/流式请求与取消流程图.png` | 请求和取消的流程图 |

怎么验证：粘贴有 bug 的组件，文字逐段流出；点 Stop 后浏览器和服务端都停；把 key 改错，界面显示“评审失败，请稍后重试”。

还缺：A/B/C 三个原型出错时只能关掉错误提示（`onClearError`），**没有“重试”按钮**。

### 第 3 周 · 结构化卡片 + 评测集

从 `../week3-cards-and-evals/` 搬过来。网页和评测脚本共用同一份 schema 和提示词。

| 文件 | 做了什么 |
| --- | --- |
| `lib/review-schema.ts` | `reviewSchema`：issues 数组，每条有 title / reason / suggestion / severity，line 可选 |
| `lib/review-prompt.ts` | `PROMPT_VERSION`（现在是 `v0-baseline`）和 `buildReviewPrompt(code)` |
| `lib/model.ts` | 惰性的 `getModel()` |
| `lib/sample-code.ts` | `/cards` 的默认输入 |
| `app/api/review/cards/route.ts` | `streamText({ prompt, output: Output.object({ schema }), abortSignal })`，把 `text-delta` 转成文本流返回。流中途出错时追加 `[review failed]`，让最终 JSON 解析失败，前端就不会把半截结果当成“没有问题” |
| `app/cards/page.tsx` | `useObject` 渲染卡片：下标做 key 和编号；缺的字段显示“生成中...”；流没结束时空数组显示“卡片生成中...”，结束后才显示“没有问题”。有 Stop、错误提示和重试 |
| `evals/case-schema.ts`、`evals/cases.json` | 24 条用例（12 find + 12 clean） |
| `evals/match.ts`、`evals/metrics.ts` | 报出判断、报出率 / 误报率统计 |
| `scripts/check-cases.ts`、`scripts/eval.ts`、`scripts/check-imports.ts` | 用例检查、批量评测（每条 3 次）、导入检查 |
| `results/results-2026-11-13_*.json` | 11/13 跑出的两份基线结果 |
| `tests/mock-model.ts` | 模拟模型测试的 TODO 骨架（原样搬过来，没实现） |

和 week3 原版的差异：

- `scripts/eval.ts` 原来 import 的是 `model/index.ts`（模块加载时就创建客户端，你自己在里面标了 TODO）。现在改成调用 `lib/model.ts` 的 `getModel()`，默认模式不再需要密钥。
- 卡片里的行号：`line` 在 schema 里是可选的，流结束后还没有就不显示。原来的 `render-partial.ts` 会一直显示“生成中...”。

笔记：`../notes/2026-11-13-week3-structured-output-and-evals.html`、`../notes/code-questions-log.md`。

## 还没做完

- [ ] `tests/mock-model.ts`：用 `MockLanguageModelV4` + `simulateReadableStream` 写一个不联网的测试
- [ ] 第 3 周“基线之后改两次提示词，用数字对比”没做（改提示词时同时改 `PROMPT_VERSION`）
- [ ] 第 2 周原型页没有重试按钮
- [ ] `package-lock.json` 是早期用 npm 留下的，现在依赖由 pnpm 管理（`pnpm-lock.yaml`），它已经过期

## 常见坑

- **Node 20 会悄悄装成 ai v6**（v7 需要 Node ≥ 22），所以先 `nvm use`。
- `@ai-sdk/openai-compatible` 锁在 `3.0.81`，因为它依赖的 `@ai-sdk/provider@4.0.34` 和当前的 `ai@7.0.157` 一致。装更新的版本会带进另一份 provider 类型，`tsc` 会报 `LanguageModelV4` 不兼容。升级 `ai` 时要一起升级它。
- v7 里 `system` 改名为 `instructions`，`stepCountIs` 改名为 `isStepCount`，`convertToModelMessages` 要 `await`。
- API key 只在服务端用，不要加 `NEXT_PUBLIC_` 前缀。永远不要提交 `.env.local`。

## 链接

- AI SDK 7 迁移指南：https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0
- useChat：https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- 结构化对象流式渲染（useObject）：https://ai-sdk.dev/docs/ai-sdk-ui/object-generation
- 测试与模拟模型：https://ai-sdk.dev/docs/ai-sdk-core/testing
