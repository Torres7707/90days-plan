"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { Streamdown } from "streamdown";

type MessagePart = UIMessage["parts"][number];

function ToolPartView({ part }: { part: MessagePart }) {
  const toolName = part.type.startsWith("tool-")
    ? part.type.slice("tool-".length)
    : part.type;
  const state = "state" in part ? String(part.state) : "unknown";
  const input = "input" in part ? part.input : undefined;
  const output = "output" in part ? part.output : undefined;
  const errorText = "errorText" in part ? part.errorText : undefined;

  return (
    <pre className="overflow-x-auto rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
      {JSON.stringify({ tool: toolName, state, input, output, errorText }, null, 2)}
    </pre>
  );
}

export default function AgentPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/review/agent" }),
  });
  const isBusy = status === "submitted" || status === "streaming";

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
      <div className="space-y-4">
        {messages.map((message) => (
          <article key={message.id} className="space-y-2">
            {message.parts.map((part, index) => {
              const key = `${message.id}-${index}`;
              if (part.type === "text") {
                return (
                  <Streamdown
                    key={key}
                    isAnimating={part.state === "streaming"}
                  >
                    {part.text}
                  </Streamdown>
                );
              }
              // useChat 里工具 part 的 type 形如 tool-getFileContent
              if (part.type.startsWith("tool-")) {
                return <ToolPartView key={key} part={part} />;
              }
              return null;
            })}
          </article>
        ))}
      </div>
    </main>
  );
}
