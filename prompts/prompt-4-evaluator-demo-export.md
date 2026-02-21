# PROMPT 4 OF 5 — Claude Evaluator, Demo Mode, Redis Cache & Export

## CONTEXT

You are continuing to build CLAY. Prompts 1–3 are complete:
- Full pipeline: query → Blueprint → streaming → cards on canvas
- Card actions work: compress, expand, rephrase, inspect, dismiss
- ActionSidebar appears on hover, CopilotKit provider wraps the app
- `/api/copilotkit` route handles card transformations with Redis caching

This prompt adds three critical systems:
1. **Claude Evaluator** — a separate Claude personality that analyses all cards and renders strength dots, overlap warnings, and an evaluator summary bar
2. **Demo Mode** — pre-loaded cards + evaluator data at `?demo=1`, zero API calls needed
3. **Export** — Markdown download + copy to clipboard

## PREREQUISITE VERIFICATION

Before starting, confirm ALL of these from Prompts 1–3:
- Blueprint → card generation → card actions all work end-to-end
- `hooks/useClayStore.ts` has `setEvaluatorResults` method and `evaluatorResults` state
- `types/index.ts` has `EvaluatorResults`, `CardEvaluation`, `EvalStrength` types
- `lib/prompts.ts` has `EVALUATOR_PROMPT` function
- `lib/redis.ts` has `getCached`, `setCached`, `hashKey`
- `app/api/copilotkit/route.ts` exists and handles card actions

## DELIVERABLE 1 — `hooks/useEvaluator.ts`

Evaluator trigger logic with debounce, caching, and automatic firing.

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useClayStore } from './useClayStore';
import { hashKey } from '@/lib/redis';

const INITIAL_DELAY = 500;
const DEBOUNCE_DELAY = 800;

