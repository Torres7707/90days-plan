# Harness Engineering 到底是什么（马克的技术工作坊）

视频：https://www.youtube.com/watch?v=7nCzfgDjSo8
整理日期：2026-10-31（根据视频字幕整理，下面是视频里的说法）

## 三个概念，范围层层扩大

| 概念 | 研究什么 |
| --- | --- |
| Prompt Engineering | 怎么问：把发给模型的话说清楚 |
| Context Engineering | 给什么信息：在合适的时机把合适的内容放进 Context（如上下文压缩、动态检索、渐进式披露） |
| Harness Engineering | 怎么搭系统：围绕模型搭一个完整可靠的 Agent |

**Harness（马具）= Agent - Model**，除模型以外的所有东西（规则文件、工具、权限、调度等）都算。作者强调：业界还没有严格定义。

## OpenAI 的实践

约 5 个月、近 100 万行代码，工程师不手写代码。作者把做法分三类：

1. **上下文管理**
   - 不用一个超大的 `AGENTS.md`（内容太多模型会迷失，也会腐化），只放约 100 行的目录，细节分文件放。
   - 重要决策和约定都搬进代码仓库，仓库是唯一的事实来源。
2. **验证与反馈**
   - 让 Agent 能自己截图、看 DOM、读日志和指标。
   - 用 linter 和测试检查架构规范，报错喂回 Agent，自动修复，形成闭环。
   - 规定分层依赖：UI、Runtime、Service、Repo、Config、Types，只能依赖下层。
3. **清理技术债**：后台任务定期扫描代码和文档，自动修复过时、违规的地方。

核心观点：**Humans steer, Agents execute**（人类掌舵，Agent 干活）。

## Anthropic 的实践

- **Planner** 把模糊需求拆成功能列表；**Generator** 写代码；**Evaluator** 评估。
- 为什么要拆：Agent 自己评自己会护短。
- 代价：Full Harness 约 6 小时、200 美元；单 Agent 约 20 分钟、9 美元。
- 模型变强后（Opus 4.6），"一次只做一个功能点"这类约束就不需要了。

## 争议

- 这个词 2 月由 Mitchell Hashimoto 随口提出，OpenAI 的文章让它火起来。
- 里面没有新技术，只是新的组织方式。
- 作者的看法：不是噱头，但也不是终局，更像过渡期的关键技术（模型越强，需要的 Harness 越少）。

## 和我的 React 代码评审 Agent 的关系

- Evaluator 和 Generator 分开：我的评审 Agent 本身就是个 Evaluator。
- `AGENTS.md` 只放目录、细节分文件：可用于第 6 周写 Skill。
- linter 加测试把报错喂回 Agent：第 4 周工具调用循环的真实例子。

## 我自己的理解（看完后用自己的话补）

- 
