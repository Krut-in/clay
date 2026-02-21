# PROMPT 1 OF 5 — Project Foundation, Types, Design System & Core Infrastructure

## CONTEXT

You are building CLAY — a response-sculpting interface for a hackathon (AI Tinkerers NYC, Feb 21 2026). This is prompt 1 of 5. Each prompt must be completed and verified before proceeding to the next.

CLAY breaks AI chat into three interaction phases:
1. **Blueprint** — user negotiates with Claude BEFORE generation (topic outline, deselect irrelevant topics)
2. **Sculpt** — Claude's response arrives as manipulable cards (compress, expand, rephrase, inspect, dismiss)
3. **Evaluate** — a separate Claude personality analyses all cards and surfaces UI indicators (strength dots, overlap warnings)

Tech stack: Next.js 15 (App Router), TypeScript 5, React 19, Framer Motion 11, Zustand 4, Anthropic SDK, CopilotKit, Upstash Redis, CSS Modules + CSS custom properties (NO Tailwind).

## OBJECTIVE

Create the complete project skeleton: directory structure, TypeScript types, Zustand state store, all system prompts, utility libraries, CSS design system with full token set, root layout, and API route stubs. After this prompt, the project compiles, runs, and renders a warm parchment-colored empty page with the CLAY header and correct fonts loaded.

## STEP 1 — Initialize Project

```bash
npx create-next-app@15 clay --typescript --app --no-tailwind --no-eslint --import-alias "@/*"
cd clay
npm install framer-motion@11 zustand@4 @anthropic-ai/sdk
```

Create `.env.local` at project root:
```
ANTHROPIC_API_KEY=your_key_here
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Add to `.gitignore`: `.env.local`

## STEP 2 — TypeScript Types

Create `types/index.ts` with these EXACT type definitions:

```typescript
// ─── Card Types ───
export type CardVariant = 'original' | 'compressed' | 'expanded' | 'rephrased';

export interface Card {
  id: string;
  text: string;
  topic: string | null;
  variant: CardVariant;
  loading: boolean;
  inspect: string | null;
}

// ─── Blueprint Types ───
export interface BlueprintTopic {
  text: string;
  selected: boolean;
}

export interface BlueprintData {
  interpretation: string;
  topics: BlueprintTopic[];
}

// ─── Evaluator Types ───
export type EvalStrength = 'strong' | 'moderate' | 'weak';

export interface CardEvaluation {
  id: string;
  strength: EvalStrength;
  suggestion: string;
  overlaps_with: number | null;
}

export interface EvaluatorResults {
  cards: CardEvaluation[];
  overall: string;
  recommended_action: string;
}

// ─── App Status ───
export type AppStatus = {
  type: 'idle' | 'blueprinting' | 'loading' | 'streaming' | 'ready' | 'card-loading' | 'evaluating' | 'error';
  message?: string;
};
```

## STEP 3 — Zustand Store

Create `hooks/useClayStore.ts`:

```typescript
import { create } from 'zustand';
import type { Card, BlueprintData, EvaluatorResults, AppStatus } from '@/types';

interface ClayStore {
  // State
  cards: Card[];
  query: string;
  blueprintData: BlueprintData | null;
  evaluatorResults: EvaluatorResults | null;
  status: AppStatus;
  isDemo: boolean;

  // Card mutations
  addCard: (card: Card) => void;
  clearCards: () => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  removeCard: (id: string) => void;

  // Blueprint
  setBlueprintData: (data: BlueprintData | null) => void;

  // Evaluator
  setEvaluatorResults: (results: EvaluatorResults | null) => void;

  // App state
  setStatus: (status: AppStatus) => void;
  setQuery: (query: string) => void;
  setIsDemo: (isDemo: boolean) => void;
}

export const useClayStore = create<ClayStore>((set) => ({
  cards: [],
  query: '',
  blueprintData: null,
  evaluatorResults: null,
  status: { type: 'idle' },
  isDemo: false,

  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  clearCards: () => set({ cards: [], evaluatorResults: null }),
  updateCard: (id, updates) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    })),

  setBlueprintData: (data) => set({ blueprintData: data }),
  setEvaluatorResults: (results) => set({ evaluatorResults: results }),
  setStatus: (status) => set({ status }),
  setQuery: (query) => set({ query }),
  setIsDemo: (isDemo) => set({ isDemo }),
}));
```

## STEP 4 — All System Prompts

Create `lib/prompts.ts` — this is the SINGLE source of truth for every Claude instruction in the app:

```typescript
export const BLUEPRINT_PROMPT = (query: string) =>
  `You analyse user queries and return a structured blueprint for a comprehensive response.

User query: "${query}"

Return ONLY valid JSON, no markdown fences, no preamble:
{
  "interpretation": "1-sentence plain-English restatement of what the user is really asking",
  "topics": ["specific topic 1", "specific topic 2", ...]
}

Rules:
- Return 4–7 topics
- Each topic should be a specific, distinct aspect of the question
- Topics should be ordered from most to least important
- The interpretation should capture intent, not just rephrase the words
- Keep each topic label under 10 words`;

