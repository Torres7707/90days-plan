// /cards —— 第 3 周：结构化评审卡片（useObject + reviewSchema）。
// 渲染规则来自 week3-cards-and-evals/src/render-partial.ts：
// 卡片用数组下标做 key 和编号；字段还没生成时显示“生成中...”；
// 流没结束时空数组仍算“生成中”，流结束后空数组才表示“没有问题”。
"use client";

import { useObject } from "@ai-sdk/react";
import Link from "next/link";
import { useState } from "react";
import { reviewSchema, type PartialIssue } from "@/lib/review-schema";
import { SAMPLE_CODE_FOR_STREAM } from "@/lib/sample-code";

type RunState = "idle" | "streaming" | "done" | "stopped" | "error";

const SEVERITY_LABEL = { high: "高", medium: "中", low: "低" } as const;
const PENDING = "生成中...";

export default function CardsPage() {
  const [code, setCode] = useState(SAMPLE_CODE_FOR_STREAM);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [run, setRun] = useState<RunState>("idle");
  const [failMessage, setFailMessage] = useState<string | null>(null);

  const { object, submit, stop, isLoading } = useObject({
    api: "/api/review/cards",
    schema: reviewSchema,
    onFinish: ({ error }) => {
      // error 是最终 JSON 不符合 schema（或被服务端追加了失败标记）时的 TypeValidationError
      if (error) {
        console.error(error);
        setFailMessage("评审结果不完整，请重试");
        setRun("error");
        return;
      }
      setRun("done");
    },
    onError: (error) => {
      // 网络错误、4xx/5xx。Stop 触发的中断由 onStop 自己处理状态。
      console.error(error);
      setFailMessage("评审失败，请稍后重试");
      setRun((prev) => (prev === "stopped" ? prev : "error"));
    },
  });

  function start(input: string) {
    setLastCode(input);
    setFailMessage(null);
    setRun("streaming");
    submit({ code: input });
  }

  function onStop() {
    stop();
    setRun("stopped");
  }

  const issues = object?.issues;
  const finished = run === "done";

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">结构化评审卡片（第 3 周）</h1>
        <Link href="/" className="text-sm underline underline-offset-4">
          ← 文字流式版（第 2 周）
        </Link>
      </header>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded-md border border-zinc-300 bg-transparent p-3 font-mono text-sm dark:border-zinc-700"
        placeholder="粘贴一段 React 代码"
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isLoading || code.trim() === ""}
          onClick={() => start(code)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isLoading ? "评审中..." : "评审"}
        </button>
        {isLoading && (
          <button type="button" onClick={onStop} className="rounded-md border px-4 py-2 text-sm">
            Stop
          </button>
        )}
      </div>

      {run === "error" && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-red-500/50 bg-red-500/5 p-3 text-sm">
          <span>{failMessage}</span>
          {lastCode && (
            <button type="button" onClick={() => start(lastCode)} className="underline underline-offset-4">
              重试
            </button>
          )}
        </div>
      )}

      {run === "stopped" && (
        <p className="text-sm text-zinc-500">
          已停止，下面是停止前收到的部分结果。
          {lastCode && (
            <button type="button" onClick={() => start(lastCode)} className="ml-2 underline underline-offset-4">
              重新评审
            </button>
          )}
        </p>
      )}

      {run !== "idle" && <Cards issues={issues} finished={finished} streaming={run === "streaming"} />}
    </main>
  );
}

function Cards({
  issues,
  finished,
  streaming,
}: {
  issues: (PartialIssue | undefined)[] | undefined;
  finished: boolean;
  streaming: boolean;
}) {
  if (!issues || (issues.length === 0 && !finished)) {
    return streaming ? <p className="text-sm text-zinc-500">卡片生成中...</p> : null;
  }
  if (issues.length === 0 && finished) {
    return <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">没有问题</p>;
  }

  return (
    <ol className="space-y-3">
      {issues.map((issue, i) => (
        // 用下标做 key：title 可能还没生成完，会变
        <li key={i} className="space-y-1 rounded-md border border-zinc-300 p-4 text-sm dark:border-zinc-700">
          <p className="font-medium">
            问题#{i + 1}：{issue?.title ?? PENDING}
          </p>
          <p>严重程度：{issue?.severity ? SEVERITY_LABEL[issue.severity] : PENDING}</p>
          <p>原因：{issue?.reason ?? PENDING}</p>
          <p>建议：{issue?.suggestion ?? PENDING}</p>
          {/* line 为 null 表示没有行号；流式过程中还没出现则显示占位 */}
          {issue?.line != null ? (
            <p>行号：{issue.line}</p>
          ) : !finished && issue?.line === undefined ? (
            <p>行号：{PENDING}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
