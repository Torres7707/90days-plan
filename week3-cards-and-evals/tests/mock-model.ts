/**
 * 第 5 步：用模拟模型写一个不花钱的测试。
 *
 * 从 ai/test 导入 MockLanguageModelV4，从 ai 导入 simulateReadableStream。
 * 用它们让 generateText 或 streamText（配同一个 reviewSchema）在不访问网络的情况下跑通。
 *
 * 文档（以已安装的 7.x 为准，也可看打包文档）：
 * - https://ai-sdk.dev/docs/ai-sdk-core/testing
 * - node_modules/ai/docs/03-ai-sdk-core/55-testing.mdx
 *
 * 预留约 1 小时摸索。doGenerate / doStream 的返回形状以当前版本文档为准，不要凭记忆写。
 *
 * 这个脚本在你写完 TODO 之前不会访问网络。
 */
import { generateText, Output, simulateReadableStream, streamText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { reviewSchema } from "../src/schema.ts";

async function main(): Promise<void> {
  void [generateText, streamText, Output, simulateReadableStream, MockLanguageModelV4, reviewSchema];

  console.log("TODO：还没有写模拟模型测试。");
  console.log("- 先读 https://ai-sdk.dev/docs/ai-sdk-core/testing");
  console.log("- 可以先做 generateText + Output.object 的 doGenerate 例子，再试 streamText + simulateReadableStream。");
  console.log("- 验收：拔掉网络（或设成无效 baseURL）也能跑通。");
  process.exitCode = 1;
}

await main();
