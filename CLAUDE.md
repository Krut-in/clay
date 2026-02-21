# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clay is a "Response-Sculpting Interface Powered by Claude" — a hackathon project (AI Tinkerers NYC Interfaces Hackathon, February 21, 2026) that reimagines AI chat via three interaction paradigms:

1. **Blueprint** – Pre-response negotiation: user curates a topic outline before Claude generates
2. **Sculpt** – Post-response card manipulation: compress, expand, rephrase, inspect, or dismiss cards
3. **Evaluate** – AI-driven interface intelligence: Claude Evaluator annotates cards with strength/overlap indicators

## Project Reference
- Full requirements: CLAY_PRD_v3.md
- Build sequence: prompts/prompt-1 through prompt-5
- Current milestone: **Prompt 3 — Card Actions & CopilotKit**

## Build Progress

| Prompt | File | Status | What Was Built |
|--------|------|--------|----------------|
| 1 | `prompts/prompt-1-foundation.md` | ✅ COMPLETE | Project skeleton: Next.js 15 + TypeScript scaffolded manually (capital-letter directory name blocked `create-next-app`). All TypeScript types (`Card`, `BlueprintData`, `EvaluatorResults`, `AppStatus`), Zustand store with full mutations, 7 system prompts in `lib/prompts.ts`, `parser.ts` with 3-level fallback + topic reconciliation, `claude.ts` streaming client, `redis.ts` graceful stub (no-ops without env vars), full CSS design system with all tokens + keyframes + Google Fonts, root layout, placeholder page, and both API route stubs (`/api/blueprint` + `/api/claude`). Added markdown-fence stripping to blueprint route — Haiku returns fences despite the prompt saying not to. Blueprint endpoint verified live: returns `{interpretation, topics[]}` in ~1s. TypeScript compiles with zero errors. |
| 2 | `prompts/prompt-2-blueprint-canvas-streaming.md` | ✅ COMPLETE | 7 components: QueryInput, EmptyState, Blueprint (auto-proceed countdown + spring animation), Card (variant badges + shimmer), Canvas, StreamingPreview, GestureLegend. Full page.tsx orchestration: query → blueprint → streaming → staggered cards. Suspense wrapper for useSearchParams (Next.js 15). Zero TS errors. |
| 3 | `prompts/prompt-3-card-actions-copilotkit.md` | ✅ COMPLETE | ActionSidebar component (5 hover buttons with design-token colors + scale(1.12) hover). Card updated: hover state → ActionSidebar, double-click → rephrase, overflow:visible for sidebar. Canvas updated: paddingRight:56, passes all 5 handlers. `/api/copilotkit` dual-mode route: direct JSON card actions (compress/expand/rephrase/inspect) + CopilotKit runtime fallback. `hooks/useCopilotActions.ts`: useCopilotReadable exposes canvas state, 6 useCopilotAction registrations. layout.tsx wrapped in `<CopilotKit>`. page.tsx: all 5 action handlers with loading/error status, removeCard for dismiss. Upgraded @anthropic-ai/sdk to ^0.57.0 for CopilotKit peer dep. Zero TS errors. Build succeeds. |
| 4 | `prompts/prompt-4-evaluator-demo-export.md` | ⬜ NOT STARTED | — |
| 5 | `prompts/prompt-5-palette-polish-qa.md` | ⬜ NOT STARTED | — |

## Commands

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run start     # Run production server
npm run lint      # ESLint on .ts/.tsx files
```

**Required environment variables** (`.env.local`):
```
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Demo mode:** Append `?demo=1` to URL — loads pre-written cards from `lib/demo.ts` with zero API calls.

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 (App Router) | Required for CopilotKit runtime |
| Language | TypeScript 5.x | Strict mode |
| UI | React 19 + Framer Motion 11 | Spring physics for card animations |
| AI SDK | CopilotKit (`react-core`, `react-ui`, `runtime`) | Maps gestures → Claude calls |
| LLMs | Claude Sonnet 4.5 (quality), Haiku 4.5 (speed) | Haiku for compress/inspect/evaluate; Sonnet for expand/rephrase |
| State | Zustand 4 | Cards array + evaluator results |
| Cache | Upstash Redis | 24h TTL on all AI responses |
| Styling | CSS Modules + CSS custom properties | No Tailwind — paper/analogue aesthetic |

