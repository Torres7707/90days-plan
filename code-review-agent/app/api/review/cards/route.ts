// POST /api/review/cards —— 第 3 周：结构化评审卡片。
// 和第 2 周的 /api/review 并存：那条是 useChat + UI message stream（纯文字），
// 这条是 useObject + 文本流（模型按 reviewSchema 吐 JSON，前端边收边解析成不完整对象）。
import { Output, createTextStreamResponse, streamText } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/model";
import { buildReviewPrompt } from "@/lib/review-prompt";
import { reviewSchema } from "@/lib/review-schema";

export const maxDuration = 30;

const bodySchema = z.object({ code: z.string().min(1).max(20_000) });

// 流开始后出错时，toTextStreamResponse 会直接丢掉 error 部分，浏览器只会看到流“正常结束”，
// 可能把半截对象当成“没有问题”。追加一段标记让最终 JSON 解析失败，前端 onFinish 就会拿到 error。
const REVIEW_FAILED_MARKER = "\n[review failed]";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return Response.json({ error: "需要 { code: string }，且不超过 20000 字符" }, { status: 400 });
  }

  let model: ReturnType<typeof getModel>;
  try {
    model = getModel(); // 惰性创建：缺配置时在这里得到明确错误
  } catch (error) {
    console.error(error);
    return Response.json({ error: "服务端没有配置模型" }, { status: 500 });
  }

  const result = streamText({
    model,
    prompt: buildReviewPrompt(body.data.code),
    output: Output.object({ schema: reviewSchema }),
    abortSignal: req.signal, // 点 Stop 或关页面时，服务端也停止生成
  });

  const text = result.stream.pipeThrough(
    new TransformStream({
      transform(part, controller) {
        if (part.type === "text-delta") {
          controller.enqueue(part.text);
        } else if (part.type === "error") {
          // 完整错误只打服务端日志，不发给浏览器
          console.error("cards stream failed:", part.error);
          controller.enqueue(REVIEW_FAILED_MARKER);
        }
      },
    }),
  );

  return createTextStreamResponse({ stream: text });
}
