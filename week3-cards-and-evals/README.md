# Week 3 · 结构化卡片与评测集（第 2–5 步起始项目）

这是第 3 周「怎么做」里第 2、3、4、5 步的本地练习骨架，放在 `90days-plan/week3-cards-and-evals`。它不是 `code-review-agent` 主项目，也不是上一份 `week3-structured-output`（那份继续留给第 1 步的 structured output 练习）。

骨架提供可运行的基础设施、类型、示例快照和 TODO。核心练习要你自己写：卡片渲染、24 条用例、命中判断、召回率 / 误报率、真实评测循环、模拟模型测试。这里不会替你填完 24 条评测，也不会改主项目。

本周指南原文（来自 [第 3 周打卡页](https://plan-tracker-eta.vercel.app/weeks/3)）见下方各步。第 6 步「改两次提示词」和「后端小知识」不在本次起始项目范围内。

## 第一件动作（5 分钟内能做完）

在本目录打开终端，运行：

```bash
pnpm step2:preview
```

这会离线回放 8 帧「不完整的评审对象」，不需要 API key，也不调用模型。先看清楚：前面几帧字段是缺的，后面才逐渐完整。然后打开 `src/render-partial.ts`，把现在的 JSON 打印改成卡片：

1. 某个字段还是 `undefined` 时，不要把 `undefined` 印到终端里。
2. 严重程度还没出现时，显示占位（例如 `严重程度：…`），不要空着或报错。
3. 卡片用数组下标编号（`#1`、`#2`），不要用可能还没生成完的 `title` 当编号。

改完再跑一次 `pnpm step2:preview`，确认最后一帧还没完整出现时，前面的卡片已经可读。

## 离线确认骨架可用

```bash
cd /Users/torreswang/Projects/90days-plan/week3-cards-and-evals
pnpm install
pnpm verify
```

`pnpm verify` 会做：类型检查、用例格式检查、离线预览、评测脚本默认模式（不打模型）、模拟模型导入检查。当前预期是：**骨架通过，但第 3–5 步的核心 TODO 仍未完成**（例如用例只有 2 条示例，`pnpm test:mock` 会提示 TODO 并以退出码 1 结束）。

真正接模型、跑全量评测前，先复制环境变量，密钥自己填：

```bash
cp .env.example .env.local
```

不要提交 `.env.local`。离线步骤不需要填它。

---

## 第 2 步 · 流式渲染结构化结果

**指南原文：** 两条路选一条：A. 服务端 `streamText` 配 `output: Output.object({ schema })`，用 `partialOutputStream`；B. 前端用 `@ai-sdk/react` 的 `useObject`（v7 已从 `experimental_useObject` 改为 `useObject`）。流式过程中对象是“不完整的”，字段可能是 `undefined`，渲染时要容错。

**常见坑：** 卡片 key 不要用还没生成完的 `title`，用数组下标或稳定 id。严重程度未出现时显示占位，不要显示 `undefined`。

**做完你应该看到：** 卡片一张张出现，最后一张生成完前已有前几张可读。

本骨架选了路径 A（和上一份 CLI 练习同一技术栈，不额外搭前端）。如果你更想走路径 B，可以之后自己加页面，但本周只要选一条路做完即可。

文档：

- [结构化对象流式渲染](https://ai-sdk.dev/docs/ai-sdk-ui/object-generation)
- [结构化数据生成](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)

| 项目 | 内容 |
| --- | --- |
| 目标 | 把不完整的结构化评审渲染成一张张卡片，先离线再接模型。 |
| 文件 | `fixtures/partial-review-stream.json`、`src/render-partial.ts`、`src/step2-preview.ts`、`src/step2-stream.ts`、`src/schema.ts` |
| 运行命令 | 离线：`pnpm step2:preview`。接模型（会消耗额度）：先填 `.env.local`，再 `pnpm step2:stream` |
| 预期观察 | 预览里能看到对象从 `{}` 长到两张完整卡片；改渲染后不再出现 `undefined`。接模型后，流式过程同样是一张张出现。 |
| 验收条件 | 最后一张还没生成完时，前面的卡片已经可读；缺字段有占位；编号不用未完成的 title。 |

**具体小操作：**

1. 跑 `pnpm step2:preview`，按帧看缺字段是怎么出现的（第 1 帧是空对象，第 4 帧只有 title，第 7 帧第二张卡还不完整）。
2. 改 `src/render-partial.ts`，再跑预览，直到符合上面的验收。
3. 打开 `src/step2-stream.ts`，按文件里的 TODO 接上 `streamText` + `Output.object({ schema: reviewSchema })`，把 `partialOutputStream` 的每一帧交给 `renderPartialReview`。
4. 确认 `.env.local` 已由你自己填写后，再跑 `pnpm step2:stream`。这段才会消耗额度。

---

## 第 3 步 · 做 24 条评测用例

**指南原文：** 建 `evals/cases.json`：12 条有问题的代码（如 hooks 条件调用、缺依赖、key 用 index、直接改 state），12 条正常代码。每条标注 `expect: 'find'`（应发现）或 `'clean'`（不应误报），以及应发现的关键词。可参考 [eslint-plugin-react-hooks 的测试用例（MIT）](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks/__tests__)。

**做完你应该看到：** `cases.json` 有 24 条，比例 12/12，每条都有标注。

| 项目 | 内容 |
| --- | --- |
| 目标 | 做出可重复使用的 24 条评测集，而不是临时想几段代码。 |
| 文件 | `evals/cases.json`、`evals/case-schema.ts`、`scripts/check-cases.ts` |
| 运行命令 | `pnpm check-cases` |
| 预期观察 | 一开始会报告 `总数：2 / 24`，`find 1 / 12`，`clean 1 / 12`。每加几条就跑一次，数字会变。 |
| 验收条件 | 24 条、12 条 find / 12 条 clean、id 不重复、find 条都有 `keywords`。 |

**具体小操作：**

1. 打开 `evals/cases.json`，看懂两条示例的字段：`id`、`code`、`expect`、`keywords`（find 必填）、`note`（可选）。
2. 跑 `pnpm check-cases`，确认检查脚本能读懂你的 JSON。
3. 每次只加 1 条，保存后再跑检查，不要一次粘贴 22 条却不验收格式。
4. 有问题的 12 条至少覆盖指南提到的几类：hooks 条件调用、缺依赖、`key` 用 index、直接改 state。正常的 12 条要真的「不该报」，不要只是把有问题的代码稍微改改却仍有坑。
5. 不要使用公司代码或业务细节。需要灵感时去看 eslint-plugin-react-hooks 的测试（MIT）。

骨架只放了 2 条格式示例，剩下 22 条要你自己写。

---

## 第 4 步 · 写批量评测脚本

**指南原文：** `scripts/eval.ts`：读用例，每条调用 `generateText`（配同一个 schema）跑 3 次，判断是否命中。算召回率 = 应发现且发现了 / 应发现总数；误报率 = 不应报却报了 / 正常用例总数。输出一张表并存成 JSON（带日期和提示词版本）。

```bash
npx tsx scripts/eval.ts   # 或 node --experimental-strip-types（以 Node 文档为准）
```

本项目里等价命令是 `pnpm eval`（默认不打模型）和 `pnpm eval:run`（你写完 TODO 之后才会真正评测）。

**常见坑：** 只跑 1 次不可靠：模型有随机性，同一条可能这次中下次不中。并发太高会被限流，先串行或小并发。

**做完你应该看到：** 终端打印出“召回率 xx% / 误报率 xx%”，结果文件已保存为基线。

| 项目 | 内容 |
| --- | --- |
| 目标 | 用同一套 schema 和提示词，把评测集跑成两个可比的数字，并存下基线。 |
| 文件 | `scripts/eval.ts`、`src/match.ts`、`src/metrics.ts`、`src/prompts.ts`、`results/` |
| 运行命令 | 离线检查：`pnpm eval`。写完 TODO 后先：`pnpm eval:run -- --limit=1`。全量：`pnpm eval:run` |
| 预期观察 | 默认模式只打印「已加载 N 条」并退出，不写结果、不打模型。`--run` 且 TODO 完成后，终端出现两个百分比，`results/` 下多一个带日期和 `promptVersion` 的 JSON。 |
| 验收条件 | 每条跑 3 次；能说出召回率和误报率的区别；结果文件里有日期（Asia/Shanghai）和提示词版本；这组数字就是基线。 |

**具体小操作：**

1. 先跑 `pnpm eval`，确认默认模式不会调用模型。
2. 在 `src/match.ts` 里写清「命中」的定义，再写 `isHit`。想一想：`find` 是 issues 非空就算，还是必须覆盖 `keywords`？`clean` 是 issues 非空就算误报吗？
3. 在 `src/metrics.ts` 里按原文公式实现两个率。分母为 0 时不要直接除。
4. 在 `scripts/eval.ts` 里实现 `reviewOnce` 和评测循环：串行、每条 3 次、打表、写 JSON。可用 `new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })` 记录时间。
5. 改提示词时同步改 `src/prompts.ts` 里的 `PROMPT_VERSION`。
6. 先 `--limit=1` 看通，再全量。全量会多次调用模型，注意额度。

---

## 第 5 步 · 用模拟模型写一个不花钱的测试

**指南原文：** `ai/test` 里有 `MockLanguageModelV4` 和 `simulateReadableStream`（从 `ai` 导出），用它们让脚本或组件在不调用真实模型的情况下跑通。预留约 1 小时摸索。

**做完你应该看到：** 断网时也能跑通一个用模拟模型的测试。

文档：[测试与模拟模型](https://ai-sdk.dev/docs/ai-sdk-core/testing)。已安装版本的打包文档在 `node_modules/ai/docs/03-ai-sdk-core/55-testing.mdx`，以它为准，不要凭记忆写 `doGenerate` / `doStream` 的返回形状。

| 项目 | 内容 |
| --- | --- |
| 目标 | 用模拟模型验证你的 schema / 流式渲染 / 评测逻辑，不花钱、可重复。 |
| 文件 | `tests/mock-model.ts`、`scripts/check-imports.ts` |
| 运行命令 | 先确认导入：已包含在 `pnpm verify` 里，也可看该脚本输出。练习：`pnpm test:mock` |
| 预期观察 | 现在跑 `pnpm test:mock` 会打印 TODO 并以退出码 1 结束，这是故意的。写完后应在无网络时成功退出（退出码 0）。 |
| 验收条件 | 断网（或把 baseURL 设成无效地址）也能跑通这个测试。 |

**具体小操作：**

1. 先读测试文档，对照 `generateText` + `Output.object` 的 mock 例子，再看 `streamText` + `simulateReadableStream` 的例子。
2. 打开 `tests/mock-model.ts`，用 `MockLanguageModelV4` 构造一个会返回合法评审 JSON 的模型，调用 `generateText` 或 `streamText`，断言（或打印并检查）得到的 `output` / 流式帧符合 `reviewSchema`。
3. 跑 `pnpm test:mock`。通过后再故意断网重跑一次，确认它没有落到真实接口。
4. 学有余力时，可以把同一套 mock 接到 `scripts/eval.ts`，用模拟输出验证召回率 / 误报率算得对不对。这不是本步的硬性验收。

---

## 命令速查

| 命令 | 会不会调用真实模型 | 作用 |
| --- | --- | --- |
| `pnpm install` | 否 | 安装依赖 |
| `pnpm verify` | 否 | 离线确认骨架可运行 |
| `pnpm typecheck` | 否 | 类型检查 |
| `pnpm step2:preview` | 否 | 第 2 步离线预览 |
| `pnpm step2:stream` | 是（你接上 TODO 之后） | 第 2 步真实流式 |
| `pnpm check-cases` | 否 | 第 3 步用例计数与格式 |
| `pnpm eval` | 否 | 第 4 步脚本默认模式 |
| `pnpm eval:run -- --limit=1` | 是（你接上 TODO 之后） | 先跑 1 条探路 |
| `pnpm eval:run` | 是（你接上 TODO 之后） | 全量评测 |
| `pnpm test:mock` | 否 | 第 5 步；现在是 TODO，写完应离线通过 |

## 和其它目录的关系

- `week3-structured-output`：继续放你的第 1 步实验，本目录不覆盖它。
- `code-review-agent`：主项目，本练习不要把实现填回去。评测集和脚本先在这里跑通。
