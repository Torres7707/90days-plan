"use server";

import { generateText, Output } from "ai";
import { z } from "zod";

// TODO: Define the structure for our summary
// Create a Zod schema with these fields:
// - headline (string)
// - context (string)
// - discussionPoints (string)
// - takeaways (string)
// const summarySchema = z.object({
//   headline: z
//     .string()
//     .describe("The main topic or title of the summary. Max 5 words."), // Concise headline
//   context: z.string().describe(
//     "Briefly explain the situation or background that led to this discussion. Max 2 sentences.", // Length guidance
//   ),
//   discussionPoints: z
//     .string()
//     .describe("Summarize the key topics discussed. Max 2 sentences."), // Focused points
//   takeaways: z.string().describe(
//     "List the main decisions, action items, or next steps. **Include names** for assigned tasks. Max 2-3 bullet points or sentences.", // Specific instructions!
//   ),
// });

const oneSentence = z
  .string()
  .describe("Exactly one sentence, 20 words or fewer. No line breaks, no bullets.");

const summarySchema = z.object({
  headline: z
    .string()
    .describe("At most 5 words. No period."),
  context: z
    .array(oneSentence)
    .min(1)
    .max(2)
    .describe("One sentence per item. 1 or 2 items."),
  discussionPoints: z
    .array(oneSentence)
    .min(1)
    .max(2)
    .describe("One topic per item. 1 or 2 items. Do not join them into a paragraph."),
  takeaways: z
    .array(
      z.string().describe(
        "One decision or action, 15 words or fewer. Plain text. Include the owner name when the comments name one. Do not start with a dash or number.",
      ),
    )
    .min(2)
    .max(3)
    .describe("Exactly 2 or 3 items."),
});

export const generateSummary = async (comments: any[]) => {
  console.log("Generating summary for", comments.length, "comments...");

  // TODO: Use generateText with Output.object() to create the summary
  // - Model: 'openai/gpt-5-mini'
  // - Prompt: Ask to summarize the comments, focusing on key decisions and action items
  // - Output: Output.object({ schema: yourSchema })
  // - Return the generated summary from the 'output' property
  const { output: summary } = await generateText({
      model: "openai/gpt-5-mini",
      prompt: `Summarize the comments into the schema.
    - headline: 5 words maximum.
    - context and discussionPoints: each array item is one sentence. Never put two sentences in one item.
    - takeaways: 2 or 3 items. Each item is one action. No markdown and no bullet characters.
    - Stop instead of adding another sentence.
    
    Example:
    {"headline":"Auth tests block launch","context":["The launch is waiting on missing auth tests."],"discussionPoints":["Auth coverage is the only open blocker."],"takeaways":["Ava adds auth tests by Friday.","Ben updates the launch checklist."]}
    
    Comments:
    ${JSON.stringify(comments)}`,
      output: Output.object({ schema: summarySchema }),
    });
  console.log("Summary generated:", summary);
  return summary;
};
