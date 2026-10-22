'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import type { AppUIMessage } from '@/lib/chat-types';

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function ToolShell({
  title,
  state,
  children,
}: {
  title: string;
  state: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tool-card" data-state={state}>
      <div className="tool-head">
        <span>🛠 {title}</span>
        <span className="tool-state">{state}</span>
      </div>
      <div className="tool-body">{children}</div>
    </div>
  );
}

/** Renders one part of an assistant message. Text streams in; tool parts
 *  move through states: input-streaming → input-available → output-available
 *  (or output-error). Watching these states IS the lesson of Phase 1. */
function Part({ part }: { part: AppUIMessage['parts'][number] }) {
  switch (part.type) {
    case 'text':
      return <p className="bubble-text">{part.text}</p>;

    case 'tool-lookupOrder': {
      const callId = part.toolCallId;
      switch (part.state) {
        case 'input-streaming':
          return (
            <ToolShell key={callId} title="Order lookup" state={part.state}>
              Preparing lookup…
            </ToolShell>
          );
        case 'input-available':
          return (
            <ToolShell key={callId} title="Order lookup" state={part.state}>
              Looking up order <code>{part.input.orderId}</code>…
            </ToolShell>
          );
        case 'output-available': {
          const out = part.output;
          return (
            <ToolShell key={callId} title="Order lookup" state={part.state}>
              {out.found ? (
                <ul className="tool-list">
                  <li>
                    <strong>{out.id}</strong> — {out.status}
                  </li>
                  <li>Items: {out.items.join(', ')}</li>
                  <li>ETA: {out.eta}</li>
                </ul>
              ) : (
                <span>{out.hint}</span>
              )}
            </ToolShell>
          );
        }
        case 'output-error':
          return (
            <ToolShell key={callId} title="Order lookup" state={part.state}>
              Error: {part.errorText}
            </ToolShell>
          );
        default:
          return (
            <ToolShell key={callId} title="Order lookup" state={part.state}>
              {part.state}
            </ToolShell>
          );
      }
    }

    case 'tool-searchHelpDocs': {
      const callId = part.toolCallId;
      switch (part.state) {
        case 'input-streaming':
          return (
            <ToolShell key={callId} title="Help search" state={part.state}>
              Preparing search…
            </ToolShell>
          );
        case 'input-available':
          return (
            <ToolShell key={callId} title="Help search" state={part.state}>
              Searching help center for “{part.input.query}”…
            </ToolShell>
          );
        case 'output-available':
          return (
            <ToolShell key={callId} title="Help search" state={part.state}>
              <ul className="tool-list">
                {part.output.results.map((r: { title: string; snippet: string }) => (
                  <li key={r.title}>
                    <strong>{r.title}</strong>
                    <br />
                    {r.snippet}
                  </li>
                ))}
              </ul>
            </ToolShell>
          );
        case 'output-error':
          return (
            <ToolShell key={callId} title="Help search" state={part.state}>
              Error: {part.errorText}
            </ToolShell>
          );
        default:
          return (
            <ToolShell key={callId} title="Help search" state={part.state}>
              {part.state}
            </ToolShell>
          );
      }
    }

    case 'tool-createTicket': {
      const callId = part.toolCallId;
      switch (part.state) {
        case 'input-streaming':
          return (
            <ToolShell key={callId} title="Support ticket" state={part.state}>
              Preparing ticket…
            </ToolShell>
          );
        case 'input-available':
          return (
            <ToolShell key={callId} title="Support ticket" state={part.state}>
              Creating ticket: “{part.input.subject}”…
            </ToolShell>
          );
        case 'output-available':
          return (
            <ToolShell key={callId} title="Support ticket" state={part.state}>
              <ul className="tool-list">
                <li>
                  <strong>{part.output.ticketId}</strong> — {part.output.subject}
                </li>
                <li>Priority: {part.output.priority}</li>
                <li>{part.output.message}</li>
              </ul>
            </ToolShell>
          );
        case 'output-error':
          return (
            <ToolShell key={callId} title="Support ticket" state={part.state}>
              Error: {part.errorText}
            </ToolShell>
          );
        default:
          return (
            <ToolShell key={callId} title="Support ticket" state={part.state}>
              {part.state}
            </ToolShell>
          );
      }
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat<AppUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');

  const busy = status === 'submitted' || status === 'streaming';

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <h1>Acme Store Support</h1>
        <p className="chat-sub">
          Phase 1 starter — streaming chat + 3 typed tools. Try: “Where is order
          ACME-1001?”, “What&apos;s your return policy?”, “My keyboard arrived broken.”
        </p>
      </header>

      <section className="chat-log">
        {messages.length === 0 && (
          <div className="chat-empty">
            Ask something to see streaming, tool calls, and tool results render live.
          </div>
        )}
        {messages.map(message => (
          <div key={message.id} className={`msg msg-${message.role}`}>
            <div className="msg-role">
              {message.role === 'user' ? 'You' : 'Acme Support'}
            </div>
            <div className="msg-body">
              {message.parts.map((part, i) => (
                <Part key={`${part.type}-${i}`} part={part} />
              ))}
            </div>
          </div>
        ))}

        {busy && (
          <div className="chat-status">
            <span className="spinner" aria-hidden />
            {status === 'submitted' ? 'Sending…' : 'Streaming response…'}
            <button type="button" className="btn-ghost" onClick={() => stop()}>
              Stop
            </button>
          </div>
        )}

        {error && (
          <div className="chat-error">
            <span>Something went wrong: {error.message}</span>
            <button type="button" className="btn-ghost" onClick={() => regenerate()}>
              Retry
            </button>
          </div>
        )}
      </section>

      <form
        className="chat-input"
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
          placeholder="Ask about an order, a policy, or a problem…"
          aria-label="Message"
        />
        <button type="submit" disabled={status !== 'ready'}>
          Send
        </button>
      </form>
    </main>
  );
}
