import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import supportRequests from "./support_requests.json";
import { z } from "zod";
import { generateText, Output } from "ai";

async function main() {
  console.log("Asking AI to classify support requests...");

  // TODO: Define the schema for a single classified request
  // - Use z.object() to define the structure
  // - Include 'request' field (string) and 'category' field (enum)
  // - Categories: 'billing', 'product_issues', 'enterprise_sales', 'account_issues', 'product_feedback'

  // TODO: Use generateText with Output.object() to classify the requests
  // - Model: 'openai/gpt-4.1'
  // - Prompt: Instruct to classify based on categories
  // - Output: Output.object({ schema: yourSchema, mode: 'array' })
  // - Access results via the 'output' property

  // TODO: Display the classified results
  // - Access the results via output property
  // - Log as formatted JSON
}

main().catch(console.error);
