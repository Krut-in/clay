# PROMPT 3 OF 5 — Card Actions, Action Sidebar & CopilotKit Integration

## CONTEXT

You are continuing to build CLAY. Prompts 1–2 are complete:
- Project foundation: types, store, prompts, CSS tokens, API routes all exist
- Full pipeline works: user query → Blueprint panel → topic selection → Claude streaming → parser → cards fade onto canvas
- Components built: QueryInput, Blueprint, Card, Canvas, StreamingPreview, EmptyState, GestureLegend

This prompt adds the complete card interaction layer: 5 hover-revealed action buttons per card, CopilotKit runtime for AI-powered actions, and the full card state machine (loading shimmer, variant transitions, dismiss animation).

## PREREQUISITE VERIFICATION

Before starting, confirm ALL of these from Prompts 1–2:
- Full query → Blueprint → cards pipeline works end-to-end
- Cards render on canvas with stagger animation
- `hooks/useClayStore.ts` has `updateCard`, `removeCard` methods
- `lib/prompts.ts` has COMPRESS_PROMPT, EXPAND_PROMPT, REPHRASE_PROMPT, INSPECT_PROMPT
- `app/api/claude/route.ts` streams responses successfully
- `app/api/blueprint/route.ts` returns interpretation + topics

## STEP 1 — Install CopilotKit

```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

## DELIVERABLE 1 — `components/ActionSidebar.tsx`

5 action buttons that appear when hovering a card.

```typescript
'use client';

import { motion } from 'framer-motion';

interface ActionSidebarProps {
  onCompress: () => void;
  onExpand: () => void;
  onRephrase: () => void;
  onInspect: () => void;
  onDismiss: () => void;
  disabled: boolean;
}

const ACTIONS = [
  { key: 'compress', icon: '↙', color: 'var(--action-compress)', title: 'Compress to one sentence' },
  { key: 'expand', icon: '↗', color: 'var(--action-expand)', title: 'Expand with example' },
  { key: 'rephrase', icon: '↺', color: 'var(--action-rephrase)', title: 'Rephrase from new angle' },
  { key: 'inspect', icon: '⚙', color: 'var(--action-inspect)', title: 'Inspect reasoning' },
  { key: 'dismiss', icon: '✕', color: 'var(--action-dismiss)', title: 'Dismiss card' },
] as const;

export function ActionSidebar({
  onCompress, onExpand, onRephrase, onInspect, onDismiss, disabled,
}: ActionSidebarProps) {
  const handlers: Record<string, () => void> = {
    compress: onCompress,
    expand: onExpand,
    rephrase: onRephrase,
    inspect: onInspect,
    dismiss: onDismiss,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        right: -48,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 10,
      }}
    >
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          title={action.title}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handlers[action.key]();
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: 'none',
            background: 'var(--bg-card)',
            color: action.color,
            fontSize: 16,
            cursor: disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            opacity: disabled ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1.12)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.22)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
          }}
        >
          {action.icon}
        </button>
      ))}
    </motion.div>
  );
}
```

## DELIVERABLE 2 — Update `components/Card.tsx`

Add hover state to show ActionSidebar, double-click for rephrase, and dismiss animation.

Update the Card component to include:

1. **State**: `isHovered` — controls ActionSidebar visibility
2. **onMouseEnter/Leave** — toggle `isHovered`
3. **onDoubleClick** — triggers rephrase
4. **ActionSidebar** — rendered when `isHovered` and not `loading`
5. **Dismiss** — animate exit via framer-motion `exit` prop (already in place from Prompt 2)

The Card now needs action handler props:

```typescript
interface CardProps {
  card: CardType;
  index: number;
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}
```

Add `useState` for `isHovered`. Render `<ActionSidebar>` inside the card div when hovered and not loading. Wire all action callbacks to call the prop handlers with `card.id`. Add `onDoubleClick` to trigger `onRephrase(card.id)`.

The card's outer container needs `overflow: visible` to allow the sidebar to extend beyond the card bounds. Add `paddingRight: 56` to the canvas or ensure cards have enough margin for the sidebar.

## DELIVERABLE 3 — Update `components/Canvas.tsx`

Pass action handlers down to each Card:

```typescript
interface CanvasProps {
  cards: CardType[];
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}
```

Map cards and pass all handlers as props. The canvas container needs `paddingRight: 56px` to give space for action sidebars.

## DELIVERABLE 4 — `app/api/copilotkit/route.ts`

CopilotKit runtime that handles all card transformation actions.

```typescript
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  AnthropicAdapter,
} from '@copilotkit/runtime';
import Anthropic from '@anthropic-ai/sdk';
import { COMPRESS_PROMPT, EXPAND_PROMPT, REPHRASE_PROMPT, INSPECT_PROMPT } from '@/lib/prompts';
import { getCached, setCached, hashKey } from '@/lib/redis';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic();