export const SYSTEM_PROMPT = (selectedTopics?: string[]) =>
  `You are CLAY's response engine. Your output will be split into individual cards.
${selectedTopics ? `The user has specifically requested coverage of these topics ONLY: ${selectedTopics.join(', ')}. Do NOT cover other topics.` : ''}

STRICT RULES:
- Respond with exactly ${selectedTopics ? selectedTopics.length : '4-7'} paragraphs separated by blank lines
- Each paragraph = one distinct idea, 2–4 sentences max
- Each paragraph should correspond to one of the requested topics
- NO headers, bullet points, bold, or markdown of any kind
- Clean direct prose — each paragraph must stand alone as a complete thought
- Do NOT number the paragraphs
- Do NOT add any preamble or closing remarks`;

export const COMPRESS_PROMPT = (text: string) =>
  `Compress the following to a single punchy sentence. No preamble, no explanation — return ONLY the compressed sentence:

"${text}"`;

export const EXPAND_PROMPT = (text: string) =>
  `Expand the following into 3-5 sentences with a concrete, specific example. No preamble — start directly with the expanded content:

"${text}"`;

export const REPHRASE_PROMPT = (text: string) =>
  `Rephrase the following from a completely different angle or metaphor. Same core meaning, fresh perspective. No preamble — return ONLY the rephrased version:

"${text}"`;

export const INSPECT_PROMPT = (text: string) =>
  `Explain the reasoning and assumptions behind the following claim in 2-3 sentences. Start directly, no preamble:

"${text}"`;

export const EVALUATOR_PROMPT = (query: string, cards: { id: string; text: string }[]) =>
  `You are CLAY's Evaluator — a strict, constructive editor. Not a cheerleader. You analyse a set of idea cards generated from a user's query and provide honest, actionable assessments.

User query: "${query}"

Cards:
${cards.map((c, i) => `Card ${i + 1} (${c.id}): "${c.text}"`).join('\n')}

For each card, assess:
- strength: "strong" | "moderate" | "weak"
  - "strong" = clear argument, well-supported, distinct point
  - "moderate" = valid but could be sharper or more specific
  - "weak" = vague, redundant, or adds little value
- suggestion: 1 actionable sentence (what the user should do — compress, expand, rephrase, dismiss, or keep as-is)
- overlaps_with: card number (1-indexed) if this card is redundant with another, null otherwise

Also provide:
- overall: 1–2 sentence summary of the card set quality and balance
- recommended_action: the single most impactful sculpting action the user should take next

Return ONLY valid JSON, no markdown fences, no preamble:
{
  "cards": [
    { "id": "...", "strength": "...", "suggestion": "...", "overlaps_with": null },
    ...
  ],
  "overall": "...",
  "recommended_action": "..."
}`;
```

## STEP 5 — Utility Libraries

### `lib/parser.ts` — Converts streaming text into Card array

```typescript
import type { Card } from '@/types';

let counter = 0;
function uid(): string {
  return `card-${Date.now()}-${++counter}`;
}

export function parseIntoCards(text: string, selectedTopics?: string[]): Card[] {
  // Split on double newlines (primary delimiter)
  let paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 20);

  // Fallback: if only one paragraph, try single newline
  if (paragraphs.length <= 1) {
    paragraphs = text
      .split(/\n/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 20);
  }

  // Final fallback: split every ~100 words
  if (paragraphs.length <= 1 && text.length > 200) {
    const words = text.split(/\s+/);
    paragraphs = [];
    for (let i = 0; i < words.length; i += 100) {
      const chunk = words.slice(i, i + 100).join(' ').trim();
      if (chunk.length >= 20) paragraphs.push(chunk);
    }
  }

  // Reconciliation: if selectedTopics provided, try to match count
  if (selectedTopics && paragraphs.length > selectedTopics.length) {
    // Merge smallest adjacent paragraphs until count matches
    while (paragraphs.length > selectedTopics.length) {
      let minLen = Infinity;
      let minIdx = 0;
      for (let i = 0; i < paragraphs.length - 1; i++) {
        const combined = paragraphs[i].length + paragraphs[i + 1].length;
        if (combined < minLen) {
          minLen = combined;
          minIdx = i;
        }
      }
      paragraphs[minIdx] = paragraphs[minIdx] + ' ' + paragraphs[minIdx + 1];
      paragraphs.splice(minIdx + 1, 1);
    }
  }

  return paragraphs.map((text, i) => ({
    id: uid(),
    text,
    topic: selectedTopics?.[i] ?? null,
    variant: 'original' as const,
    loading: false,
    inspect: null,
  }));
}
```

### `lib/claude.ts` — Streaming API client

```typescript
export async function streamClaude(
  query: string,
  selectedTopics?: string[]
): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      selectedTopics,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${error}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream available');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  return fullText;
}

