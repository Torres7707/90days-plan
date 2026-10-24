import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import { generateText, type LanguageModelUsage } from "ai";

const complexProblem = `
A company has 150 employees. They want to organize them into teams where:
- Each team has between 8-12 people
- No team should have exactly 10 people
- Teams should be as equal in size as possible
How should they organize the teams?
`;

function formatUsage(usage: LanguageModelUsage): string {
  const reasoning = usage.outputTokenDetails?.reasoningTokens;
  const lines = [
    `  input tokens:  ${usage.inputTokens ?? "n/a"}`,
    `  output tokens: ${usage.outputTokens ?? "n/a"}`,
    ...(reasoning != null ? [`  reasoning tokens: ${reasoning}`] : []),
    `  total tokens:  ${usage.totalTokens ?? "n/a"}`,
  ];
  return lines.join("\n");
}

function logUsage(label: string, usage: LanguageModelUsage) {
  console.log(`📈 ${label} usage:\n${formatUsage(usage)}\n`);
}

async function compareFastVsReasoning() {
  console.log("🚀 Testing fast model (gpt-5-mini)...");
  const startFast = Date.now();

  const fastResult = await generateText({
    model: "openai/gpt-5-mini",
    prompt: complexProblem,
  });

  const fastTime = Date.now() - startFast;
  console.log(`⏱️  Fast model time: ${fastTime}ms`);
  logUsage("Fast model", fastResult.usage);
  console.log(
    "📝 Result preview:",
    fastResult.text.substring(0, 200) + "...\n",
  );

  console.log("🧠 Testing reasoning model (gpt-5.2)...");
  const startReasoning = Date.now();

  const reasoningResult = await generateText({
    model: "openai/gpt-5.2",
    prompt: complexProblem,
  });

  const reasoningTime = Date.now() - startReasoning;
  console.log(`⏱️  Reasoning model time: ${reasoningTime}ms`);
  logUsage("Reasoning model", reasoningResult.usage);
  console.log(
    "📝 Result preview:",
    reasoningResult.text.substring(0, 200) + "...\n",
  );

  const fastUsage = fastResult.usage;
  const reasoningUsage = reasoningResult.usage;

  console.log("📊 Performance Comparison:");
  console.log(`- Fast model wall time:      ${fastTime}ms`);
  console.log(`- Reasoning model wall time: ${reasoningTime}ms`);
  const delta = reasoningTime - fastTime;
  const faster =
    delta === 0
      ? "same speed"
      : delta > 0
        ? `reasoning ${delta}ms slower than fast`
        : `reasoning ${Math.abs(delta)}ms faster than fast`;
  console.log(`- Wall time: ${faster}`);

  console.log("\n📊 Token Usage Comparison:");
  console.log(
    formatUsage(fastUsage)
      .split("\n")
      .map((line) => `- Fast:      ${line.trim()}`)
      .join("\n"),
  );
  console.log(
    formatUsage(reasoningUsage)
      .split("\n")
      .map((line) => `- Reasoning: ${line.trim()}`)
      .join("\n"),
  );

  const inDiff =
    (reasoningUsage.inputTokens ?? 0) - (fastUsage.inputTokens ?? 0);
  const outDiff =
    (reasoningUsage.outputTokens ?? 0) - (fastUsage.outputTokens ?? 0);
  const totalDiff =
    (reasoningUsage.totalTokens ?? 0) - (fastUsage.totalTokens ?? 0);
  console.log(
    `\n- Δ input / output / total (reasoning − fast): ${inDiff} / ${outDiff} / ${totalDiff}`,
  );

  const fastReasoning = fastUsage.outputTokenDetails?.reasoningTokens;
  const reasoningReasoning =
    reasoningUsage.outputTokenDetails?.reasoningTokens;
  if (fastReasoning != null || reasoningReasoning != null) {
    console.log(
      `- Reasoning tokens: fast=${fastReasoning ?? 0}, reasoning model=${reasoningReasoning ?? 0}`,
    );
  }

  console.log("\n🎯 Key Observations:");
  console.log(
    "- Wall time includes network, queue, and how long the model generates (often correlates with output tokens).",
  );
  console.log(
    "- Compare reasoning vs text output tokens to see if a model spent tokens on internal reasoning.",
  );
  console.log(
    "- For time-to-first-token, use streamText in a separate experiment (not measured here).",
  );
}

compareFastVsReasoning().catch(console.error);