async function callClaude(model: string, prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].type === 'text' ? message.content[0].text : '';
}

async function handleCardAction(
  action: string,
  content: string,
): Promise<{ result: string; cached: boolean }> {
  const cacheKey = `clay:${action}:${hashKey(content)}`;
  const cached = await getCached(cacheKey);
  if (cached) return { result: cached, cached: true };

  const promptFn: Record<string, (t: string) => string> = {
    compress: COMPRESS_PROMPT,
    expand: EXPAND_PROMPT,
    rephrase: REPHRASE_PROMPT,
    inspect: INSPECT_PROMPT,
  };

  const modelMap: Record<string, string> = {
    compress: 'claude-haiku-4-5-20251001',
    expand: 'claude-sonnet-4-5-20250514',
    rephrase: 'claude-sonnet-4-5-20250514',
    inspect: 'claude-haiku-4-5-20251001',
  };

  const prompt = promptFn[action](content);
  const model = modelMap[action];
  const result = await callClaude(model, prompt);

  await setCached(cacheKey, result);
  return { result, cached: false };
}

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  // Check if this is a direct action request (non-CopilotKit)
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = await req.clone().json();
      
      // Handle direct card action requests
      if (body.action && body.content) {
        const { action, content } = body;
        if (['compress', 'expand', 'rephrase', 'inspect'].includes(action)) {
          const result = await handleCardAction(action, content);
          return new Response(JSON.stringify(result), {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': result.cached ? 'HIT' : 'MISS',
            },
          });
        }
      }

      // Handle evaluator requests
      if (body.action === 'evaluate' && body.query && body.cards) {
        // Evaluator will be implemented in Prompt 4
        return new Response(JSON.stringify({ error: 'Evaluator not yet implemented' }), {
          status: 501,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Not a JSON body or not our format — fall through to CopilotKit
    }
  }

  // CopilotKit runtime handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new AnthropicAdapter({
      model: 'claude-haiku-4-5-20251001',
    }),
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};
```

**IMPORTANT**: The CopilotKit route serves dual purpose:
1. Direct POST requests with `{ action, content }` for card transformations (called from page.tsx action handlers)
2. CopilotKit protocol requests for the command palette (coming in Prompt 5)

## DELIVERABLE 5 — `hooks/useCopilotActions.ts`

Register all card state as readable and define CopilotKit actions.

```typescript
'use client';

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { useClayStore } from './useClayStore';

