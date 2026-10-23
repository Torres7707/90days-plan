import dotenvFlow from "dotenv-flow";
dotenvFlow.config();
import { generateText, Output } from "ai";
import { z } from "zod";

// Example: Smart form filling from natural language
async function smartFormFill(userInput: string) {
  console.log("\n🤖 Invisible AI: Smart Form Filling\n");
  console.log(`User types: "${userInput}"\n`);

  // TODO: Create a Zod schema for calendar event details
  // Include fields like: eventTitle, date, time, duration, location, attendees, notes

  // TODO: Use generateText with Output.object() to extract structured data from userInput
  // The AI should parse the natural language and fill the form fields

  // TODO: Display the extracted data in a user-friendly way
  // Show how this saves the user time and effort
}

// Example: Smart email categorization
async function smartEmailTriage(emailSubject: string, emailPreview: string) {
  console.log("\n📧 Invisible AI: Email Smart Triage\n");

  // TODO: Create a Zod schema for email triage
  // Include: category (urgent/action-required/fyi/spam/newsletter)
  //          priority (high/medium/low)
  //          suggestedFolder, requiresResponse, estimatedResponseTime

  // TODO: Use generateText with Output.object() to analyze and categorize the email

  // TODO: Display the triage results
  // Show how email gets automatically organized
}

async function runExamples() {
  // Smart form example
  await smartFormFill(
    "Coffee with John next Tuesday at 2pm at Starbucks on Market St, discuss Q4 roadmap",
  );

  console.log("\n" + "=".repeat(60));

  // Email triage example
  await smartEmailTriage(
    "Re: Q4 Budget Approval Needed by EOD",
    "Hi team, I need your approval on the attached Q4 budget proposal by end of day today. Please review the highlighted sections...",
  );
}

runExamples().catch(console.error);
