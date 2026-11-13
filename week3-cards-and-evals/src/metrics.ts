/**
 * 第 4 步要写的两个公式（指南原文）：
 * - 召回率 = 应发现且发现了 / 应发现总数
 * - 误报率 = 不应报却报了 / 正常用例总数
 *
 * 想一想：分母是 0 的时候你要返回什么？不要默默除零。
 * 如果分子是 0 呢？返回 0。
 */
export function recallRate(input: {
  shouldFindAndFound: number;
  shouldFindTotal: number;
}): number {
  if (input.shouldFindTotal === 0) return 0;
  return input.shouldFindAndFound / input.shouldFindTotal;
}

export function falsePositiveRate(input: {
  cleanButFlagged: number;
  cleanTotal: number;
}): number {
  if (input.cleanTotal === 0) return 0;
  return input.cleanButFlagged / input.cleanTotal;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
