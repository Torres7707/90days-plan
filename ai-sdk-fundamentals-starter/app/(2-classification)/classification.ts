import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

// import supportRequests from "./support_requests.json";
import supportRequests from "./support_requests_multilanguage.json";
import { z } from "zod";
import { generateText, Output } from "ai";

async function main() {
  console.log("Asking AI to classify support requests...");

  // TODO: Define the schema for a single classified request
  // - Use z.object() to define the structure
  // - Include 'request' field (string) and 'category' field (enum)
  // - Categories: 'billing', 'product_issues', 'enterprise_sales', 'account_issues', 'product_feedback'
  const schema = z.object({
    request: z.string().describe("The original support request text."),
    category: z
      .enum([
        "billing",
        "product_issues",
        "enterprise_sales",
        "account_issues",
        "product_feedback",
      ])
      .describe("The most relevant category for the support request."),
    urgency: z
      .enum(["low", "medium", "high"])
      .describe("The probable urgency of the support request."),
    // Inside classificationSchema
    language: z
      .string()
      .describe(
        "The full name of the language the support request is in (e.g., English, Spanish, German).",
      ),
  });

  const classificationSchema = z.object({
    id: z.number().describe("The numeric id from the input. Copy it exactly. Do not renumber."),
    request: z.string().describe("Copy the original request text verbatim. Do not translate or paraphrase."),
    category: z
      .enum(["billing", "product_issues", "enterprise_sales", "account_issues", "product_feedback"])
      .describe(
        "Exactly one primary queue. Apply the first matching rule: " +
          "(1) payment, invoice, refund, subscription, or access blocked because of billing status → billing; " +
          "(2) cannot log in, cannot cancel, password, or account ownership, and the cause is not a failed payment → account_issues; " +
          "(3) a product feature is broken, missing data, or an error, and the user can still authenticate → product_issues; " +
          "(4) enterprise pricing, procurement, self-hosted support, or an API integration for a company → enterprise_sales; " +
          "(5) suggestion or opinion with no request to fix or buy → product_feedback. " +
          "If two rules match, use the earlier rule.",
      ),
    secondaryCategory: z
      .enum(["billing", "product_issues", "enterprise_sales", "account_issues", "product_feedback"])
      .nullable()
      .describe(
        "A second category only when the text explicitly contains a second, distinct problem. Otherwise null. Never equal to category.",
      ),
    urgency: z.enum(["low", "medium", "high"]).describe(
      "How fast a human must act. Do not default to medium. " +
        "high: the user is blocked right now (cannot log in, cannot pay, cannot use a core feature, data missing in production, explicit 'urgent'/'down'/'blocked'). " +
        "medium: something is broken or they cannot complete a task, but a workaround is implied or only one feature is affected. " +
        "low: a question, pricing inquiry, feature idea, or request for information with no outage. " +
        "Examples: 'can't log in' → high; 'export is wrong' → medium; 'enterprise pricing?' → low.",
    ),
    language: z
      .string()
      .describe("Full English name of the language the request is written in, e.g. English, Spanish, German, Chinese, Japanese, Italian. Detect from the request text, not from the reply."),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe(
        "0 to 1 confidence in `category` only. Use below 0.6 when two rules nearly tie or the text is too short to tell. Use 0.85 or above only when one rule clearly matches.",
      ),
    needsReview: z
      .boolean()
      .describe("True when confidence is below 0.6 or secondaryCategory is not null."),
  });

  // TODO: Use generateText with Output.object() to classify the requests
  // - Model: 'openai/gpt-4.1'
  // - Prompt: Instruct to classify based on categories
  // - Output: Output.object({ schema: yourSchema, mode: 'array' })
  // - Access results via the 'output' property
  const { output: classifiedRequests } = await generateText({
    model: "gpt-4.1",
    prompt: `Classify the following support request into a category: ${supportRequests.map((request) => request.text).join("\n")}`,
    output: Output.array({
      element: classificationSchema,
      name: "classified_requests",
      description: "The classified support requests",
    }),
  });

  // TODO: Display the classified results
  // - Access the results via output property
  // - Log as formatted JSON
  console.log("\n--- AI Response (Structured JSON) ---");
  // Output the validated, structured array
  console.log(JSON.stringify(classifiedRequests, null, 2));
  console.log("-----------------------------------");
}

main().catch(console.error);
