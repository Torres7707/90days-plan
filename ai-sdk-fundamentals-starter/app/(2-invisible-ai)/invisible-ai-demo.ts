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

  // Replace the TODOs in smartFormFill with:
 
// Define the structure we want
const eventSchema = z.object({
  eventTitle: z.string().describe('The title or purpose of the event'),
  date: z.string().describe('The date of the event'),
  time: z.string().nullable().describe('The time of the event'),
  duration: z.string().nullable().describe('How long the event will last'),
  location: z.string().nullable().describe('Where the event will take place'),
  attendees: z.array(z.string()).nullable().describe('People attending'),
  notes: z.string().nullable().describe('Additional notes or agenda items'),
});
 
// Extract structured data from natural language
const { output: eventDetails } = await generateText({
  model: 'openai/gpt-5-mini',
  prompt: `Extract calendar event details from: "${userInput}"`,
  output: Output.object({ schema: eventSchema }),
});
 
// Display as if it's a form being auto-filled
console.log('✨ AI automatically fills your form:\n');
console.log(`📅 Event: ${eventDetails.eventTitle}`);
console.log(`📆 Date: ${eventDetails.date}`);
if (eventDetails.time) console.log(`⏰ Time: ${eventDetails.time}`);
if (eventDetails.location) console.log(`📍 Location: ${eventDetails.location}`);
if (eventDetails.attendees) console.log(`👥 Attendees: ${eventDetails.attendees.join(', ')}`);
if (eventDetails.notes) console.log(`📝 Notes: ${eventDetails.notes}`);
 
console.log('\n✅ Form ready to save - no manual input needed!');
}

// Example: Smart email categorization
async function smartEmailTriage(emailSubject: string, emailPreview: string) {
  console.log("\n📧 Invisible AI: Email Smart Triage\n");

  // TODO: Create a Zod schema for email triage
  // Include: category (urgent/action-required/fyi/spam/newsletter)
  //          priority (high/medium/low)
  //          suggestedFolder, requiresResponse, estimatedResponseTime
  const emailSchema = z.object({
    category: z.enum(['urgent', 'action-required', 'fyi', 'spam', 'newsletter']),
    priority: z.enum(['high', 'medium', 'low']),
    suggestedFolder: z.string().nullable().describe('Suggested folder for the email'),
    requiresResponse: z.boolean().describe('Whether the email requires a response'),
    estimatedResponseTime: z.string().nullable().describe('Estimated response time'),
  });

  // TODO: Use generateText with Output.object() to analyze and categorize the email
  const { output: emailDetails } = await generateText({
    model: 'openai/gpt-5-mini',
    prompt: `Analyze email: "${emailPreview}"`,
    output: Output.object({ schema: emailSchema }),
  });

  // TODO: Display the triage results
  // Show how email gets automatically organized
  console.log('✨ AI automatically categorizes your email:\n');
console.log(`📧 Category: ${emailDetails.category}`);
console.log(`🔥 Priority: ${emailDetails.priority}`);
if (emailDetails.suggestedFolder) console.log(`📂 Suggested Folder: ${emailDetails.suggestedFolder}`);
if (emailDetails.requiresResponse) console.log(`📩 Requires Response: ${emailDetails.requiresResponse}`);
if (emailDetails.estimatedResponseTime) console.log(`⏰ Estimated Response Time: ${emailDetails.estimatedResponseTime}`);
 
console.log('\n✅ Email ready to process - no manual input needed!');
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
