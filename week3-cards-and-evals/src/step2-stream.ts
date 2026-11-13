/**
 * 第 2 步路径 A：用 streamText + Output.object({ schema }) + partialOutputStream
 * 把评审卡片“一张张”打出来。
 *
 * 先把 pnpm step2:preview 和 src/render-partial.ts 做完，再来接真实模型。
 * 文档：
 * - https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 * - https://ai-sdk.dev/docs/ai-sdk-ui/object-generation
 *
 * 这个脚本在你写完下面的 TODO 之前，不会调用模型。
 */
import { Output, streamText } from "ai";
import { getModel } from "./model.ts";
import { renderPartialReview } from "./render-partial.ts";
import { reviewSchema } from "./schema.ts";
import { SAMPLE_CODE_FOR_STREAM } from "./sample-code.ts";
import { buildReviewPrompt } from "./prompts.ts";
import { model } from "../model/index.ts";

async function main(): Promise<void> {
  const result = await streamText({
    model,
    output: Output.object({ schema: reviewSchema }),
    prompt: buildReviewPrompt(SAMPLE_CODE_FOR_STREAM),
  });
  let index = 0;
  for await (const partial of result.partialOutputStream) {
    console.log(`---------- 第 ${index + 1} 帧 ----------`);
    console.log(
      renderPartialReview({
        issues: partial.issues?.filter(
          (issue): issue is NonNullable<typeof issue> => issue != null,
        )
      }),
    )
    index += 1;
  }
  // 循环结束后
const finalReview = await result.output;
console.log(renderPartialReview(finalReview, true));
}

await main();
