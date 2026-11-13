import type { PartialReview } from "./schema.ts";

/**
 * 第 2 步要写的渲染函数。
 *
 * 当前实现只是把快照原样印出来，方便你先观察“不完整对象”长什么样。
 * 请改成卡片格式，并满足：
 * - 某个字段还是 undefined 时不要把 "undefined" 印出来，严重程度用占位，例如「严重程度：…」
 * - 卡片编号用数组下标（#1 #2），不要用可能还没生成完的 title 当唯一标识
 * - issues 还是 undefined 或空数组时，也要有合理显示，不能崩溃
 */
/**
 * 
 * @param partial 部分评审结果
 * @param isFinal 是否是最终结果
 * @returns 
 */
export function renderPartialReview(partial: PartialReview, isFinal: boolean = false): string {
  const {issues} = partial;
  // issues 为空数组和 issues 尚未出现，现在都显示成「卡片生成中...」。
  // 触发：流式中间帧可能是 []（数组还没长出来）；评审正常代码时，最终结果也是 { issues: [] }。
  // 后果：已经生成完毕且没有问题时，界面仍像还在生成，无法验收「没有问题」的终态。
  // 期望：流尚未结束时不要把空数组当成最终结论；流结束后，空数组应表示没有问题，而不是继续「生成中」。
  if (!issues||issues.length === 0 && !isFinal) {
    return `卡片生成中...`;
  } else if (issues.length === 0 && isFinal) {
    return `没有问题`;
  }
  const result= issues.map((issue,i)=>{
    const {title,severity,reason,suggestion,line} = issue;
return `问题#${i + 1}：${title??"生成中..."}
严重程度：${severity??"生成中..."}
原因：${reason??"生成中..."}
建议：${suggestion??"生成中..."}
行号：${line??"生成中..."}`;
  }).join("\n");
  

  return result;
}
