import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tool } from "ai";
import { z } from "zod";

const MAX_CHARS = 4000;
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"] as const;
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "project",
);

type FileContentResult =
  | { ok: true; path: string; content: string; truncated: boolean }
  | { ok: false; error: string };

function isInsideProject(absolutePath: string): boolean {
  const relativeToRoot = path.relative(projectRoot, absolutePath);
  return !(
    relativeToRoot === "" ||
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  );
}

/** 模型常按 import 传 "./ProductCard"（无后缀）；补全常见扩展名再找。 */
async function resolveReadableFile(
  relativePath: string,
): Promise<{ absolutePath: string; relativeToRoot: string } | null> {
  const normalized = relativePath.replace(/^\.\//, "");
  const hasExtension = path.extname(normalized) !== "";
  const candidates = hasExtension
    ? [normalized]
    : [normalized, ...EXTENSIONS.map((ext) => normalized + ext)];

  for (const candidate of candidates) {
    const absolutePath = path.resolve(projectRoot, candidate);
    if (!isInsideProject(absolutePath)) continue;
    try {
      await access(absolutePath);
      return {
        absolutePath,
        relativeToRoot: path.relative(projectRoot, absolutePath),
      };
    } catch {
      // try next candidate
    }
  }
  return null;
}

export const getFileContent = tool({
  description:
    "Read one project file and return its text. Path is relative to the project root (e.g. ProductCard or ProductCard.tsx). Call this only when the code under review references another file and you need that file's content to decide whether there is a real issue.",
  inputSchema: z.object({
    path: z
      .string()
      .describe(
        "Project-relative path, with or without extension (e.g. ProductCard, ./ProductCard.tsx)",
      ),
  }),
  execute: async ({ path: relativePath }): Promise<FileContentResult> => {
    // ① 只能读 fixtures/project 里的文件
    const resolved = await resolveReadableFile(relativePath);
    if (!resolved) {
      const probe = path.resolve(
        projectRoot,
        relativePath.replace(/^\.\//, ""),
      );
      if (!isInsideProject(probe)) {
        return { ok: false, error: "不允许读取项目目录以外的文件" };
      }
      return {
        ok: false,
        error: `文件不存在：${relativePath}（可带或不带 .tsx/.ts 后缀）`,
      };
    }

    try {
      const raw = await readFile(resolved.absolutePath, "utf8");
      // ② 内容超过上限就截断，并在返回里带 truncated: true
      if (raw.length > MAX_CHARS) {
        return {
          ok: true,
          path: resolved.relativeToRoot,
          content: raw.slice(0, MAX_CHARS),
          truncated: true,
        };
      }
      return {
        ok: true,
        path: resolved.relativeToRoot,
        content: raw,
        truncated: false,
      };
    } catch (error) {
      // ③ 任何失败都 return { ok: false, error }，不要 throw
      return {
        ok: false,
        error: error instanceof Error ? error.message : "读取文件失败",
      };
    }
  },
});