## Architecture

### API Routes

| Route | Method | Model | Purpose |
|-------|--------|-------|---------|
| `/api/blueprint` | POST `{ query }` | Haiku | Returns `{ interpretation, topics[] }` |
| `/api/claude` | POST `{ messages, selectedTopics }` | Sonnet | Streaming card content |
| `/api/copilotkit` | POST CopilotKit protocol | Haiku/Sonnet | All card actions + evaluator |

### Redis Cache Key Pattern
`clay:{action}:${hash(input)}` — e.g. `clay:compress:abc123`, `clay:eval:xyz789`

### Data Flow

**Blueprint → Cards:**
1. User submits query → POST `/api/blueprint` → Blueprint panel slides in (< 1.5s)
2. User edits interpretation/topics → clicks "Sculpt Response"
3. POST `/api/claude` streams response → `lib/parser.ts` splits on `\n\n` → `Card[]`
4. Cards stagger onto canvas (220ms between each)

**Card Actions (e.g. Compress):**
1. Hover sidebar button → Zustand card enters `loading` state (shimmer)
2. CopilotKit dispatches action → `/api/copilotkit` checks Redis cache
3. Claude responds → result cached → card updates with badge + spring animation
4. Evaluator re-fires with 800ms debounce

**Evaluator:**
1. Fires 500ms after last card renders
2. Claude Haiku analyzes all card text → returns JSON `{ cardId, strength, suggestion, overlaps[] }`
3. Strength dots (8px circles) appear top-right of each card
4. SVG dashed lines connect overlapping cards

### Key Files

- `lib/prompts.ts` — Single source of truth for all system prompts (BLUEPRINT, COMPRESS, EXPAND, REPHRASE, INSPECT, EVALUATOR)
- `lib/parser.ts` — Converts streaming Claude text → `Card[]` (splits on `\n\n`)
- `hooks/useClayStore.ts` — Zustand store: `cards[]`, evaluator results, card mutations
- `hooks/useCopilotActions.ts` — CopilotKit action + readable registrations
- `types/index.ts` — `Card`, `CardVariant`, `EvaluatorResult` type definitions

### Card State Machine

States: `arriving` → `idle` → `hovered` → `loading` → (`compressed` | `expanded` | `rephrased` | `inspect-open`) + `evaluated` | `dismissed`

Dismissed cards animate out (scale→0, opacity→0, x:60) then are removed from DOM.

## Design System

**No Tailwind.** All styling uses CSS custom properties in `app/globals.css`.

Key tokens:
```css
--bg-canvas: #F5F0E8        /* Warm parchment */
--bg-card: #FFFFFF
--text-body: #2A2520
--text-muted: #A09280
--action-compress: #2D2D2D
--action-expand: #1A4A8A
--action-rephrase: #2D6A2D
--action-inspect: #8A6A00
--action-dismiss: #C0392B
--eval-strong: #2D6A2D
--eval-moderate: #8A6A00
--eval-weak: #C0392B
```

**Fonts:**
- Playfair Display (28px, 800w) — CLAY wordmark only
- Lora (15.5px) — card body text
- DM Mono (11-13px) — UI chrome (labels, badges, buttons)

## CopilotKit Integration

`app/layout.tsx` wraps the app in `<CopilotKit runtimeUrl="/api/copilotkit">`.

`useCopilotReadable` in `hooks/useCopilotActions.ts` exposes the full card state so the Command Palette (Cmd+K via `<CopilotPopup>`) can execute natural language commands like "remove all weak cards" or "compress the longest card".

## Graceful Degradation

- If Blueprint fails → skip it, proceed directly to streaming
- If Evaluator JSON parsing fails → silently skip (wrap in try/catch, no user-facing error)
- If CopilotKit setup fails → fall back to direct Anthropic SDK calls
- SVG overlap lines can be hidden via CSS kill switch `.hide-overlap-lines`
