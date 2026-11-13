import { z } from "zod";

/**
 * 第 1 步已经在 week3-structured-output 里练过。
 * 这里按第 3 周指南给出字段清单，供第 2–5 步共用。
 * .describe() 的措辞可以按你的理解再改，它会进发给模型的 schema。
 *
 * line 是可选行号：想想用 .optional() 还是 .nullable() 更合适
 *（和 11/10 那道 endLine 题是同一类问题）。
 */
export const issueSchema = z.object({
  title: z.string().describe("一句话问题"),
  reason: z.string().describe("为什么这是问题"),
  suggestion: z.string().describe("建议怎么改"),
  severity: z.enum(["high", "medium", "low"]).describe("严重程度"),
  line: z.number().optional().describe("相关代码行号，没有则省略"),
});

export const reviewSchema = z.object({
  issues: z
    .array(issueSchema)
    .describe("发现的问题列表；没有问题则为空数组"),
});

export type Issue = z.infer<typeof issueSchema>;
export type Review = z.infer<typeof reviewSchema>;

/** 流式过程中对象是不完整的，字段可能还是 undefined。 */
export type PartialIssue = {
  title?: string;
  reason?: string;
  suggestion?: string;
  severity?: "high" | "medium" | "low";
  line?: number;
};

export type PartialReview = {
  issues?: PartialIssue[];
};

export const handwrittenExample: Review = reviewSchema.parse({
  issues: [
    {
      title: "在条件语句里调用了 Hook",
      reason: "违反 Rules of Hooks，会导致 Hook 顺序不稳定。",
      suggestion: "把 Hook 挪到组件顶层，用条件决定 Hook 内部的逻辑。",
      severity: "high",
      line: 3,
    },
  ],
});
