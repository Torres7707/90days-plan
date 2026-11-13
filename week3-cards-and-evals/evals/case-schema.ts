import { z } from "zod";

export const evalCaseSchema = z
  .object({
    id: z.string().min(1),
    code: z.string().min(1),
    expect: z.enum(["find", "clean"]),
    keywords: z.array(z.string().min(1)).optional(),
    note: z.string().optional(),
  })
  .strict();

export const evalCasesSchema = z.array(evalCaseSchema);

export type EvalCase = z.infer<typeof evalCaseSchema>;
