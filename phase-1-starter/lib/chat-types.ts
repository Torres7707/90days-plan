import type { UIDataTypes, UITools, UIMessage } from 'ai';

// ---------------------------------------------------------------------------
// Shared tool contracts. The Zod schemas in app/api/chat/route.ts are the
// runtime source of truth; these types mirror them so the client renders
// tool parts with full type safety (input/output are typed, not `unknown`).
// ---------------------------------------------------------------------------

export type LookupOrderOutput =
  | {
      found: true;
      id: string;
      status: string;
      items: string[];
      eta: string;
    }
  | { found: false; hint: string };

export type SearchHelpDocsOutput = {
  results: { title: string; snippet: string }[];
};

export type CreateTicketOutput = {
  ticketId: string;
  subject: string;
  priority: string;
  message: string;
};

export type AppTools = {
  lookupOrder: {
    input: { orderId: string };
    output: LookupOrderOutput;
  };
  searchHelpDocs: {
    input: { query: string };
    output: SearchHelpDocsOutput;
  };
  createTicket: {
    input: { subject: string; details: string; priority: 'low' | 'medium' | 'high' };
    output: CreateTicketOutput;
  };
};

export type AppUIMessage = UIMessage<unknown, UIDataTypes, AppTools>;
