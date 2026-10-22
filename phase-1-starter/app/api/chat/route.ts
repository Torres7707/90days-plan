import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  UIMessage,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Demo backend: a tiny fake store. In a real app these would be API calls.
// ---------------------------------------------------------------------------

type Order = {
  id: string;
  status: string;
  items: string[];
  eta: string;
};

const ORDERS: Record<string, Order> = {
  'ACME-1001': {
    id: 'ACME-1001',
    status: 'shipped',
    items: ['Wireless mouse', 'USB-C hub'],
    eta: 'Oct 20, 2026',
  },
  'ACME-1002': {
    id: 'ACME-1002',
    status: 'processing',
    items: ['Mechanical keyboard'],
    eta: 'Oct 23, 2026',
  },
  'ACME-1003': {
    id: 'ACME-1003',
    status: 'delivered',
    items: ['Monitor arm'],
    eta: 'Delivered Oct 15, 2026',
  },
};

const HELP_DOCS = [
  {
    title: 'Returns & refunds',
    snippet:
      'You can return any item within 30 days of delivery for a full refund. Start a return from your orders page.',
  },
  {
    title: 'Shipping times',
    snippet:
      'Standard shipping takes 3–5 business days. Express shipping (1–2 days) is available at checkout.',
  },
  {
    title: 'Changing an order',
    snippet:
      'Orders can be changed within 1 hour of placing them. After that, contact support to cancel and re-order.',
  },
  {
    title: 'Payment methods',
    snippet: 'We accept Visa, Mastercard, Amex, UnionPay, and Alipay.',
  },
];

// ---------------------------------------------------------------------------
// Tools: the three building blocks of Project 1. Zod schemas are the
// contract — they tell the model what to send AND validate what it sent.
// ---------------------------------------------------------------------------

const lookupOrder = tool({
  description:
    'Look up the status, items, and delivery estimate of a customer order by its order ID.',
  inputSchema: z.object({
    orderId: z
      .string()
      .describe('The order ID, for example "ACME-1001"'),
  }),
  execute: async ({ orderId }) => {
    const order = ORDERS[orderId.toUpperCase()];
    if (!order) {
      return {
        found: false as const,
        hint: `No order found for "${orderId}". Try one of: ${Object.keys(ORDERS).join(', ')}.`,
      };
    }
    return { found: true as const, ...order };
  },
});

const searchHelpDocs = tool({
  description:
    'Search the help center for articles that answer a customer question.',
  inputSchema: z.object({
    query: z.string().describe('The customer question or keywords to search for'),
  }),
  execute: async ({ query }) => {
    const words = query.toLowerCase().split(/\s+/);
    const results = HELP_DOCS.filter(doc =>
      words.some(
        w =>
          w.length > 2 &&
          (doc.title.toLowerCase().includes(w) ||
            doc.snippet.toLowerCase().includes(w)),
      ),
    );
    return {
      results:
        results.length > 0
          ? results
          : [{ title: 'No matching article', snippet: 'Offer to open a support ticket instead.' }],
    };
  },
});

const createTicket = tool({
  description:
    'Open a support ticket for the customer when their issue cannot be resolved directly.',
  inputSchema: z.object({
    subject: z.string().describe('Short summary of the customer issue'),
    details: z.string().describe('Full details of the issue, in the customer\'s words'),
    priority: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('How urgent the issue is'),
  }),
  execute: async ({ subject, details, priority }) => {
    // Demo: in production this would POST to your ticketing system.
    const ticketId = `T-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      ticketId,
      subject,
      priority,
      message: `Ticket ${ticketId} created. Our team will follow up on "${subject}" shortly.`,
      details,
    };
  },
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai.chat('sensenova-6.8-flash-lite'),
    instructions:
      'You are a friendly, concise support agent for Acme Store. ' +
      'Use lookupOrder whenever the customer mentions an order ID. ' +
      'Use searchHelpDocs for policy or how-to questions. ' +
      'Use createTicket when the issue cannot be resolved directly, ' +
      'and always confirm the ticket ID back to the customer. ' +
      'Keep replies short and conversational.',
    messages: await convertToModelMessages(messages),
    tools: { lookupOrder, searchHelpDocs, createTicket },
    // Let the model take up to 5 steps (call tools, read results, respond)
    stopWhen: isStepCount(5),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
