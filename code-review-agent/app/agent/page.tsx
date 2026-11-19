"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { useMemo, useState, type ReactNode } from "react";
import { Streamdown } from "streamdown";

type MessagePart = UIMessage["parts"][number];

/** 覆盖 Streamdown 自带的 CodeBlock（语言头 + 复制/下载 + 双层边框），改成和页面一致的 zinc 样式。 */
function SimpleMarkdownCode({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: ReactNode;
  "data-block"?: boolean | string;
  node?: unknown;
}) {
  const isBlock =
    props["data-block"] != null || Boolean(className?.includes("language-"));
  const text = String(children ?? "").replace(/\n$/, "");

  if (isBlock) {
    return (
      <pre className="my-3 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100">
        <code className={className}>{text}</code>
      </pre>
    );
  }

  return (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
      {children}
    </code>
  );
}

type ToolOutput =
  | { ok: true; path: string; content: string; truncated: boolean }
  | { ok: false; error: string };

type ReviewTurn = {
  id: string;
  user: UIMessage;
  assistants: UIMessage[];
};

function isToolOutput(value: unknown): value is ToolOutput {
  if (!value || typeof value !== "object") return false;
  return "ok" in value;
}

function getInputPath(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  if (!("path" in input)) return undefined;
  const path = (input as { path: unknown }).path;
  return typeof path === "string" ? path : undefined;
}

function previewText(text: string, max = 200): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function userPreview(message: UIMessage): string {
  const text = message.parts
    .filter((part): part is Extract<MessagePart, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (!text) return "（无文本）";
  const firstLine = text.split("\n").find((line) => line.trim()) ?? text;
  return previewText(firstLine.trim(), 80);
}

function ToolPartCard({ part }: { part: MessagePart }) {
  if (!isToolUIPart(part)) return null;

  const toolName = getToolName(part);
  const path = getInputPath(part.input);
  const calling = part.state === "input-streaming" || part.state === "input-available";

  let statusLabel: string = part.state;
  let statusClass = "border-zinc-300 dark:border-zinc-700";
  let resultPreview: string | null = null;

  if (calling) {
    statusLabel = "调用中";
    statusClass = "border-amber-500/50 bg-amber-500/5";
  } else if (part.state === "output-available") {
    const output = isToolOutput(part.output) ? part.output : null;
    if (output?.ok === true) {
      statusLabel = "成功";
      statusClass = "border-emerald-500/50 bg-emerald-500/5";
      resultPreview = previewText(output.content);
    } else if (output?.ok === false) {
      statusLabel = `工具返回失败：${output.error}`;
      statusClass = "border-red-500/50 bg-red-500/5";
    } else {
      statusLabel = "成功";
      statusClass = "border-emerald-500/50 bg-emerald-500/5";
      resultPreview = previewText(JSON.stringify(part.output));
    }
  } else if (part.state === "output-error") {
    statusLabel = "执行出错";
    statusClass = "border-red-500/50 bg-red-500/5";
    resultPreview = part.errorText ? previewText(part.errorText) : null;
  }

  return (
    <div className={`space-y-1 rounded-md border p-3 text-sm ${statusClass}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{toolName}</p>
        <p className="text-xs text-zinc-500">{statusLabel}</p>
      </div>
      {path ? (
        <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">path: {path}</p>
      ) : null}
      {resultPreview ? (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">
          {resultPreview}
        </pre>
      ) : null}
    </div>
  );
}

function MessageParts({ message }: { message: UIMessage }) {
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (part.type === "text") {
          return (
            <div
              key={key}
              className="prose prose-sm max-w-none prose-zinc dark:prose-invert prose-headings:scroll-mt-4 prose-headings:font-semibold prose-p:my-2 prose-li:my-0.5 prose-code:before:content-none prose-code:after:content-none"
            >
              <Streamdown
                isAnimating={part.state === "streaming"}
                controls={{ code: false }}
                components={{ code: SimpleMarkdownCode }}
              >
                {part.text}
              </Streamdown>
            </div>
          );
        }
        if (isToolUIPart(part)) {
          return <ToolPartCard key={key} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

function groupReviewTurns(messages: UIMessage[]): ReviewTurn[] {
  const turns: ReviewTurn[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ id: message.id, user: message, assistants: [] });
      continue;
    }
    const current = turns[turns.length - 1];
    if (current) {
      current.assistants.push(message);
    } else {
      turns.push({
        id: message.id,
        user: message,
        assistants: [],
      });
    }
  }
  return turns;
}

export default function AgentPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/review/agent" }),
  });
  const isBusy = status === "submitted" || status === "streaming";
  const turns = useMemo(() => groupReviewTurns(messages), [messages]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">带工具的评审</h1>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={12}
        spellCheck={false}
        placeholder="粘贴一段 React 代码"
        className="w-full rounded-md border border-zinc-300 bg-transparent p-3 font-mono text-sm dark:border-zinc-700"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isBusy || input.trim().length === 0}
          onClick={() => sendMessage({ text: input })}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          评审
        </button>
        {isBusy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            停止
          </button>
        ) : null}
      </div>

      <section className="space-y-3">
        {turns.length === 0 ? (
          <p className="text-sm text-zinc-500">还没有评审记录。</p>
        ) : (
          [...turns].reverse().map((turn, index) => {
            const latest = index === 0;
            const turnNumber = turns.length - index;
            return (
              <details
                key={turn.id}
                open={latest}
                className="rounded-md border border-zinc-300 dark:border-zinc-700"
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-sm marker:content-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        评审 #{turnNumber}
                        {latest ? (
                          <span className="ml-2 text-xs font-normal text-zinc-500">最新</span>
                        ) : null}
                      </p>
                      <p className="truncate font-mono text-xs text-zinc-500">
                        {userPreview(turn.user)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">点击折叠/展开</span>
                  </div>
                </summary>
                <div className="space-y-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      输入代码
                    </p>
                    <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                      {turn.user.parts
                        .filter(
                          (part): part is Extract<MessagePart, { type: "text" }> =>
                            part.type === "text",
                        )
                        .map((part) => part.text)
                        .join("\n")}
                    </pre>
                  </div>
                  {turn.assistants.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      {latest && isBusy ? "评审中..." : "暂无回复"}
                    </p>
                  ) : (
                    turn.assistants.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          助手回复
                        </p>
                        <MessageParts message={message} />
                      </div>
                    ))
                  )}
                </div>
              </details>
            );
          })
        )}
      </section>
    </main>
  );
}
