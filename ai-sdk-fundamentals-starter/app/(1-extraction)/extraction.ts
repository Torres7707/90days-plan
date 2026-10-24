import dotenvFlow from 'dotenv-flow';
dotenvFlow.config(); // Load environment variables (API keys, etc.)
import fs from 'fs';
import { generateText } from 'ai'; // AI SDK's core text generation function
 
// Read the essay file that we'll extract names from
const essay = fs.readFileSync('app/(1-extraction)/essay.txt', 'utf-8');

// Advanced extraction patterns
 
// Company extraction with context
const companyPrompt = `Extract all company names from this essay.
Include both explicit mentions and implied references (e.g., "the startup" referring to a previously mentioned company).
 
Format as JSON array: ["Company 1", "Company 2"]
 
Essay: ${essay}`;
 
// Concept extraction with categorization
const conceptPrompt = `Identify the main business concepts and technical terms in this essay.
Categorize them as either 'business' or 'technical' concepts.
 
Format as JSON:
{
  "business": ["concept1", "concept2"],
  "technical": ["term1", "term2"]
}
 
Essay: ${essay}`;
 
// Quote extraction with attribution
const quotePrompt = `Extract all quotes (text in quotation marks) from this essay.
For each quote, identify who said it if mentioned.
 
Format as JSON array:
[{"quote": "text here", "speaker": "name or null"}]
 
Essay: ${essay}`;

// Person extraction with roles
const personPrompt = `Extract all people mentioned in this essay.
Identify their roles if mentioned (e.g., "the CEO", "the founder").
 
Format as JSON array: ["Person 1 (role)", "Person 2 (role)"]
 
Essay: ${essay}`;

const namePrompt = `Extract all the names mentioned in this essay. List them separated by commas.
Essay: ${essay}`;
 
async function main() {
  // Call the LLM with our extraction prompt
  const result = await generateText({
    model: 'openai/gpt-5', // Fast, cost-effective for simple extraction tasks (non-reasoning)
    prompt: quotePrompt,
  });
  
  // The AI's response is in result.text
  console.log('\n--- AI Response ---');
  console.log(result.text); // This will be something like: "John Smith, Jane Doe, ..."
  console.log('-------------------');
}
 
// Run the async function and catch any errors
main().catch((error) => {
  console.error('❌ Extraction failed:', error.message);
  console.log('\n💡 Common issues:');
  console.log('  - Check your .env.local file has valid API keys');
  console.log('  - Verify essay.txt exists at app/(1-extraction)/essay.txt');
  console.log('  - Ensure you have internet connectivity for API calls');
  process.exit(1);
});