import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evalCasesSchema } from "../evals/case-schema.ts";

const TARGET_TOTAL = 24;
const TARGET_EACH = 12;

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const casesPath = join(here, "..", "evals", "cases.json");
  const raw: unknown = JSON.parse(await readFile(casesPath, "utf8"));
  const cases = evalCasesSchema.parse(raw);

  const find = cases.filter((item) => item.expect === "find");
  const clean = cases.filter((item) => item.expect === "clean");
  const ids = cases.map((item) => item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const findMissingKeywords = find.filter(
    (item) => !item.keywords || item.keywords.length === 0,
  );

  console.log("评测用例检查（不调用模型）");
  console.log(`- 总数：${cases.length} / ${TARGET_TOTAL}`);
  console.log(`- expect=find：${find.length} / ${TARGET_EACH}`);
  console.log(`- expect=clean：${clean.length} / ${TARGET_EACH}`);

  if (duplicates.length > 0) {
    console.log(`- 重复 id：${[...new Set(duplicates)].join(", ")}`);
  }
  if (findMissingKeywords.length > 0) {
    console.log(
      `- 应发现但还没写 keywords 的用例：${findMissingKeywords.map((item) => item.id).join(", ")}`,
    );
  }

  const complete =
    cases.length === TARGET_TOTAL &&
    find.length === TARGET_EACH &&
    clean.length === TARGET_EACH &&
    duplicates.length === 0 &&
    findMissingKeywords.length === 0;

  if (complete) {
    console.log("验收：24 条、12/12、每条都有标注。可以进入第 4 步。");
    return;
  }

  console.log("骨架检查通过，但第 3 步还没完成。请继续往 evals/cases.json 里加用例。");
  console.log("提示：hooks 条件调用、缺依赖、key 用 index、直接改 state；正常代码各 12 条。");
  console.log("可参考：https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks/__tests__");
}

await main();
