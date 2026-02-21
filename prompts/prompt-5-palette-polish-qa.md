# PROMPT 5 OF 5 — Command Palette, Status System, Error Handling & Final QA

## CONTEXT

You are completing CLAY. Prompts 1–4 are complete:
- Full pipeline: query → Blueprint → streaming → cards → card actions
- Evaluator analyses cards and renders strength dots, overlap lines, summary bar
- Demo mode loads pre-built cards with zero API calls
- Export: Markdown download + copy to clipboard
- CopilotKit wraps the app, `useCopilotReadable` exposes canvas state, `useCopilotAction` defines all **card** actions

This final prompt adds:
1. **CopilotKit Command Palette** — Cmd+K opens a natural language command interface to control the canvas
2. **StatusBar component** — polished status messages for every app state
3. **Header enhancements** — live card count, evaluator summary, export + palette buttons
4. **Error boundary** — global catch-all for unhandled errors
5. **Edge cases + graceful degradation** — rate limits, network failures, malformed responses
6. **Full QA checklist** — verify every user journey end-to-end

## PREREQUISITE VERIFICATION

Before starting, confirm ALL of these:
- Blueprint → card generation → card actions → evaluator → demo mode → export all work
- CopilotKit provider is in `app/layout.tsx`
- `hooks/useCopilotActions.ts` registers: compressCard, expandCard, rephraseCard, inspectCard, dismissCards, highlightOverlaps
- `useCopilotReadable` exposes cards, evaluatorResults, query to the CopilotKit agent
- Evaluator dots, bar, and overlap lines render correctly in both demo and live modes

## DELIVERABLE 1 — `components/CommandPalette.tsx`

Wraps CopilotKit's `<CopilotPopup>` component, styled to match CLAY's warm/dark palette.

```typescript
'use client';

import { CopilotPopup } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export function CommandPalette() {
  return (
    <CopilotPopup
      instructions={`You are CLAY's command interpreter. You control a canvas of idea cards.

Available actions:
- compressCard(cardId): Compress a card to one punchy sentence
- expandCard(cardId): Expand a card to 3-5 sentences with a concrete example
- rephraseCard(cardId): Rephrase from a completely different angle
- inspectCard(cardId): Toggle the reasoning/assumptions panel on a card
- dismissCards(cardIds): Remove one or more cards from the canvas
- highlightOverlaps(): Pulse overlap indicators for 2 seconds

You have access to all card data including text, topics, variants, and evaluator assessments (strength, suggestions, overlaps).

When the user says "remove weak cards" or "dismiss weak ones", find cards where evaluator strength is "weak" and call dismissCards with those IDs.
When the user says "compress the longest card", find the card with the most text and call compressCard.
When the user references a card by number or topic, resolve it to the correct card ID.

Execute the most appropriate action. Be decisive — don't ask for clarification unless truly ambiguous.`}
      labels={{
        title: 'CLAY Command',
        initial: 'What would you like to do with your cards?',
        placeholder: 'e.g. "remove all weak cards" or "compress the longest card"',
      }}
      className="clay-copilot-popup"
    />
  );
}
```

Add to `app/globals.css` — CopilotKit popup overrides to match CLAY aesthetic:

```css
/* CopilotKit Command Palette Overrides */
.clay-copilot-popup {
  --copilot-kit-primary-color: var(--text-body) !important;
  --copilot-kit-background-color: var(--palette-bg) !important;
  --copilot-kit-response-button-background-color: var(--text-body) !important;
}

.clay-copilot-popup [class*="copilotKitInput"] {
  font-family: var(--font-body) !important;
  font-size: 15px !important;
}

.clay-copilot-popup [class*="copilotKitMessage"] {
  font-family: var(--font-mono) !important;
  font-size: 12px !important;
}
```

## DELIVERABLE 2 — Cmd+K Keyboard Shortcut + Header Button

In `app/page.tsx`, add a `useEffect` for the keyboard shortcut:

```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // CopilotPopup has its own open/close mechanism
      // Trigger it by dispatching a click on the CopilotKit trigger button
      const trigger = document.querySelector('[class*="copilotKitButton"]') as HTMLElement;
      if (trigger) trigger.click();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

