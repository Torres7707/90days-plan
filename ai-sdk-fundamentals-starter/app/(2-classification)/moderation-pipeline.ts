import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import { createHash } from "crypto";
import { generateText, Output } from "ai";
import Redis from "ioredis";
import { z } from "zod";

const MODEL = "openai/gpt-5-mini";
const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT = { limit: 3, windowMs: 60_000 };

const classificationSchema = z.object({
  severity: z.enum(["safe", "warning", "critical"]),
  categories: z.array(z.enum(["spam", "violence", "pii", "other"])),
  confidence: z.number().min(0).max(1),
});

type Classification = z.infer<typeof classificationSchema>;

export type ModerationResult = Classification & {
  score: number;
  route: "allow" | "review" | "alert";
  cached: boolean;
};

export class RateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

type MessageContext = { clientId: string };

type Store = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
  increment(key: string, ttlMs: number): Promise<number>;
};

const memory = new Map<string, { value: string; expiresAt: number }>();

const memoryStore: Store = {
  async get(key) {
    const hit = memory.get(key);
    if (!hit || hit.expiresAt <= Date.now()) {
      memory.delete(key);
      return null;
    }
    return hit.value;
  },
  async set(key, value, ttlMs) {
    memory.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  async increment(key, ttlMs) {
    const now = Date.now();
    const hit = memory.get(key);
    const count =
      hit && hit.expiresAt > now ? Number(hit.value) + 1 : 1;
    memory.set(key, { value: String(count), expiresAt: hit && hit.expiresAt > now ? hit.expiresAt : now + ttlMs });
    return count;
  },
};

function redisStore(client: Redis): Store {
  return {
    async get(key) {
      return client.get(key);
    },
    async set(key, value, ttlMs) {
      await client.set(key, value, "PX", ttlMs);
    },
    async increment(key, ttlMs) {
      const count = await client.incr(key);
      if (count === 1) await client.pexpire(key, ttlMs);
      return count;
    },
  };
}

async function createStore(): Promise<{ store: Store; backend: "redis" | "memory" }> {
  const url = process.env.REDIS_URL;
  if (!url) return { store: memoryStore, backend: "memory" };

  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    enableOfflineQueue: false,
  });
  client.on("error", () => {});

  try {
    await client.connect();
    await client.ping();
    return { store: redisStore(client), backend: "redis" };
  } catch {
    client.disconnect();
    return { store: memoryStore, backend: "memory" };
  }
}

let storeReady: Promise<{ store: Store; backend: "redis" | "memory" }> | null = null;

function getStore() {
  storeReady ??= createStore();
  return storeReady;
}

function cacheKey(message: string) {
  const normalized = message.trim().replace(/\s+/g, " ");
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `moderation:v1:${hash}`;
}

function scoreClassification(classification: Classification) {
  const base = { safe: 5, warning: 50, critical: 85 }[classification.severity];
  return Math.min(100, Math.round(base + classification.confidence * 15));
}

function routeFor(classification: Classification, score: number): ModerationResult["route"] {
  if (classification.severity === "critical" || score >= 80) return "alert";
  if (classification.severity === "warning" || score >= 40) return "review";
  return "allow";
}

async function sendAlert(message: string, result: ModerationResult) {
  console.log(
    `[alert] score=${result.score} categories=${result.categories.join(",") || "none"} preview=${JSON.stringify(message.slice(0, 80))}`,
  );
}

async function classifyScoreRoute(message: string): Promise<ModerationResult> {
  const { store } = await getStore();
  const key = cacheKey(message);
  const cached = await store.get(key);
  if (cached) {
    return { ...(JSON.parse(cached) as Omit<ModerationResult, "cached">), cached: true };
  }

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: classificationSchema }),
    prompt: `You moderate one user message for an enterprise chat product.
Choose severity, categories, and confidence.
safe: ordinary conversation.
warning: spam, a mild policy risk, or possible personal data.
critical: a credible threat of violence, or clearly sensitive personal data such as a government id, full financial account number, or password.
categories: include only labels that apply, from spam, violence, pii, other.
confidence: 0 to 1 for this classification.

Message:
${message}`,
  });

  if (!output) throw new Error("Moderation model returned no structured output");

  const score = scoreClassification(output);
  const result: Omit<ModerationResult, "cached"> = {
    ...output,
    score,
    route: routeFor(output, score),
  };

  if (result.confidence >= 0.6) {
    await store.set(key, JSON.stringify(result), CACHE_TTL_MS);
  }
  if (result.route === "alert") await sendAlert(message, { ...result, cached: false });

  return { ...result, cached: false };
}

/** Rejects a client that exceeds the fixed-window limit before any model call. */
export function rateLimitMiddleware(
  handler: (message: string, ctx: MessageContext) => Promise<ModerationResult>,
  options = RATE_LIMIT,
) {
  return async (message: string, ctx: MessageContext) => {
    const { store } = await getStore();
    const bucket = Math.floor(Date.now() / options.windowMs);
    const count = await store.increment(`ratelimit:${ctx.clientId}:${bucket}`, options.windowMs);
    if (count > options.limit) {
      throw new RateLimitError(options.windowMs);
    }
    return handler(message, ctx);
  };
}

const guardedClassify = rateLimitMiddleware(async (message) => classifyScoreRoute(message));

export async function handleMessage(message: string, ctx: MessageContext = { clientId: "anonymous" }) {
  return guardedClassify(message, ctx);
}

export type IncomingMessage = { id: string; clientId: string; text: string };

export async function* moderateStream(messages: AsyncIterable<IncomingMessage>) {
  for await (const incoming of messages) {
    try {
      const result = await handleMessage(incoming.text, { clientId: incoming.clientId });
      yield { ...incoming, ok: true as const, result };
    } catch (error) {
      if (error instanceof RateLimitError) {
        yield { ...incoming, ok: false as const, error: "rate_limited" as const, retryAfterMs: error.retryAfterMs };
        continue;
      }
      throw error;
    }
  }
}

async function* demoMessages(): AsyncGenerator<IncomingMessage> {
  const clientId = "demo-client";
  const texts = [
    "Can you help me reset my weekly report filter?",
    "Can you help me reset my weekly report filter?",
    "Buy cheap followers now!!! Limited offer click here",
    "This fourth message should be rate limited",
  ];
  for (let i = 0; i < texts.length; i++) {
    yield { id: String(i + 1), clientId, text: texts[i] };
  }
}

async function main() {
  const { backend } = await getStore();
  console.log(`Moderation pipeline using ${backend} store (limit ${RATE_LIMIT.limit} messages / ${RATE_LIMIT.windowMs}ms)`);

  for await (const item of moderateStream(demoMessages())) {
    if (!item.ok) {
      console.log(`#${item.id} rate limited, retry after ${item.retryAfterMs}ms`);
      continue;
    }
    console.log(
      `#${item.id} route=${item.result.route} severity=${item.result.severity} score=${item.result.score} cached=${item.result.cached} categories=${item.result.categories.join(",") || "none"}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
