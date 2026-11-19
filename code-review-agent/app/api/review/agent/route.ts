import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getModel } from "@/lib/model";
import { REVIEW_PROMPT } from "@/lib/prompt";
import { getFileContent } from "@/lib/tools";

export const maxDuration = 30;

const tools = { getFileContent };

export async function POST(req: Request) {
  let messages: UIMessage[];
  try {
    ({ messages } = (await req.json()) as { messages: UIMessage[] });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }

  let model: ReturnType<typeof getModel>;
  try {
    model = getModel();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "服务端没有配置模型" }, { status: 500 });
  }

  console.log("[agent] ui messages", JSON.stringify(messages, null, 2));
  const modelMessages = await convertToModelMessages(messages, { tools });
  console.log("[agent] model messages", JSON.stringify(modelMessages, null, 2));

  const result = streamText({
    model,
    instructions: `${REVIEW_PROMPT}
When the code imports or references another file, call getFileContent before judging an issue that depends on that file.`,
    messages: modelMessages,
    tools,
    abortSignal: req.signal,
    // 如果超过3步，则停止
    stopWhen: isStepCount(3),

    // 工具调用全生命周期：看终端（pnpm dev）输出
    onStart({ callId, modelId }) {
      console.log("[agent] start", { callId, modelId });
    },
    onStepStart({ stepNumber, messages: stepMessages }) {
      console.log(`[agent] step ${stepNumber} start`);
      console.log(
        `[agent] step ${stepNumber} messages`,
        JSON.stringify(stepMessages, null, 2),
      );
    },
    prepareStep: ({ stepNumber, messages: stepMessages }) => {
      console.log(
        `[agent] prepareStep ${stepNumber} messages`,
        JSON.stringify(stepMessages, null, 2),
      );
      return {};
    },
    onToolExecutionStart({ toolCall }) {
      console.log("[agent] tool start", {
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        input: toolCall.input,
      });
    },
    onToolExecutionEnd({ toolCall, toolExecutionMs, toolOutput }) {
      console.log("[agent] tool end", {
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        ms: toolExecutionMs,
        ...(toolOutput.type === "tool-result"
          ? { ok: true, output: toolOutput.output }
          : { ok: false, error: toolOutput.error }),
      });
    },
    onStepEnd({ stepNumber, finishReason, toolCalls, text }) {
      console.log(`[agent] step ${stepNumber} end`, {
        finishReason,
        toolCalls: toolCalls.map((call) => call.toolName),
        textPreview: text.slice(0, 120),
      });
    },
    onEnd({ finishReason }) {
      console.log("[agent] end", { finishReason });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (error) => {
        console.error(error);
        return "评审失败，请稍后重试";
      },
    }),
  });
}
