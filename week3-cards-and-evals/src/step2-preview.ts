import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPartialReview } from "./render-partial.ts";
import { z } from "zod";

const delayMs = Number(process.env.STEP2_DELAY_MS ?? (process.env.CI ? 0 : 400));

const partialIssueSchema = z
  .object({
    title: z.string().optional(),
    reason: z.string().optional(),
    suggestion: z.string().optional(),
    severity: z.enum(["high", "medium", "low"]).optional(),
    line: z.number().optional(),
  })
  .strict();

const frameSchema = z
  .object({
    issues: z.array(partialIssueSchema).optional(),
  })
  .strict();

const fixtureSchema = z.object({
  frames: z.array(frameSchema).min(1),
});

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const fixturePath = join(here, "..", "fixtures", "partial-review-stream.json");
  const raw: unknown = JSON.parse(await readFile(fixturePath, "utf8"));
  const fixture = fixtureSchema.parse(raw);

  console.log("第 2 步离线预览：回放一段已经录好的 partialOutputStream 快照。");
  console.log("不调用模型，也不需要 API key。\n");

  for (const [index, frame] of fixture.frames.entries()) {
    console.log(`---------- 第 ${index + 1}/${fixture.frames.length} 帧 ----------`);
    console.log(renderPartialReview(frame));
    console.log("");
    await sleep(delayMs);
  }

  console.log("观察要点：");
  console.log("- 前面几帧的字段是缺的，最后几帧才完整。");
  console.log("- 先改 src/render-partial.ts，再重新运行 pnpm step2:preview。");
  console.log("- 改完后：不要出现 undefined，缺严重程度要有占位，卡片用下标编号。");
  console.log("- 接真实模型是下一步：pnpm step2:stream（会消耗额度，先不要跑）。");
}

await main();
