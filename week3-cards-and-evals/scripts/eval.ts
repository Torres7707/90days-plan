/**
 * 第 4 步：批量评测脚本。
 *
 * 默认模式只读用例、检查参数，不调用模型，也不会消耗额度。
 * 你把下面的 TODO 写完后，再运行：
 *   pnpm eval:run -- --limit=1
 * 确认单条跑通，再去掉 --limit 做全量（每条 3 次，注意费用和限流，先串行）。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateText, Output } from "ai";
import { evalCasesSchema, type EvalCase } from "../evals/case-schema.ts";
import { formatPercent } from "../src/metrics.ts";
import {
  hasReportedIssue,
  rate,
  summarizeReportStats,
  type ReportAttempt,
} from "../src/match.ts";
import { buildReviewPrompt, PROMPT_VERSION } from "../src/prompts.ts";
import { reviewSchema, type Review } from "../src/schema.ts";
import { model } from "../model/index.ts";

const REPEAT = 3;

function parseArgs(argv: string[]): { run: boolean; limit: number | undefined } {
  const run = argv.includes("--run");
  const limitIndex = argv.indexOf("--limit");
  const limitRaw = limitIndex === -1 ? undefined : argv[limitIndex + 1];
  const limit = limitRaw === undefined ? undefined : Number(limitRaw);
  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit 必须是正整数");
  }
  return { run, limit };
}

async function loadCases(): Promise<EvalCase[]> {
  const here = dirname(fileURLToPath(import.meta.url));
  const casesPath = join(here, "..", "evals", "cases.json");
  const raw: unknown = JSON.parse(await readFile(casesPath, "utf8"));
  return evalCasesSchema.parse(raw);
}

type ReviewAttempt =
  | { ok: true; evalCase: EvalCase; review: Review }
  | { ok: false; evalCase: EvalCase; error: string };

async function reviewOnce(evalCase: EvalCase): Promise<ReviewAttempt> {
  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: reviewSchema }),
      prompt: buildReviewPrompt(evalCase.code),
    });
    if (result.output == null) {
      return { ok: false, evalCase, error: "模型没有返回完整对象" };
    }
    return { ok: true, evalCase, review: result.output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, evalCase, error: message };
  }
}

function printHumanReview(results: { evalCase: EvalCase; review: Review }[]): void {
  console.log("======= 逐条结果（供人工核对）=======");
  console.log("程序只记录「有没有报问题」。人工核对栏一律为「待核对」，不会自动当成正确命中。");
  console.log("用例上的 keywords / note 只供对照，不参与自动判定。");

  const seen = new Set<string>();
  for (const { evalCase } of results) {
    if (seen.has(evalCase.id)) continue;
    seen.add(evalCase.id);
    const attempts = results.filter((item) => item.evalCase.id === evalCase.id);
    const keywords = evalCase.keywords ?? [];
    console.log("");
    console.log(`[${evalCase.expect}] ${evalCase.id}`);
    if (keywords.length > 0) {
      console.log(`  预期关键词（仅供人工对照）：${keywords.join("、")}`);
    }
    if (evalCase.note) {
      console.log(`  备注：${evalCase.note}`);
    }
    let reportedCount = 0;
    for (const [index, item] of attempts.entries()) {
      const reported = hasReportedIssue(item.review);
      if (reported) reportedCount += 1;
      const label = reported ? `报出问题（${item.review.issues.length} 条）` : "未报问题";
      console.log(`  第 ${index + 1} 次：${label}  人工核对：待核对`);
      for (const issue of item.review.issues) {
        console.log(`    - ${issue.title}`);
        console.log(`      原因：${issue.reason}`);
        console.log(`      建议：${issue.suggestion}`);
        if (issue.line !== undefined) {
          console.log(`      行号：${issue.line}`);
        }
      }
    }
    console.log(`  用例汇总：${attempts.length} 次中 ${reportedCount} 次报出问题`);
  }
}

function printStats(attempts: ReportAttempt[]): void {
  const stats = summarizeReportStats(attempts);
  const findCaseRate = rate(stats.findCasesReported, stats.findCaseCount);
  const cleanCaseRate = rate(stats.cleanCasesReported, stats.cleanCaseCount);
  const findAttemptRate = rate(stats.findAttemptsReported, stats.findAttemptCount);
  const cleanAttemptRate = rate(stats.cleanAttemptsReported, stats.cleanAttemptCount);

  console.log("");
  console.log("======= 统计（仅「有没有报问题」，不是正确识别召回率）=======");
  console.log("口径：");
  console.log("- 用例级分母是用例数。一条用例的 3 次先汇总：至少 1 次报出问题，才计入分子。");
  console.log("- 运行级分母是运行次数（每条 3 次各算一次）。不要和用例级分母混用。");
  console.log("- find 用例报出率 ≠ 正确识别召回率；是否报对了，需看上面的「待核对」。");
  console.log("- clean 用例误报率：程序把「报了问题」计为误报，语义上是否真是误报仍待核对。");
  console.log("");
  console.log("用例级：");
  console.log(
    `  find 用例报出率：${stats.findCasesReported}/${stats.findCaseCount} = ${formatPercent(findCaseRate)}（不是正确识别召回率）`,
  );
  console.log(
    `  clean 用例误报率：${stats.cleanCasesReported}/${stats.cleanCaseCount} = ${formatPercent(cleanCaseRate)}`,
  );
  console.log("运行级：");
  console.log(
    `  find 运行报出率：${stats.findAttemptsReported}/${stats.findAttemptCount} = ${formatPercent(findAttemptRate)}`,
  );
  console.log(
    `  clean 运行误报率：${stats.cleanAttemptsReported}/${stats.cleanAttemptCount} = ${formatPercent(cleanAttemptRate)}`,
  );
}

async function main(): Promise<void> {
  const { run, limit } = parseArgs(process.argv.slice(2));
  const cases = await loadCases();
  const selected = limit === undefined ? cases : cases.slice(0, limit);

  console.log(`已加载 ${cases.length} 条用例，本次计划处理 ${selected.length} 条。`);
  console.log(`提示词版本：${PROMPT_VERSION}；每条重复 ${REPEAT} 次。`);

  if (!run) {
    console.log("默认模式：不调用模型，也不写结果文件。");
    console.log("真正评测请运行：");
    console.log("  pnpm eval:run -- --limit=1");
    console.log("全量时请串行或小并发，避免限流；只跑 1 次不可靠。");
    return;
  }

  const attempts: ReviewAttempt[] = [];
  for (const evalCase of selected) {
    for (let i = 0; i < REPEAT; i++) {
      const attempt = await reviewOnce(evalCase);
      if (!attempt.ok) {
        console.warn(
          `[失败] ${evalCase.id} 第 ${i + 1}/${REPEAT} 次：${attempt.error.slice(0, 120)}`,
        );
      }
      attempts.push(attempt);
    }
  }

  const successes = attempts.filter(
    (item): item is Extract<ReviewAttempt, { ok: true }> => item.ok,
  );
  const failures = attempts.filter((item) => !item.ok);

  const reportAttempts: ReportAttempt[] = successes.map((item) => ({
    caseId: item.evalCase.id,
    expect: item.evalCase.expect,
    reportedIssue: hasReportedIssue(item.review),
  }));

  printHumanReview(successes);
  if (failures.length > 0) {
    console.log("");
    console.log(`======= 解析/生成失败 ${failures.length} 次（未计入报出率）=======`);
    for (const item of failures) {
      console.log(`  - ${item.evalCase.id}: ${item.error.slice(0, 160)}`);
    }
  }
  printStats(reportAttempts);

  console.log("--------------------------------");
  console.log("处理用例数：", selected.length);
  console.log(
    "运行次数：",
    attempts.length,
    `（成功 ${successes.length}，失败 ${failures.length}；每条计划重复 ${REPEAT} 次）`,
  );
  console.log("提示词版本：", PROMPT_VERSION);
  console.log("日期：", new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }));
  console.log("--------------------------------");

  const here = dirname(fileURLToPath(import.meta.url));
  const resultsDir = join(here, "..", "results");
  await mkdir(resultsDir, { recursive: true });
  const stamp = new Date()
    .toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    .replace(/\//g, "-")
    .replace(/[,\s:]+/g, "_");
  await writeFile(
    join(resultsDir, `results-${stamp}.json`),
    JSON.stringify(
      {
        promptVersion: PROMPT_VERSION,
        date: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
        attempts,
      },
      null,
      2,
    ),
  );
}

await main();
