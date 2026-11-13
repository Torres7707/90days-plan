import type { Review } from "./schema.ts";

/**
 * 程序只判断「有没有报问题」（issues.length > 0），不判断「报得对不对」。
 * 返回 true 只表示模型给出了至少一条 issue，不是正确命中，也不能拿去当召回率。
 * 语义是否正确需人工核对。
 */
export function hasReportedIssue(review: Review): boolean {
  return review.issues.length > 0;
}

export type ReportAttempt = {
  caseId: string;
  expect: "find" | "clean";
  reportedIssue: boolean;
};

export type ReportStats = {
  findCaseCount: number;
  findCasesReported: number;
  cleanCaseCount: number;
  cleanCasesReported: number;
  findAttemptCount: number;
  findAttemptsReported: number;
  cleanAttemptCount: number;
  cleanAttemptsReported: number;
};

/** 分母为 0 时返回 0，避免除零。 */
export function rate(count: number, total: number): number {
  if (total === 0) return 0;
  return count / total;
}

/**
 * 用例级分子：该用例至少有一次「报出了问题」。
 * 运行级分母是成功记录的次数（每条用例的每次运行各算一次），不要和用例级分母混用。
 */
export function summarizeReportStats(attempts: ReportAttempt[]): ReportStats {
  const byCase = new Map<string, ReportAttempt[]>();
  for (const attempt of attempts) {
    const existing = byCase.get(attempt.caseId);
    if (existing) {
      const previousExpect = existing[0]?.expect;
      if (previousExpect !== undefined && previousExpect !== attempt.expect) {
        throw new Error(`用例 ${attempt.caseId} 的 expect 不一致`);
      }
      existing.push(attempt);
    } else {
      byCase.set(attempt.caseId, [attempt]);
    }
  }

  const stats: ReportStats = {
    findCaseCount: 0,
    findCasesReported: 0,
    cleanCaseCount: 0,
    cleanCasesReported: 0,
    findAttemptCount: 0,
    findAttemptsReported: 0,
    cleanAttemptCount: 0,
    cleanAttemptsReported: 0,
  };

  for (const list of byCase.values()) {
    const first = list[0];
    if (first === undefined) continue;
    const reportedCount = list.filter((item) => item.reportedIssue).length;
    const reportedInAnyAttempt = reportedCount > 0;
    if (first.expect === "find") {
      stats.findCaseCount += 1;
      if (reportedInAnyAttempt) stats.findCasesReported += 1;
      stats.findAttemptCount += list.length;
      stats.findAttemptsReported += reportedCount;
    } else {
      stats.cleanCaseCount += 1;
      if (reportedInAnyAttempt) stats.cleanCasesReported += 1;
      stats.cleanAttemptCount += list.length;
      stats.cleanAttemptsReported += reportedCount;
    }
  }

  return stats;
}