export function useCopilotActions() {
  const { cards, evaluatorResults, query, updateCard, removeCard } = useClayStore();

  // Expose canvas state to CopilotKit agent
  useCopilotReadable({
    description: 'Current CLAY canvas state: all cards with their text, variant, topic, and evaluator assessments',
    value: {
      query,
      cards: cards.map((c) => ({
        id: c.id,
        text: c.text.slice(0, 200),
        variant: c.variant,
        topic: c.topic,
        loading: c.loading,
      })),
      evaluatorResults: evaluatorResults
        ? {
            cards: evaluatorResults.cards.map((e) => ({
              id: e.id,
              strength: e.strength,
              suggestion: e.suggestion,
            })),
            overall: evaluatorResults.overall,
          }
        : null,
    },
  });

  // Card actions for CopilotKit command palette
  useCopilotAction({
    name: 'compressCard',
    description: 'Compress a specific card to one punchy sentence. Use when a card is verbose or too long.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to compress', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';
      
      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'compress', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'compressed', loading: false });
        return `Compressed card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Compress failed';
      }
    },
  });

  useCopilotAction({
    name: 'expandCard',
    description: 'Expand a card to 3-5 sentences with a concrete example. Use when a card needs more detail.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to expand', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';
      
      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'expand', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'expanded', loading: false });
        return `Expanded card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Expand failed';
      }
    },
  });

  useCopilotAction({
    name: 'rephraseCard',
    description: 'Rephrase a card from a completely different angle while preserving meaning.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to rephrase', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';
      
      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rephrase', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'rephrased', loading: false });
        return `Rephrased card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Rephrase failed';
      }
    },
  });

  useCopilotAction({
    name: 'inspectCard',
    description: 'Reveal the reasoning and assumptions behind a card\'s claims.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to inspect', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';
      
      if (card.inspect) {
        updateCard(cardId, { inspect: null });
        return `Closed inspect for card ${cardId}`;
      }

      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'inspect', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { inspect: data.result, loading: false });
        return `Inspected card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Inspect failed';
      }
    },
  });

  useCopilotAction({
    name: 'dismissCards',
    description: 'Dismiss one or more cards from the canvas. Use evaluator data to identify weak or overlapping cards when the user asks to "remove weak cards" or similar.',
    parameters: [
      { name: 'cardIds', type: 'string[]', description: 'Array of card IDs to dismiss', required: true },
    ],
    handler: async ({ cardIds }) => {
      (cardIds as string[]).forEach((id: string) => removeCard(id));
      return `Dismissed ${(cardIds as string[]).length} card(s)`;
    },
  });

  useCopilotAction({
    name: 'highlightOverlaps',
    description: 'Visually highlight cards that overlap with each other. Overlap lines pulse for 2 seconds.',
    parameters: [],
    handler: async () => {
      // This will be enhanced in Prompt 4 when evaluator is implemented
      return 'Overlap highlighting triggered';
    },
  });
}
```

## DELIVERABLE 6 — Update `app/layout.tsx`

Wrap the app in CopilotKit provider:

```typescript
import type { Metadata } from 'next';
import { CopilotKit } from '@copilotkit/react-core';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLAY — Response Sculpting Interface',
  description: 'Sculpt AI responses into exactly what you need',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

## DELIVERABLE 7 — Update `app/page.tsx`

Add card action handlers that call `/api/copilotkit` and update Zustand store. Also register CopilotKit actions.

Add to page.tsx:

1. Import and call `useCopilotActions()` from `hooks/useCopilotActions.ts`
2. Add action handler functions:

```typescript
const handleCompress = async (id: string) => {
  const card = cards.find((c) => c.id === id);
  if (!card) return;
  updateCard(id, { loading: true });
  setStatus({ type: 'card-loading', message: 'Compressing…' });
  try {
    const res = await fetch('/api/copilotkit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'compress', content: card.text }),
    });
    const data = await res.json();
    updateCard(id, { text: data.result, variant: 'compressed', loading: false });
    setStatus({ type: 'ready', message: `${cards.length} cards ready — hover to sculpt` });
  } catch {
    updateCard(id, { loading: false });
    setStatus({ type: 'error', message: 'Compress failed — try again' });
  }
};
```

Create similar handlers for `handleExpand`, `handleRephrase`, `handleInspect`, `handleDismiss`.

For **inspect**: toggle card.inspect — if it already has inspect text, set to null (close). If null, fetch.

For **dismiss**: use `removeCard(id)` directly from the store. The framer-motion `exit` animation handles the visual.

Pass all handlers to `<Canvas>`.

3. The canvas section in JSX becomes:
```typescript
<Canvas
  cards={cards}
  onCompress={handleCompress}
  onExpand={handleExpand}
  onRephrase={handleRephrase}
  onInspect={handleInspect}
  onDismiss={handleDismiss}
/>
```

## ACCEPTANCE CRITERIA — All must pass before Prompt 4

1. Hover any card → ActionSidebar appears from the right side in 0.15s with 5 buttons
2. Click ↙ compress → card shows shimmer loading → text replaced with 1 sentence → "↙ compressed" badge appears
3. Click ↗ expand → card grows with longer text + example → "↗ expanded" badge
4. Double-click any card → rephrase triggers → new angle text → "↺ rephrased" badge
5. Click ⚙ inspect → DM Mono text appears below card body with amber dashed divider → click again toggles off
6. Click ✕ dismiss → card animates out (opacity→0, x:60, scale:0.95) → removed from DOM → remaining cards reflow
7. Loading state: shimmer gradient sweeps across card, text at 50% opacity, all pointer events blocked
8. All 5 action buttons show correct color from design tokens and scale(1.12) on hover
9. CopilotKit provider wraps the app without errors in console
10. `useCopilotReadable` correctly exposes card state (verify in CopilotKit debug panel or console)
11. Performing the same action twice on the same content returns faster on second call (Redis cache HIT)
12. If Claude API fails during an action, the card exits loading state and a status error is shown (no infinite spinner)
