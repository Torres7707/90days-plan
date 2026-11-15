import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * 和第 1 步练习同一套接法。密钥从环境变量读，不要写进代码，也不要打印出来。
 * 离线步骤（preview / check-cases / eval 默认模式 / check-imports）不会走到这里。
 */
export function getModel() {
  const baseURL = process.env.LOCAL_LLM_BASE_URL;
  const modelName = process.env.LOCAL_LLM_MODEL;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const gatewayModel = process.env.AI_MODEL;

  if (baseURL && modelName) {
    const local = createOpenAICompatible({
      name: "local",
      baseURL,
      apiKey: process.env.LOCAL_LLM_API_KEY,
      supportsStructuredOutputs: true,
    });
    return local(modelName);
  }

  if (gatewayKey && gatewayModel) {
    return gatewayModel;
  }

  throw new Error(
    "缺少模型配置。请复制 .env.example 为 .env.local，填写 LOCAL_LLM_* 或 AI_GATEWAY_API_KEY + AI_MODEL。",
  );
}
