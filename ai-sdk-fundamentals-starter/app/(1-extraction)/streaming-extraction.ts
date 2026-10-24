import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import fs from "fs";
import path from "path";
import { generateText, streamText } from "ai";

const ESSAY_PATH = "app/(1-extraction)/essay.txt";
const CHECKPOINT_PATH = "app/(1-extraction)/.streaming-checkpoint.json";

/** 模拟大文档：把 essay 重复 N 次；练习时可改成 1 */
const REPEAT_FOR_DEMO = 3;

/** 每块大约字符数（真实场景可按 token 或段落切） */
const CHUNK_CHAR_SIZE = 1200;

const MODEL = "openai/gpt-5-mini";

// --- 类型：checkpoint = 可恢复进度 ---

interface ChunkResult {
  index: number;
  summary: string;
  /** MAP 阶段也可存结构化字段，reduce 时 merge */
  people: string[];
}

interface Checkpoint {
  version: 1;
  sourcePath: string;
  totalChunks: number;
  completed: number[]; // 已成功的 chunk 下标
  results: Record<string, ChunkResult>; // key = String(index)
}

// --- 切块：按字符切，尽量在换行处断开 ---

function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastBreak = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"));
      if (lastBreak > maxChars * 0.5) end = start + lastBreak;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}

function loadCheckpoint(): Checkpoint | null {
  if (!fs.existsSync(CHECKPOINT_PATH)) return null;
  return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf-8")) as Checkpoint;
}

function saveCheckpoint(cp: Checkpoint): void {
  const dir = path.dirname(CHECKPOINT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${CHECKPOINT_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cp, null, 2));
  fs.renameSync(tmp, CHECKPOINT_PATH); // 原子替换，减少写一半就 crash 的风险
}

function chunkMapPrompt(chunk: string, index: number, total: number): string {
  return `You are processing chunk ${index + 1} of ${total} of a long document.
Extract ONLY from this chunk (do not invent content from other sections).

Return plain text in exactly this format (no markdown fences):

SUMMARY: 2-3 sentence summary of this chunk.
PEOPLE: comma-separated person names mentioned here, or "none"

Chunk:
${chunk}`;
}

/** MAP：流式调用 + 解析简单格式 */
async function extractChunk(
  chunk: string,
  index: number,
  total: number,
): Promise<ChunkResult> {
  process.stdout.write(`\n[chunk ${index + 1}/${total}] streaming…\n`);

  const result = streamText({
    model: MODEL,
    prompt: chunkMapPrompt(chunk, index, total),
  });

  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }

  const raw = (await result.text).trim();
  const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?=PEOPLE:|$)/i);
  const peopleMatch = raw.match(/PEOPLE:\s*(.+)/i);

  const summary = (summaryMatch?.[1] ?? raw).trim();
  const peopleRaw = peopleMatch?.[1]?.trim() ?? "none";
  const people =
    peopleRaw.toLowerCase() === "none"
      ? []
      : peopleRaw.split(",").map((s) => s.trim()).filter(Boolean);

  return { index, summary, people };
}

/** REDUCE：合并块摘要 + 去重人名 */
async function reduceResults(partials: ChunkResult[]): Promise<void> {
  const ordered = [...partials].sort((a, b) => a.index - b.index);
  const block = ordered
    .map((p) => `### Section ${p.index + 1}\n${p.summary}`)
    .join("\n\n");

  const allPeople = [...new Set(ordered.flatMap((p) => p.people))];

  console.log("\n\n=== REDUCE: merging section summaries ===\n");

  const final = await generateText({
    model: MODEL,
    prompt: `Merge these section summaries into one coherent 150-word summary of the full document.
Preserve key themes; do not repeat the same point many times.

Section summaries:
${block}

Final summary:`,
  });

  console.log("\n--- Final summary ---\n");
  console.log(final.text);
  console.log("\n--- All people (deduped from chunks) ---\n");
  console.log(allPeople.join(", ") || "(none)");
}

async function main(): Promise<void> {
  const essay = fs.readFileSync(ESSAY_PATH, "utf-8");
  const document = Array(REPEAT_FOR_DEMO).fill(essay).join("\n\n");
  const chunks = splitIntoChunks(document, CHUNK_CHAR_SIZE);

  console.log(`Document length: ${document.length} chars → ${chunks.length} chunks`);

  let cp: Checkpoint =
    loadCheckpoint()?.sourcePath === ESSAY_PATH &&
    loadCheckpoint()!.totalChunks === chunks.length
      ? loadCheckpoint()!
      : {
          version: 1,
          sourcePath: ESSAY_PATH,
          totalChunks: chunks.length,
          completed: [],
          results: {},
        };

  // 若 essay 或切块方式变了，旧 checkpoint 无效，上面会重建

  for (let i = 0; i < chunks.length; i++) {
    if (cp.completed.includes(i)) {
      console.log(`[chunk ${i + 1}/${chunks.length}] skip (checkpoint)`);
      continue;
    }

    try {
      const result = await extractChunk(chunks[i], i, chunks.length);
      cp.results[String(i)] = result;
      cp.completed.push(i);
      cp.completed.sort((a, b) => a - b);
      saveCheckpoint(cp);
      console.log(`\n[chunk ${i + 1}] ✓ saved to checkpoint`);
    } catch (err) {
      console.error(`\n[chunk ${i + 1}] failed:`, err);
      console.log("Re-run the same command to resume from last completed chunk.");
      process.exit(1);
    }
  }

  const partials = cp.completed.map((i) => cp.results[String(i)]);
  await reduceResults(partials);

  // 可选：全部成功后删除 checkpoint
  // fs.unlinkSync(CHECKPOINT_PATH);
}

main().catch((error) => {
  console.error("❌ Pipeline failed:", error.message);
  process.exit(1);
});