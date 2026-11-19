// PROTOTYPE: three UI variants of the review home, switchable via ?variant=
// "Three variants of the code-review page on `/`, via ?variant=A|B|C."
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { MyUIMessage } from "@/lib/types";
import { PrototypeSwitcher } from "@/app/components/PrototypeSwitcher";
import { VariantA, VARIANT_NAME as NAME_A } from "@/app/prototype-ui/VariantA";
import { VariantB, VARIANT_NAME as NAME_B } from "@/app/prototype-ui/VariantB";
import { VariantC, VARIANT_NAME as NAME_C } from "@/app/prototype-ui/VariantC";
import type { ReviewUiProps } from "@/app/prototype-ui/types";

const VARIANTS = [
  { key: "A", name: NAME_A },
  { key: "B", name: NAME_B },
  { key: "C", name: NAME_C },
] as const;

function HomePrototype() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("variant") ?? "A";
  const variant = VARIANTS.some((v) => v.key === raw) ? raw : "A";

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error, clearError } =
    useChat<MyUIMessage>({
      transport: new DefaultChatTransport({ api: "/api/review" }),
    });

  const isBusy = status === "streaming";

  const props: ReviewUiProps = {
    input,
    setInput,
    messages,
    isBusy,
    error,
    onReview: () => {
      sendMessage(
        { text: input },
        {
          body: {
            customKey: "customValue",
          },
        },
      );
    },
    onStop: () => stop(),
    onClearError: () => clearError(),
  };

  return (
    <>
      {variant === "A" && <VariantA {...props} />}
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      <PrototypeSwitcher variants={[...VARIANTS]} current={variant} />
      <div className="fixed right-4 top-4 z-[9999] flex flex-col items-end gap-2">
        {/* 第 3 周：结构化卡片版在 /cards */}
        <Link
          href="/cards"
          className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-100 shadow"
        >
          结构化卡片版（第 3 周）→
        </Link>
        {/* 第 4 周：带工具调用的 agent 在 /agent */}
        <Link
          href="/agent"
          className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-100 shadow"
        >
          工具调用版（第 4 周）→
        </Link>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="p-8 text-sm opacity-50">Loading…</main>}>
      <HomePrototype />
    </Suspense>
  );
}
