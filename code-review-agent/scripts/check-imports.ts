import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

console.log("离线导入检查（不调用模型，不需要 API key）");
console.log(`- MockLanguageModelV4: ${typeof MockLanguageModelV4}`);
console.log(`- simulateReadableStream: ${typeof simulateReadableStream}`);

if (typeof MockLanguageModelV4 !== "function") {
  throw new Error("MockLanguageModelV4 不是构造函数，请检查 ai 版本是否为 7.x");
}
if (typeof simulateReadableStream !== "function") {
  throw new Error("simulateReadableStream 未从 ai 导出，请查看 node_modules/ai/docs");
}

console.log("骨架可用。第 5 步请打开 tests/mock-model.ts，自己写一个不花钱的测试。");