export function useEvaluator() {
  const {
    cards,
    query,
    evaluatorResults,
    setEvaluatorResults,
    setStatus,
    isDemo,
  } = useClayStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef<string>('');
  const isRunningRef = useRef(false);

  const runEvaluator = useCallback(async () => {
    if (isDemo || cards.length === 0 || isRunningRef.current) return;

    const cardsText = cards.map((c) => c.text).join('|||');
    const currentHash = hashKey(cardsText);

    // Skip if cards haven't changed
    if (currentHash === lastHashRef.current && evaluatorResults) return;

    isRunningRef.current = true;
    lastHashRef.current = currentHash;

    try {
      setStatus({ type: 'evaluating', message: 'Evaluator analysing…' });

      const res = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          query,
          cards: cards.map((c) => ({ id: c.id, text: c.text })),
        }),
      });

      if (!res.ok) throw new Error('Evaluator request failed');

      const data = await res.json();

      if (data && data.cards && Array.isArray(data.cards)) {
        // Map evaluator card IDs back to actual card IDs
        // (evaluator returns IDs from the input, but we need to ensure they match)
        const mappedCards = data.cards.map((evalCard: { strength: string; suggestion: string; overlaps_with: number | null }, i: number) => ({
          id: cards[i]?.id || evalCard.id,
          strength: evalCard.strength,
          suggestion: evalCard.suggestion,
          overlaps_with: evalCard.overlaps_with,
        }));

        setEvaluatorResults({
          cards: mappedCards,
          overall: data.overall || '',
          recommended_action: data.recommended_action || '',
        });

        setStatus({
          type: 'ready',
          message: `${cards.length} cards ready — hover to sculpt · double-click to rephrase`,
        });
      }
    } catch (err) {
      // Evaluator failure is non-fatal — silently skip indicators
      console.warn('Evaluator failed:', err);
      setStatus({
        type: 'ready',
        message: `${cards.length} cards ready — hover to sculpt · double-click to rephrase`,
      });
    } finally {
      isRunningRef.current = false;
    }
  }, [cards, query, isDemo, evaluatorResults, setEvaluatorResults, setStatus]);

  // Auto-fire evaluator when cards change
  useEffect(() => {
    if (cards.length === 0 || isDemo) return;

    // Skip if any card is loading
    if (cards.some((c) => c.loading)) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const delay = evaluatorResults ? DEBOUNCE_DELAY : INITIAL_DELAY;
    debounceRef.current = setTimeout(runEvaluator, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cards, isDemo, runEvaluator, evaluatorResults]);

  return { runEvaluator };
}
```

## DELIVERABLE 2 — Update `app/api/copilotkit/route.ts` — Add Evaluator Action

Find the section that handles `body.action === 'evaluate'` (currently returning 501) and replace it:

```typescript
// Handle evaluator requests
if (body.action === 'evaluate' && body.query && body.cards) {
  const { query: evalQuery, cards: evalCards } = body;

  // Cache check
  const evalInput = evalCards.map((c: { text: string }) => c.text).join('|||');
  const evalCacheKey = `clay:eval:${hashKey(evalInput)}`;
  const evalCached = await getCached(evalCacheKey);
  if (evalCached) {
    return new Response(evalCached, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
      },
    });
  }

  // Call Claude Haiku for evaluation
  const { EVALUATOR_PROMPT } = await import('@/lib/prompts');
  const evalPrompt = EVALUATOR_PROMPT(evalQuery, evalCards);
  const evalResult = await callClaude('claude-haiku-4-5-20251001', evalPrompt);

  try {
    // Parse and validate JSON response
    const parsed = JSON.parse(evalResult);
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid evaluator response shape');
    }

    const resultStr = JSON.stringify(parsed);
    await setCached(evalCacheKey, resultStr);

    return new Response(resultStr, {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });
  } catch (parseErr) {
    // JSON parse failed — return null so UI gracefully skips indicators
    console.warn('Evaluator JSON parse failed:', parseErr);
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## DELIVERABLE 3 — `components/EvaluatorBar.tsx`

Summary bar positioned above the canvas showing the evaluator's overall assessment.

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { EvaluatorResults } from '@/types';

interface EvaluatorBarProps {
  results: EvaluatorResults | null;
  cardCount: number;
}

export function EvaluatorBar({ results, cardCount }: EvaluatorBarProps) {
  const visible = results !== null && cardCount > 0;

  return (
    <AnimatePresence>
      {visible && results && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            padding: '10px 0',
            marginBottom: 16,
            borderBottom: '1px solid var(--border-card)',
          }}
        >
          <span style={{ marginRight: 16 }}>{results.overall}</span>
          {results.recommended_action && (
            <span style={{
              color: 'var(--action-expand)',
              fontStyle: 'italic',
            }}>
              → {results.recommended_action}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## DELIVERABLE 4 — Update `components/Card.tsx` — Add Evaluator Strength Dot

Add an evaluator dot to the top-right corner of each card. The dot color reflects the evaluator's strength assessment. Shows a tooltip on hover with the suggestion.

Add props to Card:

```typescript
interface CardProps {
  card: CardType;
  index: number;
  evaluation?: CardEvaluation | null;
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}
```

Inside the card div, add:

```typescript
{/* Evaluator strength dot */}
{evaluation && (
  <div
    title={evaluation.suggestion}
    style={{
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background:
        evaluation.strength === 'strong'
          ? 'var(--eval-strong)'
          : evaluation.strength === 'moderate'
            ? 'var(--eval-moderate)'
            : 'var(--eval-weak)',
      opacity: 1,
      transition: 'opacity 0.5s ease',
      cursor: 'help',
      zIndex: 5,
    }}
  />
)}
```

For a richer tooltip, add a `useState` for `showTooltip` and render a positioned div on hover:

```typescript
const [showTooltip, setShowTooltip] = useState(false);

// In the dot element:
onMouseEnter={() => setShowTooltip(true)}
onMouseLeave={() => setShowTooltip(false)}

// Tooltip div (rendered after the dot):
{showTooltip && evaluation && (
  <div style={{
    position: 'absolute',
    top: -8,
    right: 20,
    transform: 'translateY(-100%)',
    background: 'var(--palette-bg)',
    color: 'var(--palette-text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '6px 10px',
    borderRadius: 6,
    maxWidth: 240,
    lineHeight: 1.4,
    whiteSpace: 'normal',
    zIndex: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  }}>
    {evaluation.suggestion}
  </div>
)}
```

## DELIVERABLE 5 — Update `components/Canvas.tsx` — Add Overlap Lines

Add SVG overlay lines connecting cards that the evaluator has flagged as overlapping.

```typescript
// Inside Canvas component, after the card list:

{/* Overlap lines SVG */}
{evaluatorResults && !hideOverlapLines && (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  >
    {evaluatorResults.cards
      .filter((e) => e.overlaps_with !== null)
      .map((e) => {
        const fromIdx = cards.findIndex((c) => c.id === e.id);
        const toIdx = (e.overlaps_with || 1) - 1;
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return null;

        // Use card refs or calculate positions based on index
        const fromY = fromIdx * (cardHeight + gap) + cardHeight / 2;
        const toY = toIdx * (cardHeight + gap) + cardHeight / 2;

        return (
          <line
            key={`overlap-${e.id}`}
            x1="98%"
            y1={fromY}
            x2="98%"
            y2={toY}
            stroke="var(--eval-overlap)"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        );
      })}
  </svg>
)}
```

The Canvas wrapper div needs `position: relative` to anchor the SVG. Add a `hide-overlap-lines` CSS class as a kill switch (already defined in globals.css from Prompt 1).

**Note:** If overlap lines misposition during reflow, add `className="hide-overlap-lines"` to the Canvas container. Strength dots + EvaluatorBar text independently convey overlap info — lines are polish, not load-bearing.

## DELIVERABLE 6 — `lib/demo.ts`

Pre-loaded demo cards and evaluator data for `?demo=1` mode.

```typescript
import type { Card, EvaluatorResults } from '@/types';

export const DEMO_QUERY = 'Why do people struggle with chat interfaces, and how can AI be improved?';

export const DEMO_INTERPRETATION = 'The user wants to understand the fundamental friction points in conversational AI interfaces and explore concrete improvements.';

export const DEMO_CARDS: Card[] = [
  {
    id: 'demo-1',
    text: 'The blank text box is the original sin of chat interfaces. It forces users to fully articulate their need before seeing anything — a cognitively expensive task that most people either over-specify with paragraph-long prompts or under-specify with two vague words. The interface demands the answer before showing what questions it can even handle.',
    topic: 'The blank box problem',
    variant: 'original',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-2',
    text: 'AI models optimise for completeness when users want relevance — the only fix is to re-prompt entirely, breaking flow.',
    topic: 'Verbosity and relevance mismatch',
    variant: 'compressed',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-3',
    text: 'Once Claude responds, its output is presented as a finished product. The conversation architecture frames the response as complete — there are no handles, no affordances, no visual signals that say "this is raw material you should reshape." The user becomes a passive reader at the exact moment they should be an active collaborator.',
    topic: 'Output as finished product',
    variant: 'original',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-4',
    text: 'The prompting skill gap creates a two-tier system. Consider a product manager who needs a competitive analysis — they know exactly what they want, but translating that into a prompt that produces the right format, depth, and focus requires a separate skill entirely. They came for a report. They got a lesson in prompt engineering. The interface should bridge this gap by offering structural controls (like topic selection and card manipulation) instead of demanding linguistic precision.',
    topic: 'Prompting skill gap',
    variant: 'expanded',
    loading: false,
    inspect: null,
  },
  {
    id: 'demo-5',
    text: 'Chat treats every exchange like a phone call — sequential, temporal, and disposable. But human cognition is spatial. We remember where things were, not when they were said. A conversation from twenty minutes ago is functionally lost in scroll, like trying to find a specific page by flipping through a book with your eyes closed.',
    topic: 'Spatial memory vs linear scroll',
    variant: 'rephrased',
    loading: false,
    inspect: null,
  },
];

export const DEMO_EVALUATOR: EvaluatorResults = {
  cards: [
    {
      id: 'demo-1',
      strength: 'strong',
      suggestion: 'Clear and well-argued. The blank box metaphor is compelling. Keep as-is.',
      overlaps_with: null,
    },
    {
      id: 'demo-2',
      strength: 'strong',
      suggestion: 'Already compressed. Concise and punchy — good demonstration of the compress action.',
      overlaps_with: null,
    },
    {
      id: 'demo-3',
      strength: 'weak',
      suggestion: 'This point is vague and lacks a concrete example — try expanding it with a specific scenario.',
      overlaps_with: null,
    },
    {
      id: 'demo-4',
      strength: 'strong',
      suggestion: 'Great concrete example with the product manager. This is the strongest card in the set.',
      overlaps_with: null,
    },
    {
      id: 'demo-5',
      strength: 'moderate',
      suggestion: 'The spatial metaphor overlaps with the blank box argument in card 1 — consider dismissing one.',
      overlaps_with: 1,
    },
  ],
  overall: '3 strong points, 1 moderate, 1 weak. Cards 1 and 5 have thematic overlap — consider dismissing one. Card 3 needs expansion.',
  recommended_action: 'Expand card 3 to strengthen the weakest argument with a concrete example.',
};
```

## DELIVERABLE 7 — Update `app/page.tsx` — Demo Mode + Evaluator + Export Hooks

Add to page.tsx:

1. **Demo mode activation**: In a `useEffect`, check `searchParams.get('demo') === '1'`. If true, load `DEMO_CARDS` and `DEMO_EVALUATOR` from `lib/demo.ts` into the store immediately.

2. **Evaluator hook**: Call `useEvaluator()` — it auto-fires when cards change.

3. **Pass evaluator data** to Canvas and EvaluatorBar:
```typescript
<EvaluatorBar results={evaluatorResults} cardCount={cards.length} />
<Canvas
  cards={cards}
  evaluatorResults={evaluatorResults}
  onCompress={handleCompress}
  onExpand={handleExpand}
  onRephrase={handleRephrase}
  onInspect={handleInspect}
  onDismiss={handleDismiss}
/>
```

4. **Demo mode badge**: When `isDemo`, render a small pill in the top-right corner:
```typescript
{isDemo && (
  <span style={{
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--action-inspect)',
    border: '1px solid var(--action-inspect)',
    borderRadius: 10,
    padding: '2px 8px',
  }}>
    demo mode
  </span>
)}
```

## DELIVERABLE 8 — `components/ExportButton.tsx`

Export dropdown with Copy to Clipboard and Markdown Download.

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Card, EvaluatorResults } from '@/types';

interface ExportButtonProps {
  cards: Card[];
  query: string;
  evaluatorResults: EvaluatorResults | null;
}

export function ExportButton({ cards, query, evaluatorResults }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (cards.length === 0) return null;

  const handleCopy = async () => {
    const text = cards.map((c, i) => `${i + 1}. ${c.text}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setIsOpen(false), 500);
  };

  const handleDownload = () => {
    const date = new Date().toISOString().split('T')[0];
    let md = `# CLAY Export\n\n`;
    md += `**Query:** ${query}\n`;
    md += `**Date:** ${date}\n\n---\n\n`;

    cards.forEach((c, i) => {
      md += `## Card ${i + 1}`;
      if (c.variant !== 'original') md += ` [${c.variant}]`;
      md += `\n\n${c.text}\n\n`;
      if (c.inspect) md += `> **Reasoning:** ${c.inspect}\n\n`;
      md += `---\n\n`;
    });

    if (evaluatorResults) {
      md += `## Evaluator Summary\n\n`;
      md += `${evaluatorResults.overall}\n\n`;
      md += `**Recommended action:** ${evaluatorResults.recommended_action}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clay-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'transparent',
          border: '1px solid var(--border-card)',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
      >
        ↓ export
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: 180,
        }}>
          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: copied ? 'var(--eval-strong)' : 'var(--text-body)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
          <div style={{ height: 1, background: 'var(--border-card)' }} />
          <button
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-body)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Download .md
          </button>
        </div>
      )}
    </div>
  );
}
```

Add `<ExportButton>` to the header area in `app/page.tsx`, visible only when `cards.length > 0`.

## ACCEPTANCE CRITERIA — All must pass before Prompt 5

1. **Demo mode**: `?demo=1` loads 5 cards + evaluator data instantly with zero network requests
2. **Evaluator dots**: strength dots visible on all demo cards — green (demo-1, demo-2, demo-4), amber (demo-5), red (demo-3)
3. **Evaluator bar**: shows overall text ("3 strong points…") and recommended action
4. **Tooltip**: hover strength dot → dark pill tooltip with suggestion text
5. **Overlap line**: visible connecting demo cards 1 and 5 (if overlap lines enabled)
6. **Live evaluator**: submit a real query → cards render → evaluator fires automatically within 2s → dots fade in
7. **Re-evaluation**: compress a card → evaluator re-fires after 800ms debounce → dots update
8. **Evaluator failure**: if evaluator JSON parse fails, no error shown to user — cards remain fully functional
9. **Export - Copy**: click "↓ export" → "Copy to clipboard" → button shows "✓ Copied!" → clipboard contains numbered card list
10. **Export - Download**: "Download .md" → file downloads with query, all cards (with variant labels), inspect text, and evaluator summary
11. **Export visibility**: export button only appears when cards.length > 0
12. **Demo badge**: small "demo mode" pill appears in header when `?demo=1` is active
13. **Cache**: same evaluator input twice → second time returns instantly (Redis HIT)