Add a ⌘K button in the header (visible when cards.length > 0):

```typescript
<button
  onClick={() => {
    const trigger = document.querySelector('[class*="copilotKitButton"]') as HTMLElement;
    if (trigger) trigger.click();
  }}
  style={{
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: '1px solid var(--border-card)',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
>
  ⌘K
</button>
```

Import and render `<CommandPalette />` at the end of the `<main>` element in page.tsx.

## DELIVERABLE 3 — `components/StatusBar.tsx`

Dedicated status bar component with correct copy for every app state.

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { AppStatus } from '@/types';

interface StatusBarProps {
  status: AppStatus;
  cardCount: number;
}

function getStatusContent(status: AppStatus, cardCount: number): { text: string; blink: boolean; isError: boolean } {
  switch (status.type) {
    case 'idle':
      return { text: '', blink: false, isError: false };
    case 'blueprinting':
      return { text: 'Preparing blueprint…', blink: true, isError: false };
    case 'loading':
      return { text: 'Claude is thinking…', blink: true, isError: false };
    case 'streaming':
      return { text: 'Sculpting response…', blink: true, isError: false };
    case 'ready':
      return {
        text: status.message || `${cardCount} cards ready — hover to sculpt · double-click to rephrase · ⌘K to command`,
        blink: false,
        isError: false,
      };
    case 'evaluating':
      return { text: 'Evaluator analysing…', blink: true, isError: false };
    case 'card-loading':
      return { text: status.message || 'Transforming card…', blink: false, isError: false };
    case 'error':
      return { text: `⚠ ${status.message || 'Something went wrong'}`, blink: false, isError: true };
    default:
      return { text: '', blink: false, isError: false };
  }
}

export function StatusBar({ status, cardCount }: StatusBarProps) {
  const { text, blink, isError } = getStatusContent(status, cardCount);

  if (!text) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.type + (status.message || '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: isError ? 'var(--action-dismiss)' : 'var(--text-muted)',
          marginBottom: 16,
          lineHeight: 1.4,
        }}
      >
        {blink && (
          <span style={{ animation: 'blink 1s infinite', marginRight: 4 }}>●</span>
        )}
        {text}
      </motion.div>
    </AnimatePresence>
  );
}
```

Replace the inline status rendering in `app/page.tsx` with `<StatusBar status={status} cardCount={cards.length} />`.

## DELIVERABLE 4 — Header Enhancement

Update the header in `app/page.tsx` to include all elements when cards are present:

```typescript
<header style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 32,
  flexWrap: 'wrap',
  gap: 12,
}}>
  {/* Left: Logo */}
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
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
  </div>

  {/* Right: Controls (visible when cards present) */}
  {cards.length > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Card count */}
      <motion.span
        key={cards.length}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        {cards.length} card{cards.length !== 1 ? 's' : ''}
      </motion.span>

      {/* Evaluator summary badge */}
      {evaluatorResults && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--eval-strong)',
          border: '1px solid var(--border-card)',
          borderRadius: 10,
          padding: '2px 8px',
        }}>
          {evaluatorResults.cards.filter((e) => e.strength === 'strong').length} strong
        </span>
      )}

      {/* Demo badge */}
      {isDemo && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--action-inspect)',
          border: '1px solid var(--action-inspect)',
          borderRadius: 10,
          padding: '2px 8px',
        }}>
          demo
        </span>
      )}

      {/* Export */}
      <ExportButton cards={cards} query={query} evaluatorResults={evaluatorResults} />

      {/* Command palette trigger */}
      <button
        onClick={() => {
          const trigger = document.querySelector('[class*="copilotKitButton"]') as HTMLElement;
          if (trigger) trigger.click();
        }}
        title="Command palette (⌘K)"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'transparent',
          border: '1px solid var(--border-card)',
          borderRadius: 6,
          padding: '6px 10px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-muted)';
          e.currentTarget.style.color = 'var(--text-body)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-card)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        ⌘K
      </button>
    </div>
  )}