export async function fetchBlueprint(
  query: string
): Promise<{ interpretation: string; topics: string[] }> {
  const res = await fetch('/api/blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Blueprint API error: ${res.status}`);
  }

  return res.json();
}
```

### `lib/redis.ts` — Upstash client (stub — functional once env vars set)

```typescript
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = Redis.fromEnv();
      return redis;
    }
  } catch {
    // Redis not configured — degrade gracefully
  }
  return null;
}

export async function getCached(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<string>(key);
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: 86400 });
  } catch {
    // Cache write failure is non-fatal
  }
}

export function hashKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
```

## STEP 6 — API Route Stubs

### `app/api/blueprint/route.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { BLUEPRINT_PROMPT } from '@/lib/prompts';
import { getCached, setCached, hashKey } from '@/lib/redis';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `clay:blueprint:${hashKey(query)}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: BLUEPRINT_PROMPT(query) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);

    // Validate shape
    if (!parsed.interpretation || !Array.isArray(parsed.topics)) {
      throw new Error('Invalid blueprint response shape');
    }

    await setCached(cacheKey, JSON.stringify(parsed));

    return NextResponse.json(parsed, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Blueprint generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### `app/api/claude/route.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  try {
    const { messages, selectedTopics } = await req.json();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT(selectedTopics),
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Claude streaming failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## STEP 7 — CSS Design System

Replace `app/globals.css` with the FULL design system. This file contains ALL CSS custom properties, font imports, keyframe animations, and base styles:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');

:root {
  /* Canvas & Cards */
  --bg-canvas: #F5F0E8;
  --bg-card: #FFFFFF;
  --bg-card-hover: #FAFAF8;
  --border-card: #E8E4DE;

  /* Blueprint Panel */
  --bg-blueprint: #FDFCF9;
  --border-blueprint: #D8D2C8;

  /* Typography */
  --text-body: #2A2520;
  --text-muted: #A09280;
  --text-meta: #C0B8AA;

  /* Action Colors */
  --action-compress: #2D2D2D;
  --action-expand: #1A4A8A;
  --action-rephrase: #2D6A2D;
  --action-inspect: #8A6A00;
  --action-dismiss: #C0392B;

  /* Evaluator Colors */
  --eval-strong: #2D6A2D;
  --eval-moderate: #8A6A00;
  --eval-weak: #C0392B;
  --eval-overlap: #A09280;

  /* Command Palette */
  --palette-bg: #2A2520;
  --palette-text: #F5F0E8;

  /* Shadows */
  --shadow-idle: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.10);

  /* Font Families */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Lora', Georgia, serif;
  --font-mono: 'DM Mono', 'Courier New', monospace;
}

/* Keyframes */
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: var(--font-body);
  font-size: 15.5px;
  color: var(--text-body);
  background: var(--bg-canvas);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility: kill overlap lines if they misposition */
.hide-overlap-lines svg {
  display: none !important;
}
```

## STEP 8 — Root Layout

Create `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLAY — Response Sculpting Interface',
  description: 'Sculpt AI responses into exactly what you need',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## STEP 9 — Minimal Page (Placeholder)

Create `app/page.tsx` with just the header and empty state — full orchestration comes in Prompt 2:

```typescript
'use client';

export default function Home() {
  return (
    <main style={{
      maxWidth: 880,
      margin: '0 auto',
      padding: '32px 24px',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 48,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--text-body)',
          letterSpacing: '-0.02em',
        }}>
          clay
        </h1>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          response sculpting
        </span>
      </header>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: 120,
      }}>
        Foundation loaded. Proceed to Prompt 2.
      </p>
    </main>
  );
}
```

## STEP 10 — Verify

Run:
```bash
npm run dev
```

## ACCEPTANCE CRITERIA — All must pass before moving to Prompt 2

1. `npm run dev` starts without errors on `localhost:3000`
2. Page renders warm parchment background (`#F5F0E8`)
3. "clay" header renders in Playfair Display bold, "response sculpting" in DM Mono
4. All three Google Fonts load (Playfair Display, Lora, DM Mono) — verify in Network tab
5. TypeScript compiles with zero errors (`npx tsc --noEmit`)
6. All files exist at correct paths:
   - `types/index.ts` — all types exported
   - `hooks/useClayStore.ts` — Zustand store with all mutations
   - `lib/prompts.ts` — all 7 prompt functions exported
   - `lib/parser.ts` — `parseIntoCards` exported
   - `lib/claude.ts` — `streamClaude` and `fetchBlueprint` exported
   - `lib/redis.ts` — `getCached`, `setCached`, `hashKey` exported
   - `app/api/blueprint/route.ts` — POST handler
   - `app/api/claude/route.ts` — POST handler with streaming
   - `app/globals.css` — all CSS tokens in `:root`
7. `curl -X POST http://localhost:3000/api/blueprint -H 'Content-Type: application/json' -d '{"query":"test"}'` returns JSON (or auth error if no API key — either is acceptable, route must not 500 on missing key)
