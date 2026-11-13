import { createOpenAICompatible } from "@ai-sdk/openai-compatible";


// TODO: 用了非空断言，并且在模块加载时就创建客户端。
// 触发：没填 LOCAL_LLM_*，或只跑 pnpm eval（默认模式也会 import 本文件）。
// 后果：缺配置时不会在这里得到明确错误，而是把 undefined 传进客户端，等到真正调用才出现难懂的失败；默认模式本不该依赖密钥。
// 期望：只在真正调用模型时再创建，缺环境变量时给出明确提示。
const local = createOpenAICompatible({
    name: 'local',
    baseURL: process.env.LOCAL_LLM_BASE_URL!,
    apiKey: process.env.LOCAL_LLM_API_KEY,
    supportsStructuredOutputs: true,
  });
  export const model = local(process.env.LOCAL_LLM_MODEL!);