</header>
```

## DELIVERABLE 5 — `app/error.tsx` — Global Error Boundary

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CLAY Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 24,
      padding: 32,
      background: 'var(--bg-canvas)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--text-body)',
      }}>
        clay
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        Something went wrong. This is probably temporary.
      </p>
      <button
        onClick={reset}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: '#fff',
          background: 'var(--text-body)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
```

## DELIVERABLE 6 — Error Handling & Graceful Degradation

Update `app/page.tsx` with comprehensive error handling:

### Blueprint failure → skip to direct generation
```typescript
const handleSubmit = async (q: string) => {
  // ... existing code ...
  try {
    const blueprint = await fetchBlueprint(q);
    // ... show Blueprint panel ...
  } catch (err) {
    console.warn('Blueprint failed, generating directly:', err);
    setShowBlueprint(false);
    await generateCards(q); // Skip Blueprint, go straight to streaming
  }
};
```

### Rate limit handling (429)
```typescript
const generateCards = async (q: string, selectedTopics?: string[]) => {
  // ... existing streaming code ...
  try {
    const res = await fetch('/api/claude', { /* ... */ });

    if (res.status === 429) {
      setStatus({ type: 'error', message: 'Rate limit hit — retrying in 5 seconds…' });
      await new Promise((r) => setTimeout(r, 5000));
      return generateCards(q, selectedTopics); // One auto-retry
    }

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    // ... rest of streaming logic ...
  } catch (err) {
    // ... error handling ...
  }
};
```

### Card action error recovery
All action handlers (compress, expand, rephrase, inspect) must:
1. Wrap in try/catch
2. On error: set `card.loading = false` (exit shimmer)
3. Show a brief status error message
4. Never leave a card in permanent loading state

### Evaluator failure → silent skip
The `useEvaluator` hook already wraps everything in try/catch and sets status to 'ready' on failure. Verify this is in place.

### CopilotKit failure → graceful fallback
If CopilotKit setup fails (runtime error, provider issue), the app should still function — all hover-button card actions work independently of CopilotKit since they call `/api/copilotkit` directly. Only the Cmd+K command palette would be unavailable.

## DELIVERABLE 7 — Update `app/api/blueprint/route.ts` and `app/api/claude/route.ts`

Add rate limit handling and proper error responses:

```typescript
// In both routes, catch Anthropic rate limit errors:
try {
  // ... existing Claude call ...
} catch (error: unknown) {
  if (error instanceof Error && error.message.includes('rate_limit')) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
    });
  }
  // ... existing error handling ...
}
```

## DELIVERABLE 8 — Final Animation Polish

Ensure these animations work smoothly in `app/globals.css` (should already be present from Prompt 1, verify):

```css
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
```

Verify card animations:
- Card enter: opacity 0→1, y:12→0, scale:0.98→1 (spring, 220ms stagger)
- Card exit (dismiss): opacity→0, x:60, scale→0.95, 280ms spring
- Blueprint enter: height 0→auto, opacity 0→1 (spring)
- Blueprint exit: height→0, opacity→0, marginBottom→0 (0.3s spring)
- Evaluator dots: opacity 0→1, 0.5s ease transition
- Loading shimmer: linear-gradient sweep, 1.2s linear infinite
- Status transitions: opacity fade, 0.2s between states

## FULL QA CHECKLIST — Verify ALL before submission

Run through each journey completely. Every item must pass.

### Journey 1: Blueprint Flow
```
□ Type query → press Cmd+Enter → Blueprint panel slides in (< 1.5s)
□ Interpretation is editable (click to edit)
□ Topic checkboxes toggle correctly, deselected topics show strikethrough
□ "Sculpt Response" button shows selected count
□ Auto-proceed: 5s countdown bar animates, resets on any interaction
□ ?demo=1 → auto-proceed bar is hidden
□ Click "Sculpt" → Blueprint collapses → StreamingPreview → cards
□ Card count matches selected topic count (±1)
```

