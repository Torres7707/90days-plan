/**
 * 改提示词时请同时改 PROMPT_VERSION，这样评测结果才能对上版本。
 * 第 6 步（改两次提示词做对比）不在本次起始项目的范围内，但脚本会把版本写进结果文件。
 */
export const PROMPT_VERSION = "v0-baseline";

export function buildReviewPrompt(code: string): string {
  // TODO：写出你认为“一次好的评审”该怎么要求模型。
  // 可以先写最短能跑的一版，等第 4 步拿到基线后再改。
  return [
    "请评审下面的 React 代码。",
    "只返回符合 schema 的完整 JSON 对象，不要额外解释。",
    "issues 里每条必须包含 title、reason、suggestion、severity；line 可选。",
    "没有问题时，issues 为空数组 []。",
    "只报明确问题，条目尽量精简，确保 JSON 完整可解析。",
    "",
    "代码：",
    code,
  ].join("\n");
}
