// 第三周：Structured Output 练习场
// 运行：pnpm start
// 这里故意留空，由你自己写。

import { generateText, isStepCount, Output, streamText, tool } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

/*
 * Generating Structured Outputs
 */
const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
  steps: z.array(z.string()),
});
// const recipe= await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   output: Output.object({
//     schema: recipeSchema,
//   }),
//   prompt: 'Generate a lasagna recipe.',
// });
// const {output} = recipe;
// console.log("Generating Structured Outputs:",output);
/**
 * Stream Structured Outputs
 */
// const streamRecipe= await streamText({
//   model: "openai/gpt-4o-mini-fast",
//   output: Output.object({
//     schema: recipeSchema,
//   }),
//   prompt: 'Generate a lasagna recipe.',
// });
// const { partialOutputStream } = streamRecipe;
// for await (const chunk of partialOutputStream) {
//   console.log("Stream Structured Outputs:",chunk);
// }

/**
 * Error Handling in Streams
 */
// const errorStream= await streamText({
//     model: "openai/gpt-4o-mini-fast1111",
//     output: Output.object({
//       schema: recipeSchema,
//     }),
//     onError: (error) => {
//       console.error("Error in stream:",error);
//     },
//     prompt: 'Generate a lasagna recipe.',
//   });
// for await (const chunk of errorStream.partialOutputStream) {
//   console.log("Error in stream:",chunk);
// }

/**
 * output types
 */
// text
// const textOutput= await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   prompt: "What is the capital of France?",
//   output: Output.text(),
// });
// console.log("Text Output:",textOutput.output);
// object
// const objectOutput= await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   prompt: "What is the capital of France?",
//   output: Output.object({
//     schema: z.object({
//       capital: z.string(),
//     }),
//   }),
// });
// console.log("Object Output:",objectOutput.output);
//array
// const arrayOutput= await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   prompt: "Give me a list of some fruits",
//   output: Output.array({
//     element: z.object({
//       name: z.string(),
//       color: z.string(),
//     }),
//     maxItems: 10,
//     minItems: 1,
//   }),
// });
// console.log("Array Output:",arrayOutput.output);
// const { elementStream } = streamText({
//     model: "openai/gpt-4o-mini-fast",
//     output: Output.array({
//       element: z.object({
//         name: z.string(),
//         class: z.string(),
//         description: z.string(),
//         game: z.string().describe("The game the hero is from"),
//       }),
//     }),
//     prompt: 'Generate 3 hero descriptions for a fantasy role playing game.',
//   });
// for await (const hero of elementStream) {
//     console.log(hero); // Each hero is complete and validated
//   }
// choice
// const choiceOutput = await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   prompt: "What is the capital of France?",
//   output: Output.choice({
//     options: ["Paris", "London", "Berlin"],
//   }),
// });
// console.log("Choice Output:", choiceOutput.output);
// json
// const jsonOutput= await generateText({
//   model: "openai/gpt-4o-mini-fast",
//   output: Output.json(),
//   prompt:
//     'For each city, return the current temperature and weather condition as a JSON object.',
// });
// console.log("JSON Output:",jsonOutput.output);

/**
 * Generating Structured Outputs with Tools
 */
// const toolOutput= await generateText({
//     model: "openai/gpt-4o-mini-fast",
//     tools: {
//       weather: tool({
//         description: 'Get the weather for a location',
//         inputSchema: z.object({ location: z.string() }),
//         execute: async ({ location }) => {
//           // fetch weather data
//           return { temperature: 72, condition: 'sunny' };
//         },
//       }),
//     },
//     output: Output.object({
//       schema: z.object({
//         summary: z.string(),
//         recommendation: z.string(),
//       }),
//     }),
//     stopWhen: isStepCount(5),
//     prompt: 'What should I wear in San Francisco today?',
//   });
// console.log("Tool Output:",toolOutput.output);

/**
 * Property Descriptions
 */
// const propertyDescription= await generateText({
//     model: "openai/gpt-4o-mini-fast",
//     output: Output.object({
//       schema: z.object({
//         name: z.string().describe('The name of the recipe'),
//         ingredients: z
//           .array(
//             z.object({
//               name: z.string(),
//               amount: z
//                 .string()
//                 .describe('The amount of the ingredient (grams or ml)'),
//             }),
//           )
//           .describe('List of ingredients with amounts'),
//         steps: z.array(z.string()).describe('Step-by-step cooking instructions'),
//       }),
//     }),
//     prompt: 'Generate a lasagna recipe.',
//   });
// console.log("Property Description:",propertyDescription.output);

/**
 * Output Name and Description
 */
// const outputNameDescription= await generateText({
//     model: "openai/gpt-4o-mini-fast",
//     output: Output.object({
//       name: 'Recipe',
//       description: 'A recipe for a dish.',
//       schema: z.object({
//         name: z.string(),
//         ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
//         steps: z.array(z.string()),
//       }),
//     }),
//     prompt: 'Generate a lasagna recipe.',
//   });
// console.log("Output Name and Description:",outputNameDescription.output);
// Output.object({ name, description, schema })
// Output.array({ name, description, element, minItems, maxItems })
// Output.choice({ name, description, options })
// Output.json({ name, description })

/**
 * Accessing Reasoning
 */
const local = createOpenAICompatible({
    name: 'local',
    baseURL: process.env.LOCAL_LLM_BASE_URL!,
    apiKey: process.env.LOCAL_LLM_API_KEY,
    supportsStructuredOutputs: true,
  });
  const model = local(process.env.LOCAL_LLM_MODEL!);
const reasoningOutput= await generateText({
  model,
  output: Output.object({
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(
          z.object({
            name: z.string(),
            amount: z.string(),
          }),
        ),
        steps: z.array(z.string()),
      }),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
console.log("Reasoning Output:",reasoningOutput.finalStep.reasoningText);
export {};