### Journey 2: Card Sculpting
```
□ Hover card → ActionSidebar appears (5 buttons, correct colors)
□ Click ↙ → shimmer → compressed text → badge → spring animation
□ Click ↗ → shimmer → expanded text with example → badge
□ Double-click card → shimmer → rephrased text → badge
□ Click ⚙ → inspect panel appears below body with DM Mono text
□ Click ⚙ again → inspect panel closes
□ Click ✕ → card animates out → canvas reflows
□ All actions < 4s (Haiku < 2s, Sonnet < 4s)
```

### Journey 3: Evaluator
```
□ Cards render → evaluator fires after 500ms → dots fade in
□ Strong cards = green dot, moderate = amber, weak = red
□ Hover dot → tooltip shows suggestion
□ EvaluatorBar shows overall text and recommended action
□ Compress a card → evaluator re-fires after 800ms → dots update
□ If evaluator fails → no error shown, cards still functional
```

### Journey 4: Command Palette
```
□ Cmd+K → palette opens with CLAY styling
□ Type "remove all weak cards" → weak cards dismiss simultaneously
□ Type "compress the longest card" → longest card compresses
□ Palette closes after action
□ ⌘K header button also opens palette
```

### Journey 5: Demo Mode
```
□ ?demo=1 → 5 pre-loaded cards with evaluator dots, zero API calls
□ "demo" badge visible in header
□ All card actions work on demo cards (compress, expand, etc.)
□ Dismiss all demo cards → EmptyState appears
□ Type new query in demo mode → exits demo, runs live
```

### Journey 6: Export
```
□ "↓ export" button visible when cards present
□ Copy to clipboard → "✓ Copied!" → clipboard has numbered card list
□ Download .md → file has query, cards with variants, evaluator summary
□ Export button hidden when no cards
```

### Journey 7: Error Handling
```
□ Invalid API key → error message, not stack trace
□ Blueprint fails → skips to direct generation (no Blueprint panel)
□ Evaluator fails → no indicators, no error shown
□ Network disconnect → graceful error message
□ Rate limit (429) → "Retrying in 5s" → auto-retry
□ Error boundary catches unhandled errors → "Try again" button
□ No card is ever stuck in permanent loading state
```

### Journey 8: Visual Polish
```
□ Playfair Display, Lora, DM Mono all load correctly
□ Parchment background (#F5F0E8) throughout
□ Card shadows lift on hover
□ No layout shifts during card add/remove/reflow
□ All animations smooth at 60fps on MacBook
□ Status bar transitions smoothly between states
□ Card count animates when it changes
□ GestureLegend visible at bottom with correct legend items
□ Works at 1280px minimum width
```

### Performance Targets
```
□ Blueprint generation: < 1.5 seconds
□ Card render (full pipeline): < 8 seconds
□ Evaluator analysis: < 2 seconds after cards land
□ Compress/Inspect (Haiku): < 2 seconds
□ Expand/Rephrase (Sonnet): < 4 seconds
□ Redis cache HIT: < 100ms
□ Command palette → action: < 3 seconds
□ Export: < 500ms
```

---

## THE APP IS NOW COMPLETE

After passing all QA checks, CLAY should deliver:
- **Blueprint**: User negotiates with Claude before generation
- **Sculpt**: 5 card actions via hover sidebar + double-click
- **Evaluate**: Strength dots, overlap warnings, summary bar — Claude drives the UI
- **Command**: Natural language canvas control via Cmd+K
- **Demo**: Pre-loaded safety net at ?demo=1
- **Export**: Markdown download + clipboard

Three novel moments for the judges:
1. Blueprint negotiation (0:12) — "I've never seen pre-response control before"
2. Evaluator indicators (0:30) — "Claude is driving the interface, not just the content"
3. Command palette dismiss (0:50) — "remove all weak cards" and they vanish

Deploy to Vercel and rehearse the 90-second demo script.
