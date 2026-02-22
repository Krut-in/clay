# 🏺 CLAY

## A Response-Sculpting Interface Powered by Claude

---

| Field | Value |
|---|---|
| Document Status | ✅ **FINAL v3.1** — All decisions locked, 6 edge-case fixes applied, ready to build |
| Event | AI Tinkerers NYC · Interfaces Hackathon with Claude |
| Date | February 21, 2026 (9 am – 9 pm) |
| Team | Krutin (Full-Stack Lead) · Raj (Frontend) · Shyam (Backend) |
| Tech Stack | Next.js 15 · TypeScript · CopilotKit · Anthropic SDK · Upstash Redis · Framer Motion |
| Live Demo Query | Why do people struggle with chat interfaces, and how can AI be improved? |
| Export | Markdown download + Copy to clipboard |
| Blueprint System | ✅ Pre-response outline negotiation — user curates topics before generation |
| Evaluator Layer | ✅ Claude-driven post-response card analysis with UI indicators |
| Command Palette | ✅ CopilotKit natural language card control via Cmd+K |
| Tavus Clay Coach | P1 Enhancement — conversational avatar if time permits |
| PDF Export | ❌ Cut — no demo impact, time reallocated to Blueprint + Evaluator |
| Touch Gestures | ❌ Cut — MacBook trackpad unreliable in browser; hover+click is primary |
| Drag-to-Merge | ❌ Out of scope — focus on polish |
| Product Name | CLAY — locked |
| Header Stats | Live card count + evaluator summary |

---

### What this document is

This is the finalised PRD for CLAY v3.1. Every architectural, design, and scope decision is locked.
Sections 01–14 define the product. Section 15 contains six Claude Code system prompts
formatted as copy-paste-ready build instructions. Give them to Claude Code one at a time,
verify each one works before sending the next.

**What changed from v2:** Three new systems added (Response Blueprint, Claude Evaluator, CopilotKit
Command Palette). PDF export and touch gesture system removed. Build segments reordered to
prioritise novelty features and demo safety. CopilotKit and Redis integrations deepened from
surface-level to architecturally essential. Demo script updated with three distinct "novel moments."

**What changed in v3.1 (6 edge-case fixes):** (1) Parser reconciliation added for Blueprint→card count mismatches. (2) Auto-proceed timer resets on any panel interaction and disables in ?demo=1. (3) CopilotKit agent model explicitly set to Haiku for palette NL reasoning. (4) `topic` field added to Card interface for topic-aware palette commands. (5) Timeline adjusted for hackathon keynote/talks (setup runs during talks, coding starts 10:30). (6) Overlap SVG lines given kill switch + graceful degradation. Two new risks added to register.

---

## 01  Executive Summary

CLAY is a response-sculpting interface. It breaks the two oldest assumptions in AI chat — that you must fully formulate your need before seeing anything, and that the model's output is a finished product you react to.

In CLAY, the interaction has three phases of human control:

1. **Blueprint** — Before Claude generates a full response, it first shows the user a structured outline: "Here's how I understood your question, and here's what I plan to cover." The user curates topics, deselects what's irrelevant, and corrects the interpretation. Generation only proceeds for selected topics.

2. **Sculpt** — Claude's response arrives as a set of physical, manipulable cards. One idea per card. Users reshape those cards in real time: compress a bloated paragraph with a click, expand a thin idea, rephrase with a double-click, dismiss what doesn't belong.

3. **Evaluate** — After cards land, a separate Claude personality — the Evaluator — analyses the full card set and surfaces subtle UI indicators: strength dots, overlap warnings, and actionable suggestions. Claude doesn't just respond; it actively helps the user decide what to sculpt next.

The result is the user's document, not Claude's.

### The one-sentence pitch

"CLAY gives you control before, during, and after Claude's response — you sculpt raw material into exactly what you needed, with Claude as your collaborator at every step."

### The three novel moments (for judges)

| Moment | What happens | Why it's new |
|---|---|---|
| Blueprint | User sees Claude's interpretation + topic outline before generation. Deselects 2 topics. | No AI interface offers pre-response negotiation. User has control before a single word is generated. |
| Evaluator | Strength dots and overlap indicators fade in on cards. Claude flags a weak card. | Claude drives the interface itself — not just the content. AI proactively shapes the UI. |
| Command Palette | User hits Cmd+K, types "remove all weak cards." Two cards dismiss simultaneously. | Natural language controls the canvas through CopilotKit. Keyboard-first AI interaction. |

---

## 02  Problem Statement

### 2.1  Why People Struggle With Chat Interfaces

The core problem is architectural: chat is a phone call, but thinking is more like sculpting. Chat forces users into a sequential loop — prompt, receive, react — that is fundamentally at odds with how cognition works. Understanding of what you want evolves as you see the output. The interface should accommodate that. It doesn't.

| Friction Point | What Happens | Why It Breaks |
|---|---|---|
| The blank box | User must fully formulate their need before seeing anything | Cognitively expensive — most people either over-specify (paragraph prompts) or under-specify (two words, bad output) |
| Pre-response blindness | User has no idea what the AI will cover until it finishes | Can't steer the response. 40% of the output might be irrelevant. Only recourse: re-prompt entirely. |
| Verbosity trap | Model optimises for completeness; user wants relevance | Only fix is to re-prompt. Tedious, breaks flow, often overcorrects |
| Output as fait accompli | Once Claude responds, it's presented as finished | User is now a passive reader exactly when they should stay an active collaborator |
| No post-response intelligence | The AI goes silent after responding | User must evaluate quality alone. No second opinion. No guidance on what to do next. |
| Context rot | Long threads accumulate conflicting instructions | Model appears to 'get dumber' mid-conversation — context pollution, not model failure |
| Prompting skill gap | Great outputs require learning prompt engineering | Users wanted a report. They got a lesson in prompt design instead |
| No spatial memory | Chat is vertical linear scroll | Brain is spatial — a conversation from 20 minutes ago is functionally lost |

### 2.2  What This Means for CLAY's Demo

**The demo query is not an accident.**

The live demo question — *'Why do people struggle with chat interfaces, and how can AI be improved?'* — is chosen because Claude's answer to this question will be a long, thorough, multi-paragraph response. That is exactly the kind of output CLAY is designed to sculpt. The demo will show:

1. Blueprint appears with 6 topics → user deselects 2 → only 4 cards generated
2. Cards pulse in → evaluator indicators fade in, flagging one weak card
3. Compress a verbose paragraph into one sentence
4. Double-click a card that doesn't land → get a fresh angle (rephrase)
5. Open command palette → "remove all weak cards" → cards dismiss
6. Copy the final sculpted canvas to clipboard

The judges will have just watched someone negotiate with Claude before generation, sculpt the output after generation, receive intelligent guidance from an evaluator, and command the canvas with natural language. Four interaction paradigms in 90 seconds.

---

## 03  Product Vision

### 3.1  The Paradigm Shift

| Dimension | Old Model: Chat | CLAY Model |
|---|---|---|
| User role | Passenger — reacts to output | Sculptor — shapes output at every stage |
| Control timing | Before response only (prompting) | Before (Blueprint) + After (sculpting) + Ongoing (evaluator) |
| Pre-response visibility | None — user submits blindly | Blueprint shows interpretation + topic outline before generation |
| Iteration method | Type a new message | Click, double-click, hover button, natural language command |
| AI after responding | Silent — waits for next prompt | Evaluator analyses cards, flags weaknesses, suggests actions |
| Output ownership | Claude's structure | User's curation |
| Claude's role | Responds once | Previews, generates, evaluates, and acts on every gesture |
| Final document | Whatever Claude decided | What the user sculpted with Claude's guidance |

### 3.2  The Three-Phase Control Model

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   1. BLUEPRINT    │ →  │    2. SCULPT      │ →  │   3. EVALUATE     │
│                   │    │                   │    │                   │
│ Claude shows      │    │ Cards on canvas.  │    │ Claude Evaluator  │
│ interpretation    │    │ Compress, expand, │    │ analyses all      │
│ + topic outline.  │    │ rephrase, dismiss │    │ cards. Strength   │
│ User curates      │    │ via hover buttons │    │ dots, overlap     │
│ before generation │    │ or Cmd+K palette. │    │ warnings, tips.   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
     User has                User has                Claude drives
     pre-control             direct control           the interface
```

No existing AI interface offers all three. ChatGPT, Gemini, Perplexity — all skip straight to output. CLAY is the first interface where the human and the AI negotiate the response before it exists, sculpt it after it arrives, and refine it with AI-driven guidance.

### 3.3  The Naming Rationale

Clay is the oldest material humans have used to externalise thought. A sculptor doesn't argue with clay — they shape it. The name communicates the core interaction model without explanation. When a judge sees the word CLAY next to cards they can compress, pull, and evaluate, the metaphor lands instantly.

---

## 04  Target Users

| User Type | Core Pain | How CLAY Solves It |
|---|---|---|
| Hackathon judges (PRIMARY) | Seen 20+ demos. Fatigued. Need to feel something in 30 seconds | Blueprint negotiation is something they've never seen. Evaluator dots are something they've never seen. Command palette dismissing 3 cards at once — they'll reach for the screen. |
| Researchers & analysts | Must distil long AI output into sharp summaries | Blueprint: deselect irrelevant topics before generation. Compress cards directly. Evaluator flags redundancies. Export only what matters. |
| Founders & PMs | Need 3 decisions, not 8 paragraphs | Blueprint: select exactly the 3 topics you care about. Dismiss the rest before they even generate. |
| Writers | Want Claude's raw ideas, not Claude's structure | Rephrase cards to fit their own voice. Evaluator suggests which points are strongest. |
| Students | Need to understand one concept at a time | Expand cards individually. Inspect the reasoning behind claims. Evaluator highlights weak arguments to question. |

---

## 05  Feature Scope — Final MVP

### 5.1  MVP Features (Must Ship)

| Feature | Priority | Owner | Segment | Status |
|---|---|---|---|---|
| Next.js 15 + TypeScript setup + routing | P0 | Krutin | 1 | Build first |
| Claude streaming → semantic card parser | P0 | Shyam | 1 | Build first |
| Card canvas with sequential fade-in animation | P0 | Raj | 1 | Build first |
| **Response Blueprint system** | P0 | Shyam | 1 | Build first |
| Hover action sidebar (5 buttons per card) | P0 | Raj | 2 | Phase 2 |
| Compress (Haiku model) | P0 | Shyam | 2 | Phase 2 |
| Expand (Sonnet model) | P0 | Shyam | 2 | Phase 2 |
| Rephrase / double-click (Sonnet model) | P0 | Shyam | 2 | Phase 2 |
| Dismiss card (animate out) | P0 | Raj | 2 | Phase 2 |
| Inspect reasoning (Haiku model) | P0 | Shyam | 2 | Phase 2 |
| CopilotKit useCopilotReadable + useCopilotAction | P0 | Shyam | 2 | Phase 2 |
| **Demo mode** (?demo=1, no API needed) | P0 | Krutin | 3 | Phase 3 |
| **Claude Evaluator layer** + UI indicators | P0 | Shyam | 3 | Phase 3 |
| **CopilotKit Command Palette** (Cmd+K) | P0 | Krutin | 4 | Phase 4 |
| Upstash Redis semantic cache | P0 | Shyam | 4 | Phase 4 |
| Markdown export (download file) | P0 | Krutin | 4 | Phase 4 |
| Copy to clipboard | P0 | Krutin | 4 | Phase 4 |
| Live card count in header | P0 | Raj | 5 | Phase 5 |
| Status bar system | P0 | Raj | 5 | Phase 5 |
| Error boundary + graceful failure states | P0 | Krutin | 5 | Phase 5 |

### 5.2  P1 Enhancements (If Time Permits After 4pm)

| Feature | Owner | Notes |
|---|---|---|
| Before/After reveal animation | Raj | Raw text → card decomposition visual |
| Tavus Clay Coach avatar | Krutin | Conversational video evaluator in corner |
| Redis session memory | Shyam | Resume sculpting sessions |
| Richer evaluator panel | Raj | Expandable evaluator summary below canvas |

### 5.3  Out of Scope (Future)

| Feature | Reason |
|---|---|
| PDF export | No demo impact. Markdown + clipboard sufficient. |
| Touch gesture system (@use-gesture/react) | MacBook trackpad unreliable in browser. Hover+click is primary. |
| Drag-to-merge two cards | Scope risk. Focus on polish. |
| Tavus avatar narration of export | Post-hackathon enhancement. |
| Full spatial canvas (drag to reposition) | Post-hackathon enhancement. |

---

## 06  Interaction Specification

### 6.1  Response Blueprint (Pre-Response Negotiation)

The Blueprint is CLAY's single most novel interaction. It gives the user control before Claude generates a single word of the full response.

| Step | What Happens | Timing |
|---|---|---|
| 1 | User types query in QueryInput, presses Cmd/Ctrl+Enter | — |
| 2 | POST to /api/blueprint with query. Claude Haiku returns JSON: interpretation + topics array | < 1.5s |
| 3 | Blueprint panel slides down below QueryInput with spring animation | 0.3s |
| 4 | Panel shows: Claude's 1-sentence interpretation (editable) + checklist of 4–7 topic bullets (all checked) | — |
| 5 | User reviews. Can uncheck topics. Can inline-edit the interpretation. | User-paced |
| 6 | User clicks "Sculpt Response" button. Auto-proceed countdown (5s) shown as thin progress bar. Countdown resets on any panel interaction (checkbox toggle, interpretation edit, mouse enter). Disabled entirely when ?demo=1 — presenter always clicks manually for timing control. | — |
| 7 | Blueprint collapses (shrink + fade, 0.3s). Claude Sonnet streams full response for selected topics only. | — |
| 8 | Response parsed into cards. Target: one card per selected topic. Parser reconciles if Claude over/under-generates (see parser.ts spec). Cards fade in with 220ms stagger. | < 8s total |

**Blueprint visual spec:**

- Container: `var(--bg-card)` background, `var(--border-card)` border, 12px border-radius, 20px padding
- Interpretation line: Lora italic 14.5px, `var(--text-body)`, pencil icon on right for edit mode
- Topic checkboxes: custom styled (warm charcoal check, `var(--border-card)` unchecked), DM Mono 13px labels
- "Sculpt Response" button: 44px height, pill shape, `var(--text-body)` bg, white text, Playfair Display 14px bold
- Auto-proceed bar: 2px height, `var(--action-expand)` color, animates width 100%→0% over 5 seconds. Resets on any panel interaction (checkbox, edit, mouse enter). Hidden when ?demo=1.
- Collapse animation: height → 0, opacity → 0, marginBottom → 0, 0.3s spring via framer-motion

### 6.2  Card Sculpting Actions (Hover + Click)

Since the demo device is a MacBook with no touchscreen, the primary interaction model is hover-based.
All card actions are triggered via the hover action sidebar. No touch gesture system.

| Interaction | Trigger | Claude Model | Prompt | Target Latency |
|---|---|---|---|---|
| Compress | Hover → click ↙ | claude-haiku-4-5-20251001 | Compress to one punchy sentence. No preamble. | < 2s |
| Expand | Hover → click ↗ | claude-sonnet-4-5 | Expand to 3–5 sentences with a concrete example. | < 4s |
| Rephrase | Double-click card (or hover → click ↺) | claude-sonnet-4-5 | Rephrase from a completely different angle. Same meaning. | < 4s |
| Inspect | Hover → click ⚙ | claude-haiku-4-5-20251001 | Explain the reasoning/assumptions in 2–3 sentences. | < 2s |
| Dismiss | Hover → click ✕ | None | Client-side only | Instant |

### 6.3  Claude Evaluator Layer (Post-Response Intelligence)

The Evaluator is a separate Claude personality that runs automatically after cards land on the canvas. It analyses the full card set and returns structured assessments that render as UI indicators on the cards themselves. This makes Claude an active participant in the sculpting process — it drives the interface, not just the content.

| Element | Visual | Behaviour |
|---|---|---|
| Strength dot | 8px circle, top-right corner of card, 6px from edges | Green (#2D6A2D) = strong. Amber (#8A6A00) = could improve. Red (#C0392B) = weak. Fades in 0.5s after evaluator returns. |
| Overlap indicator | Subtle dashed line connecting two card edges | Shown when evaluator detects redundancy between two cards. Line color: var(--text-muted), 1px dashed. Graceful degradation: if lines misposition after card reflow, hide via `hide-overlap-lines` CSS class — strength dots + evaluator bar text carry the overlap story independently. |
| Dot tooltip | DM Mono 11px, dark bg pill, positioned above dot on hover | Contains evaluator's 1-sentence suggestion. E.g., "This point lacks a concrete example — try expanding." |
| Evaluator bar | Fixed below Blueprint area, above canvas, full width | DM Mono 11.5px, var(--text-muted). Shows overall observation. E.g., "3 strong points. Cards 2 and 5 overlap — consider dismissing one." |

**Evaluator timing:**
- Fires automatically 500ms after all cards finish rendering
- Non-blocking — user can start sculpting immediately
- Indicators fade in when evaluator results arrive (0.5s opacity transition)
- Re-runs after any card action (compress, expand, rephrase, dismiss) with 800ms debounce
- Results cached in Redis (same card set = instant evaluator response)

**Evaluator personality:**
The system prompt frames it as a strict, constructive editor — not a cheerleader. It gives honest assessments. A card that says nothing new gets flagged. Redundancy is called out. This makes the evaluator feel like a second brain, not a validation machine.

### 6.4  CopilotKit Command Palette (Natural Language Control)

A persistent command palette triggered by `Cmd+K` (or clicking the ⌘K button in the header) where the user types natural language commands to control the canvas. CopilotKit interprets the command and executes card actions.

| User Types | CopilotKit Action Triggered | What Happens |
|---|---|---|
| "compress the longest card" | compressCard(id of longest) | Longest card enters loading → compressed |
| "remove all weak cards" | dismissCards([ids where strength='weak']) | All weak-evaluated cards dismiss simultaneously |
| "expand point 3" | expandCard(card-3-id) | Card 3 enters loading → expanded |
| "what overlaps?" | highlightOverlaps() | Overlap indicators pulse brightly for 2s |
| "rephrase everything about prompting" | rephraseCard(id matching topic) | Relevant card enters loading → rephrased |

**Technical implementation:**
- CopilotKit `useCopilotReadable` exposes full canvas state (cards, evaluator results, query) to the agent
- CopilotKit `useCopilotAction` defines typed actions: compressCard, expandCard, rephraseCard, dismissCards, highlightOverlaps
- `<CopilotPopup>` component styled to match CLAY palette — warm bg, Lora font for input, DM Mono for suggestions
- The agent has access to evaluator data, so it can reason about card quality when executing commands

**Demo moment:** After sculpting a few cards manually, the presenter opens Cmd+K and types "remove all weak cards" — multiple cards animate out simultaneously. This is the third "novel moment" in the 90-second demo.

### 6.5  Card State Machine

| State | Visual | Behaviour |
|---|---|---|
| arriving | Opacity 0→1, translateY 12px→0, scale 0.98→1 | Sequential stagger 220ms per card. Simple fade-in, no pulse ring. |
| idle | White bg, #E8E4DE border, soft shadow | Default. Hover transitions to 'hovered'. |
| hovered | Shadow lifts, action sidebar slides in from right | Sidebar fades in 0.15s. Cursor remains default. |
| loading | Shimmer sweep overlay, text fades to 50%, pointer-events:none | Blocks all interaction. Shimmer gradient 1.2s infinite. |
| compressed | Charcoal badge top-left, card height shrinks with spring | Badge: '↙ compressed'. Text is new 1-sentence version. |
| expanded | Deep blue badge, card grows with spring animation | Badge: '↗ expanded'. Extra bottom padding. |
| rephrased | Forest green badge, brief highlight flash | Badge: '↺ rephrased'. Card width unchanged. |
| inspect-open | Amber dashed divider, reasoning in DM Mono below body | Toggled by ⚙ button. Stays open until hover ends or toggled off. |
| evaluated | Strength dot visible top-right | Dot color reflects evaluator assessment. Tooltip on hover. |
| dismissed | Scale→0, opacity→0, translateX 60px, 280ms spring | Card removed from DOM after animation. Other cards reflow. |

---

## 07  Visual Design Specification

### 7.1  Design Direction

Light, paper-like, tactile. The canvas should feel like a physical desk with index cards on it — warm, textured, analogue. Not a tech dashboard. Not a SaaS product. A thinking surface. Every visual decision reinforces the metaphor that you are handling physical material.

The Blueprint panel should feel like a brief — a contract between you and the AI before work begins. The Evaluator indicators should feel like a mentor's pencil marks — subtle, helpful, never intrusive.

### 7.2  Colour Tokens

| CSS Variable | Hex Value | Usage |
|---|---|---|
| --bg-canvas | #F5F0E8 | Page background — warm parchment |
| --bg-card | #FFFFFF | Card face — pure white |
| --bg-card-hover | #FAFAF8 | Card hover — barely perceptible warm shift |
| --border-card | #E8E4DE | Card border — soft warm grey |
| --bg-blueprint | #FDFCF9 | Blueprint panel background — slightly warmer than card |
| --border-blueprint | #D8D2C8 | Blueprint panel border — warm tan |
| --text-body | #2A2520 | Primary text — near-black, warm undertone |
| --text-muted | #A09280 | Labels, status, secondary copy |
| --text-meta | #C0B8AA | Placeholder, empty state text |
| --action-compress | #2D2D2D | Compress button + badge — charcoal |
| --action-expand | #1A4A8A | Expand button + badge — deep blue |
| --action-rephrase | #2D6A2D | Rephrase button + badge — forest green |
| --action-inspect | #8A6A00 | Inspect button + badge — dark amber |
| --action-dismiss | #C0392B | Dismiss button — red |
| --eval-strong | #2D6A2D | Evaluator dot — strong (same as rephrase green) |
| --eval-moderate | #8A6A00 | Evaluator dot — moderate (same as inspect amber) |
| --eval-weak | #C0392B | Evaluator dot — weak (same as dismiss red) |
| --eval-overlap | #A09280 | Evaluator overlap line — muted warm grey |
| --palette-bg | #2A2520 | Command palette background — dark warm |
| --palette-text | #F5F0E8 | Command palette text — parchment on dark |
| --shadow-idle | 0 2px 8px rgba(0,0,0,0.04) | Default card shadow |
| --shadow-hover | 0 8px 32px rgba(0,0,0,0.10) | Hovered card shadow |

### 7.3  Typography Stack

| Role | Family | Size / Weight | Usage |
|---|---|---|---|
| Wordmark | Playfair Display | 28px / 800 | CLAY logo in header only |
| Card body | Lora | 15.5px / 400 | All card paragraph text — high readability serif |
| UI chrome | DM Mono | 11–13px / 400–500 | Labels, badges, status line, action buttons, export, evaluator bar |
| Placeholder | Lora | 16px / 400 italic | Empty state and streaming preview |
| Inspect text | DM Mono | 12.5px / 400 | Reasoning revealed below card — monospace signals 'metadata' |
| Blueprint topics | DM Mono | 13px / 400 | Topic checklist in blueprint panel |
| Blueprint interpretation | Lora | 14.5px / 400 italic | Claude's interpretation of the query |
| Command palette input | Lora | 15px / 400 | Natural language command input |
| Command palette suggestions | DM Mono | 12px / 400 | Action suggestions in palette dropdown |

---

## 08  Technical Architecture

### 8.1  Stack — Final Decisions

| Layer | Package / Version | Decision Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | CopilotKit requires Next.js runtime. App Router = server actions simplify API routes. |
| Language | TypeScript 5.x | Type safety on Card state and evaluator results prevents runtime surprises during demo. |
| UI | React 19 (bundled with Next.js 15) | Required for CopilotKit hooks. |
| Animation | framer-motion ^11 | Spring physics for card animations. AnimatePresence for card enter/exit. |
| AI framework | @copilotkit/react-core + @copilotkit/react-ui | useCopilotAction() maps gestures to Claude calls. useCopilotReadable() exposes canvas state. CopilotPopup for command palette. |
| LLM — CopilotKit agent | claude-haiku-4-5-20251001 (command palette reasoning) | Powers NL command interpretation in Cmd+K palette. Haiku for speed — palette actions must feel instant (< 1s reasoning + action latency). |
| LLM — quality ops | claude-sonnet-4-5 (expand, rephrase) | Best reasoning for nuanced rephrasing. |
| LLM — fast ops | claude-haiku-4-5-20251001 (compress, inspect, blueprint, evaluator) | 8× cheaper, <2s, sufficient for structured analysis. |
| Caching | @upstash/redis | Semantic cache for repeated gestures + blueprint + evaluator. 24h TTL. |
| State management | zustand ^4 | Lightweight, no boilerplate. useClayStore() holds all card + evaluator state. |
| Styling | CSS Modules + CSS custom properties | No Tailwind — paper aesthetic needs sub-pixel control impossible with utility classes. |
| Hosting | Vercel | Zero-config. Auto-deploys from GitHub. Free tier sufficient for demo day. |
| P1: Video avatar | @tavus/cvi-ui (if time) | Tavus conversational avatar for Clay Coach. React component library. |

**Removed from v2:** `@use-gesture/react` (touch gestures unreliable on MacBook), `@react-pdf/renderer` (no demo impact).

### 8.2  Project Directory Structure

```
clay/
  ├── app/
  │   ├── layout.tsx               ← Root layout + CopilotKit provider
  │   ├── page.tsx                 ← Main canvas page + Blueprint orchestration
  │   ├── error.tsx                ← Global error boundary
  │   ├── globals.css              ← CSS tokens, font imports, @keyframes
  │   └── api/
  │       ├── copilotkit/
  │       │   └── route.ts         ← CopilotKit runtime (all card actions + evaluator)
  │       ├── claude/
  │       │   └── route.ts         ← Direct streaming endpoint for initial query
  │       └── blueprint/
  │           └── route.ts         ← Blueprint generation endpoint
  ├── components/
  │   ├── Canvas.tsx               ← Card grid, stagger orchestration, evaluator overlay
  │   ├── Card.tsx                 ← Individual card + hover sidebar + evaluator dot
  │   ├── ActionSidebar.tsx        ← 5 hover action buttons
  │   ├── Blueprint.tsx            ← Pre-response outline panel + topic checkboxes
  │   ├── EvaluatorBar.tsx         ← Overall evaluator summary bar
  │   ├── QueryInput.tsx           ← Textarea + submit + Cmd+Enter
  │   ├── CommandPalette.tsx       ← CopilotKit popup wrapper, styled for CLAY
  │   ├── StreamingPreview.tsx     ← Live streaming placeholder
  │   ├── StatusBar.tsx            ← App state status messages
  │   ├── GestureLegend.tsx        ← Bottom fixed legend bar
  │   ├── ExportButton.tsx         ← Markdown + clipboard
  │   └── EmptyState.tsx           ← Empty canvas with example chips
  ├── hooks/
  │   ├── useClayStore.ts          ← Zustand: cards[], evaluator results, all mutations
  │   ├── useCopilotActions.ts     ← All CopilotKit action + readable registrations
  │   └── useEvaluator.ts          ← Evaluator trigger logic, debounce, caching
  ├── lib/
  │   ├── claude.ts                ← Streaming API client + response helpers
  │   ├── prompts.ts               ← All system prompts centralised here
  │   ├── parser.ts                ← Splits Claude text into Card[] array
  │   ├── redis.ts                 ← Upstash client + cache get/set helpers
  │   └── demo.ts                  ← DEMO_CARDS for ?demo=1 mode
  └── types/
      └── index.ts                 ← Card, CardVariant, EvaluatorResult, BlueprintTopic types
```

---

## 09  API & Data Flow Specification

### 9.1  Blueprint Flow (Pre-Response)

User submits a query — Blueprint negotiation before full generation:

1. User types in QueryInput → presses Cmd/Ctrl+Enter or clicks 'ask'
2. Status: '● Preparing blueprint…'
3. POST /api/blueprint body: `{ query }` 
4. Route calls Anthropic SDK with claude-haiku-4-5-20251001, BLUEPRINT_PROMPT
5. Response: `{ interpretation: string, topics: string[] }` (4–7 topics)
6. Redis: cache blueprint by query hash. Future identical queries return instantly.
7. Blueprint.tsx mounts below QueryInput with spring animation
8. User reviews interpretation (editable), toggles topic checkboxes
9. User clicks "Sculpt Response" (or auto-proceed fires after 5s countdown — resets on any panel interaction, disabled in ?demo=1)
10. Blueprint.tsx collapses (height → 0, opacity → 0, 0.3s)
11. Selected topics passed to streaming generation

### 9.2  Card Generation Flow (Streaming)

Blueprint confirmed — Claude generates for selected topics:

1. useClayStore.clearCards() → StreamingPreview mounts, status: '● Sculpting response…'
2. POST /api/claude body: `{ messages: [{ role:'user', content: query }], selectedTopics }`
3. Route calls Anthropic SDK with claude-sonnet-4-5, stream:true, SYSTEM_PROMPT (includes selected topics)
4. Client ReadableStream: each delta appended to streamingText state
5. On stream end: parser.ts splits fullText on double-newline → Card[]. Each card's `.topic` field assigned from selectedTopics by index (enables topic-aware commands in palette).
6. Cards added to store one at a time with 220ms setInterval stagger
7. Each card mounts with fade-in animation (opacity 0→1, translateY, scale)
8. StreamingPreview unmounts. Status: '{n} cards ready — hover to sculpt · double-click to rephrase'
9. 500ms after last card: Evaluator fires automatically (see 9.3)

### 9.3  Evaluator Flow (Post-Response Intelligence)

Cards on canvas — Claude Evaluator analyses automatically:

1. useEvaluator.ts: 500ms after last card renders, or 800ms debounce after any card action
2. Build evaluator input: `{ query, cards: [{ id, text, variant }] }`
3. Redis check: cache key = `clay:eval:${hash(cards_text)}` — if HIT, use cached result
4. If MISS: POST to /api/copilotkit, action: 'evaluate'
5. Route calls claude-haiku-4-5-20251001 with EVALUATOR_PROMPT
6. Response: `{ cards: [{ id, strength, suggestion, overlaps_with }], overall, recommended_action }`
7. Redis SET with 24h TTL
8. useClayStore.setEvaluatorResults(results)
9. UI renders: strength dots fade in (0.5s), overlap lines draw, evaluator bar shows overall text
10. Status update: evaluator bar text replaces generic status

### 9.4  Card Action Flow (Redis Cache + CopilotKit)

User clicks ↙ Compress on a card — step by step:

1. ActionSidebar fires onCompress(card.id)
2. useClayStore.setLoading(card.id, true) → shimmer overlay, pointer-events:none
3. useCopilotAction dispatches: `{ action: 'compress', cardId, content: card.text }`
4. /api/copilotkit route receives action
5. lib/redis.ts: key = `clay:compress:${hash(card.text)}` → Redis GET
   - CACHE HIT → return `{ result, cached: true }` immediately (~20ms)
   - CACHE MISS → continue to step 6
6. Anthropic SDK: claude-haiku-4-5-20251001 + COMPRESS_PROMPT + card.text
7. Response returned (no streaming needed at Haiku speed)
8. Redis SET key → result, EX 86400 (24h TTL)
9. Route returns `{ result, cached: false }`
10. useClayStore.updateCard(id, `{ text: result, variant: 'compressed', loading: false }`)
11. Card animates: text swaps, badge appears, card shrinks with spring physics
12. Evaluator re-fires with 800ms debounce (see 9.3)

### 9.5  Command Palette Flow

User hits Cmd+K and types a natural language command:

1. Cmd+K → CopilotPopup opens (dark warm bg, centered modal)
2. User types: "remove all weak cards"
3. CopilotKit agent receives command + full canvas state (via useCopilotReadable)
4. Agent reasons: identifies cards where evaluator strength = 'weak', resolves to card IDs
5. Agent calls useCopilotAction: `dismissCards([id1, id2])`
6. Handler: cards dismiss simultaneously (parallel exit animations)
7. Evaluator re-fires for remaining cards
8. Palette closes automatically after action completes

### 9.6  All Prompt Definitions

```typescript
// lib/prompts.ts — single source of truth for all Claude instructions

export const BLUEPRINT_PROMPT = (query: string) => `
You analyse user queries and return a structured blueprint for a comprehensive response.

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
`;

export const SYSTEM_PROMPT = (selectedTopics?: string[]) => `
You are CLAY's response engine. Your output will be split into individual cards.
${selectedTopics ? `The user has specifically requested coverage of these topics ONLY: ${selectedTopics.join(', ')}. Do NOT cover other topics.` : ''}

STRICT RULES:
- Respond with exactly ${selectedTopics ? selectedTopics.length : '4-7'} paragraphs separated by blank lines
- Each paragraph = one distinct idea, 2–4 sentences max
- Each paragraph should correspond to one of the requested topics
- NO headers, bullet points, bold, or markdown of any kind
- Clean direct prose — each paragraph must stand alone as a complete thought
`;

export const COMPRESS_PROMPT = (text: string) =>
  `Compress to a single punchy sentence. No preamble: "${text}"`;

export const EXPAND_PROMPT = (text: string) =>
  `Expand into 3-5 sentences with a concrete example. No preamble: "${text}"`;

export const REPHRASE_PROMPT = (text: string) =>
  `Rephrase from a completely different angle or metaphor.
   Same core meaning. No preamble: "${text}"`;

export const INSPECT_PROMPT = (text: string) =>
  `Explain the reasoning or assumptions behind this in 2-3 sentences.
   Start directly, no preamble: "${text}"`;

export const EVALUATOR_PROMPT = (query: string, cards: { id: string; text: string }[]) => `
You are CLAY's Evaluator — a strict, constructive editor. You analyse a set of idea cards
generated from a user's query and provide honest assessments.

User query: "${query}"

Cards:
${cards.map((c, i) => `Card ${i + 1} (${c.id}): "${c.text}"`).join('\n')}

For each card, assess:
- strength: "strong" | "moderate" | "weak"
- suggestion: 1 actionable sentence (what the user should do with this card — compress, expand, rephrase, dismiss, or keep as-is)
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
}
`;
```

---

## 10  Team Structure & Responsibilities

| Person | Role | Owns | Critical Path Items |
|---|---|---|---|
| Raj | Frontend Lead | Canvas.tsx, Card.tsx, ActionSidebar.tsx, Blueprint.tsx, EvaluatorBar.tsx, StatusBar.tsx, all animations, CSS | Card fade-in animation, hover sidebar, blueprint panel UI, evaluator dot rendering, all visual state transitions |
| Shyam | Backend Lead | /api/claude/route.ts, /api/copilotkit/route.ts, /api/blueprint/route.ts, lib/claude.ts, lib/redis.ts, lib/prompts.ts, useEvaluator.ts | Blueprint endpoint, streaming endpoint, CopilotKit runtime with all actions + evaluator, Upstash Redis cache |
| Krutin | Full-Stack Lead | useClayStore.ts, useCopilotActions.ts, types/index.ts, ExportButton.tsx, CommandPalette.tsx, QueryInput.tsx, demo mode, bug fixing, demo prep | State glue, TypeScript types, CopilotKit command palette wiring, export, demo mode, integration testing, demo rehearsal |

### Team coordination rules

- **Git:** feature branches (raj/cards, shyam/api, krutin/store) — merge to main every 90 mins
- **First integration checkpoint: 12:00** — full query → blueprint → card pipeline must work before lunch
- **15:30** — Krutin freezes new features, owns demo prep exclusively from this point
- **Demo device:** Krutin's MacBook (trackpad). Shyam's machine as API monitoring backup
- **If blocked for > 20 minutes:** say it out loud immediately — do not sink time silently

---

## 11  One-Day Build Timeline

| Time | Phase | Raj — Frontend | Shyam — Backend | Krutin — Full-Stack |
|---|---|---|---|---|
| 9:00–10:30 | Setup (during keynote + sponsor talks) | Init Next.js 15 repo, install framer-motion, CSS token setup, Playfair+Lora+DM Mono fonts. **Raj attends keynote + sponsor talks** — note any judging criteria intel. Krutin + Shyam code through talks. | Set up .env.local, test Anthropic API key, install @copilotkit packages, Upstash Redis account | Define TypeScript types (Card, CardVariant, EvaluatorResult, BlueprintTopic), set up Zustand store, connect GitHub repo, deploy skeleton to Vercel |
| 10:30–12:00 | Phase 1: Core Loop + Blueprint | Build Canvas.tsx + Card.tsx with fade-in animation, QueryInput.tsx, StreamingPreview.tsx, Blueprint.tsx panel UI | Build /api/blueprint endpoint, /api/claude streaming route, lib/parser.ts card splitter, test blueprint → stream pipeline | Wire QueryInput → Blueprint → /api/claude → parser → Zustand store → Canvas render. Full pipeline by 11:30. |
| 12:00–13:00 | Lunch | — | — | Quick review of Phase 1. Fix the one thing that's broken. Do NOT add features. |
| 13:00–14:30 | Phase 2: Card Actions | Build ActionSidebar.tsx, hover state, all 5 buttons, loading shimmer, card variant badges, dismiss animation | Wire compress/expand/rephrase/inspect Claude calls via CopilotKit runtime + useCopilotReadable, test each action end-to-end | Connect CopilotKit actions to Zustand updateCard. Set up useCopilotActions.ts hook. Test full action → Claude → card update loop. |
| 14:30–15:30 | Phase 3: Evaluator + Demo | Build EvaluatorBar.tsx, strength dot rendering on Card.tsx, overlap line SVG, evaluator animations | Build evaluator action in CopilotKit runtime, EVALUATOR_PROMPT, wire useEvaluator.ts with debounce + Redis caching | Build demo mode (?demo=1 pre-loads sculpted cards with evaluator data). lib/demo.ts with 5 pre-written cards. |
| 15:30–17:00 | Phase 4: Palette + Cache + Export | Final animation polish — card transitions, blueprint collapse, evaluator fade-in timing | Add Upstash Redis cache to all action routes + blueprint + evaluator. Test cache HITs. | Build CommandPalette.tsx (CopilotKit popup styled for CLAY). Build ExportButton.tsx: Markdown + clipboard. Cmd+K keybinding. |
| 17:00–18:00 | Phase 5: Polish + QA | StatusBar.tsx, card count in header, empty state, GestureLegend.tsx update, final visual sweep | Error handling on all routes: 429, 500, network. Graceful failure messages. Monitor credit usage. | Error boundary (app/error.tsx). Rehearse 90s demo script. Full QA sweep. Bug fixes. |
| 18:00 | Submit | — | — | Submit project form. Screenshot canvas. Write description. Done. |

---

## 12  Risk Register

| Risk | Likelihood | Severity | Owner | Mitigation |
|---|---|---|---|---|
| Blueprint adds complexity to Phase 1 | Medium | High | Shyam | Blueprint endpoint is a single non-streaming Haiku call returning JSON. If it breaks, skip it and generate cards directly — rest of app works without it. |
| Evaluator JSON parsing fails | Medium | Medium | Shyam | Wrap evaluator in try/catch. If JSON is malformed, silently skip indicators. Cards still fully functional without evaluator. |
| CopilotKit command palette setup eats time | Medium | Medium | Krutin | Fallback: use CopilotPopup with minimal styling. If CopilotKit entirely broken, cut palette and rely on hover buttons. |
| CopilotKit runtime setup eats time | Medium | High | Shyam | Fallback: call Anthropic SDK directly from /api/claude. CopilotKit is abstraction, not hard dependency. |
| Claude returns response as one block | Medium | High | Shyam | parser.ts: split on \n\n first, then \n, then sentence boundary. Final fallback: split every 100 words. |
| API credits run out mid-demo | Low | High | Shyam | Redis cache aggressively. Use Haiku for compress/inspect/blueprint/evaluator. Demo mode requires zero API calls. |
| Demo query produces poor Claude output | Low | High | Krutin | Pre-test the exact demo query before 17:00. Have 2 backup queries ready. |
| Evaluator indicators clutter the UI | Low | Medium | Raj | Indicators are 8px dots with tooltips — minimal footprint. Can be hidden entirely via a toggle if needed. |
| Blueprint → card count mismatch | Medium | Medium | Shyam | Claude may not produce exactly N paragraphs for N selected topics. parser.ts reconciles: merge smallest adjacent paragraphs if over-count, accept under-count gracefully. Demo script uses "only the topics I selected" (not a specific number). Evaluator assesses whatever lands. |
| Overlap SVG lines misposition on reflow | Medium | Low | Raj | getBoundingClientRect() lines can break on card dismiss/resize. Kill switch: `hide-overlap-lines` CSS class hides all lines instantly. Strength dots + evaluator bar text convey overlap info independently. Lines are visual polish, not load-bearing. |

---

## 13  Judging Criteria Alignment

| Criterion | Requirement | CLAY's Answer | Confidence |
|---|---|---|---|
| Novelty | Unexpected UI — break convention | **Three novel patterns no one else will have:** (1) Pre-response Blueprint negotiation — user curates before generation. (2) Claude Evaluator driving UI indicators on cards. (3) Natural language command palette controlling the canvas. No other team will ship all three. | ★★★★★ |
| Feel | Playful, intuitive, newly possible | Deselecting Blueprint topics feels like striking items off a brief. Evaluator dots appearing after cards land feels like a mentor reviewing your work. Compressing a card into one sentence is physically satisfying. Typing "remove weak cards" and watching them vanish is a crowd moment. | ★★★★★ |
| Integration | Claude drives interface logic, not just content | Claude operates at four levels: (1) Blueprint — structures the response plan. (2) Generation — creates card content. (3) Evaluator — analyses cards and drives UI indicators. (4) Command interpretation — understands NL commands via CopilotKit. Claude IS the interface. | ★★★★★ |
| Sponsor use | Use sponsors meaningfully | **Anthropic:** Core LLM powering all four Claude layers + dual model strategy (Haiku/Sonnet). **CopilotKit:** useCopilotReadable exposes state, useCopilotAction defines tools, CopilotPopup is the command palette — architecturally essential. **Redis:** Caches blueprints, card actions, evaluator results — makes demo snappy and saves API credits. **Tavus (P1):** Clay Coach avatar as conversational evaluator. | ★★★★★ |
| Demoability | Works live in 90 seconds | Demo mode pre-loads cards + evaluator data. Zero API calls needed. Three clear "novel moments" at 0:12, 0:30, and 0:48. Judge can sculpt immediately. | ★★★★★ |

---

## 14  Success Metrics

### Demo Day
- A judge says "I've never seen that before" during the Blueprint or Evaluator moment
- A judge reaches forward and tries a gesture themselves
- Full journey (ask → blueprint → sculpt 3 cards → command palette → export) completes in under 90 seconds
- Zero white screens or unhandled errors during the demo
- At least one judge asks 'can I use this after today?'

### Technical
- Blueprint generation: < 1.5 seconds
- Initial Claude response → cards on screen: < 8 seconds
- Evaluator analysis → indicators visible: < 2 seconds after cards land
- Compress / inspect via Haiku: < 2 seconds
- Redis cache HIT response: < 100ms
- Command palette → action execution: < 3 seconds
- Export (Markdown + clipboard): < 500ms

---

## 15  Six Claude Code Build Segments

These six prompts are written to be given to Claude Code one at a time, in order.
Verify each segment works before proceeding to the next. Do not combine segments.

---

### SEGMENT 1 OF 6 — Project Foundation + Card Canvas + Blueprint System

**OBJECTIVE**
Create a working Next.js 15 TypeScript project named 'clay' with a paper-aesthetic canvas.
Claude streams a response into the app. The response is split into cards that fade in sequentially.
BEFORE generating cards, a Blueprint panel shows Claude's interpretation + topic outline.

**STACK**
Next.js 15 (App Router), TypeScript 5, Framer Motion 11, Zustand 4
Fonts: Playfair Display (wordmark), Lora (card body), DM Mono (UI chrome) — via Google Fonts

**NEW PACKAGES**
```
npm install next@15 react@19 react-dom@19 framer-motion@11 zustand@4 @anthropic-ai/sdk
```

**DELIVERABLES — create every file listed**

**app/layout.tsx** — root layout, font imports, metadata
**app/page.tsx** — renders QueryInput, Blueprint (conditional), StreamingPreview (conditional), Canvas
**app/globals.css** — ALL CSS custom properties (full token list below), @keyframes: shimmer, fadeIn, blink

**components/Canvas.tsx** — receives cards[], maps to `<Card />` with 220ms stagger via setTimeout

**components/Card.tsx** — framer-motion div: opacity 0→1, y:12→0, scale:0.98→1 on mount. Simple fade-in only, no pulse ring.

**components/Blueprint.tsx** — Pre-response outline panel:
- Container: var(--bg-blueprint) bg, var(--border-blueprint) border, 12px radius, 20px padding
- Shows Claude's interpretation (Lora italic 14.5px, editable via contentEditable)
- Checklist of 4–7 topics: custom checkboxes (charcoal check, warm border unchecked), DM Mono 13px
- "Sculpt Response" button: pill, 44px height, var(--text-body) bg, white text, Playfair Display 14px bold
- Auto-proceed: 2px progress bar below button, var(--action-expand) color, 5s countdown. Resets on any panel interaction (checkbox toggle, interpretation edit, mouse enter). Disabled when ?demo=1 — manual click only during live demo.
- Collapse animation: framer-motion height→0, opacity→0, marginBottom→0, 0.3s spring
- Props: interpretation, topics, onConfirm(selectedTopics), onUpdateInterpretation

**components/QueryInput.tsx** — textarea (Lora font), submit button, fires onSubmit(query) on Cmd/Ctrl+Enter

**components/StreamingPreview.tsx** — dashed border card showing live streaming text + blinking cursor

**components/EmptyState.tsx** — 4 example query chips: 'Why do people struggle with chat interfaces?', 'What makes a great product demo?', 'Why do startups fail?', 'How does machine learning work?'

**components/GestureLegend.tsx** — fixed bottom bar (only visible when cards.length > 0): ↙compress  ↗expand  ↺rephrase  ⚙inspect  ✕dismiss

**hooks/useClayStore.ts** — Zustand store:
```typescript
interface ClayStore {
  cards: Card[];
  query: string;
  blueprintData: BlueprintData | null;
  evaluatorResults: EvaluatorResults | null;
  status: AppStatus;
  addCard: (card: Card) => void;
  clearCards: () => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  removeCard: (id: string) => void;
  setBlueprintData: (data: BlueprintData | null) => void;
  setEvaluatorResults: (results: EvaluatorResults | null) => void;
  setStatus: (status: AppStatus) => void;
  setQuery: (query: string) => void;
}
```

**lib/claude.ts** — async streamClaude(query, selectedTopics?): calls /api/claude, reads ReadableStream, returns full text

**lib/parser.ts** — parseIntoCards(text:string, selectedTopics?:string[]): Card[] — split on \n\n, filter < 20 chars, assign uid(). If selectedTopics provided, assign card.topic from selectedTopics by index. Reconciliation: if Claude produces fewer paragraphs than topics, keep as-is (some topics merged). If more paragraphs than topics, merge smallest adjacent paragraphs until count matches. Final fallback: accept whatever count the parser produces — the evaluator will assess quality regardless.

**lib/prompts.ts** — export SYSTEM_PROMPT, BLUEPRINT_PROMPT, COMPRESS_PROMPT, EXPAND_PROMPT, REPHRASE_PROMPT, INSPECT_PROMPT, EVALUATOR_PROMPT (all prompts as defined in Section 09.6)

**app/api/claude/route.ts** — POST, receives `{ messages, selectedTopics }`, calls Anthropic SDK claude-sonnet-4-5 stream:true with SYSTEM_PROMPT(selectedTopics), returns ReadableStream

**app/api/blueprint/route.ts** — POST, receives `{ query }`, calls Anthropic SDK claude-haiku-4-5-20251001 with BLUEPRINT_PROMPT(query), parses JSON response, returns `{ interpretation, topics }`

**types/index.ts** —
```typescript
type CardVariant = 'original' | 'compressed' | 'expanded' | 'rephrased';
interface Card { id: string; text: string; topic: string | null; variant: CardVariant; loading: boolean; inspect: string | null; }
interface BlueprintData { interpretation: string; topics: BlueprintTopic[]; }
interface BlueprintTopic { text: string; selected: boolean; }
type EvalStrength = 'strong' | 'moderate' | 'weak';
interface CardEvaluation { id: string; strength: EvalStrength; suggestion: string; overlaps_with: number | null; }
interface EvaluatorResults { cards: CardEvaluation[]; overall: string; recommended_action: string; }
type AppStatus = { type: 'idle' | 'blueprinting' | 'loading' | 'streaming' | 'ready' | 'card-loading' | 'evaluating' | 'error'; message?: string; };
```

**CSS TOKENS** (put in globals.css :root)
```css
--bg-canvas:#F5F0E8; --bg-card:#FFFFFF; --bg-card-hover:#FAFAF8;
--border-card:#E8E4DE; --bg-blueprint:#FDFCF9; --border-blueprint:#D8D2C8;
--text-body:#2A2520; --text-muted:#A09280; --text-meta:#C0B8AA;
--action-compress:#2D2D2D; --action-expand:#1A4A8A; --action-rephrase:#2D6A2D;
--action-inspect:#8A6A00; --action-dismiss:#C0392B;
--eval-strong:#2D6A2D; --eval-moderate:#8A6A00; --eval-weak:#C0392B;
--eval-overlap:#A09280; --palette-bg:#2A2520; --palette-text:#F5F0E8;
--shadow-idle:0 2px 8px rgba(0,0,0,0.04); --shadow-hover:0 8px 32px rgba(0,0,0,0.10);
```

**ACCEPTANCE CRITERIA**
- Type a question, press Cmd+Enter → Blueprint panel slides in with interpretation + topics (< 1.5s)
- Uncheck 2 topics → click "Sculpt Response" → Blueprint collapses → StreamingPreview shows live text
- 4–5 cards fade in sequentially matching selected topic count
- Each card renders Lora serif text in a white rounded card on parchment background
- Empty state shows 4 example chips. Clicking a chip populates the input.
- Auto-proceed countdown works: 5s bar animates, resets on any panel interaction, auto-confirms if untouched. Disabled when ?demo=1.

---

### SEGMENT 2 OF 6 — Card Actions + Action Sidebar + CopilotKit Integration

**OBJECTIVE**
Add the complete card interaction layer. Hovering a card reveals 5 action buttons.
Each button triggers a Claude API call that transforms the card in real time.
All actions routed through CopilotKit runtime with useCopilotReadable exposing canvas state.

**PREREQUISITES**
Segment 1 complete and verified. Blueprint → cards pipeline works.

**NEW PACKAGES**
```
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

**DELIVERABLES**

**components/ActionSidebar.tsx**
Position: absolute right:-48px top:50% translateY(-50%), flex-col gap:6px, fadeIn 0.15s on mount
5 buttons (34×34px, 8px border-radius, colored by action token, box-shadow 0 2px 8px rgba(0,0,0,0.18)):
↙ (--action-compress)  ↗ (--action-expand)  ↺ (--action-rephrase)  ⚙ (--action-inspect)  ✕ (--action-dismiss)
Each button: title tooltip, onClick calls parent handler, scale(1.12) on hover

**components/Card.tsx — update to add:**
- onMouseEnter/Leave to show/hide ActionSidebar
- onDoubleClick → rephrase handler
- loading state: shimmer overlay (gradient sweep animation) + text opacity 0.5 + pointer-events:none
- variant badge (top-left, absolute, -10px top): compressed=charcoal / expanded=blue / rephrased=green / inspect=amber
- inspect panel: when card.inspect !== null, show below body with DM Mono font, amber dashed top-border
- dismiss animation: animate to { opacity:0, x:60, scale:0.95 } then removeCard(id)

**hooks/useCopilotActions.ts**
```typescript
// Register all canvas state as readable for CopilotKit
useCopilotReadable({
  description: "Current CLAY canvas state: cards with their text, variants, and evaluator assessments",
  value: { cards, evaluatorResults, query }
});

// Register all card actions
useCopilotAction({
  name: "compressCard",
  description: "Compress a card to one punchy sentence",
  parameters: [{ name: "cardId", type: "string", required: true }],
  handler: async ({ cardId }) => { /* compress logic */ }
});

// Similar for: expandCard, rephraseCard, inspectCard, dismissCards
```

**app/api/copilotkit/route.ts** — CopilotKit runtime configured with claude-haiku-4-5-20251001 as the agent model (for NL command interpretation in palette). 4 card actions:
- 'compress': calls claude-haiku-4-5-20251001 + COMPRESS_PROMPT, checks Redis cache first, returns { result:string }
- 'expand':   calls claude-sonnet-4-5 + EXPAND_PROMPT, checks Redis cache first, returns { result:string }
- 'rephrase': calls claude-sonnet-4-5 + REPHRASE_PROMPT, checks Redis cache first, returns { result:string }
- 'inspect':  calls claude-haiku-4-5-20251001 + INSPECT_PROMPT, checks Redis cache first, returns { result:string }
- System prompt for all actions: 'Return ONLY the result. No preamble, no explanation, nothing else.'

**app/layout.tsx** — wrap children in `<CopilotKit runtimeUrl='/api/copilotkit'>`

**ACCEPTANCE CRITERIA**
- Hover card → sidebar appears from right in 0.15s
- Click ↙ → card enters loading shimmer → 1-sentence result → 'compressed' badge
- Click ↗ → expanded text with example → 'expanded' badge
- Double-click → rephrased angle → 'rephrased' badge
- Click ⚙ → inspect text appears in DM Mono below card body
- Click ✕ → card exits right → canvas reflows
- useCopilotReadable correctly exposes current card state

---

### SEGMENT 3 OF 6 — Demo Mode + Claude Evaluator Layer

**OBJECTIVE**
Add demo mode (pre-loaded cards, no API needed) — this is the safety net.
Add Claude Evaluator that analyses cards and renders UI indicators.
Demo mode should include pre-computed evaluator data.

**PREREQUISITES**
Segments 1–2 complete. Blueprint + card actions work.

**DELIVERABLES**

**lib/demo.ts**
```typescript
export const DEMO_CARDS: Card[] = [
  // 5 pre-written cards answering: 'Why do people struggle with chat interfaces?'
  // Card 1: original state — about the blank box problem
  // Card 2: compressed state — about verbosity (1 sentence)  
  // Card 3: original state — about output as finished product
  // Card 4: expanded state — about prompting skill gap (with example)
  // Card 5: rephrased state — about spatial memory (fresh metaphor)
];

export const DEMO_EVALUATOR: EvaluatorResults = {
  cards: [
    { id: 'demo-1', strength: 'strong', suggestion: 'Clear and well-argued. Keep as-is.', overlaps_with: null },
    { id: 'demo-2', strength: 'strong', suggestion: 'Already compressed. Concise and punchy.', overlaps_with: null },
    { id: 'demo-3', strength: 'weak', suggestion: 'This point is vague — try expanding with a concrete example.', overlaps_with: null },
    { id: 'demo-4', strength: 'strong', suggestion: 'Great concrete example. This is the strongest card.', overlaps_with: null },
    { id: 'demo-5', strength: 'moderate', suggestion: 'Overlaps with card 1 — consider dismissing one.', overlaps_with: 1 },
  ],
  overall: '3 strong points. Cards 1 and 5 overlap — consider dismissing one. Card 3 needs expansion.',
  recommended_action: 'Expand card 3 to strengthen the weakest argument.'
};
```

**Demo mode activation (app/page.tsx):**
- useEffect: if searchParams.get('demo') === '1', load DEMO_CARDS + DEMO_EVALUATOR from lib/demo.ts
- Add a small 'demo mode' pill badge (DM Mono 10px, amber border) in top-right corner when active
- Dismissing all demo cards → EmptyState appears → typing a new query exits demo mode
- Demo mode works with zero network requests

**hooks/useEvaluator.ts**
```typescript
// Evaluator trigger logic
// Fires 500ms after cards finish rendering
// Re-fires with 800ms debounce after any card action (compress, expand, rephrase, dismiss)
// Checks Redis cache first, calls Claude Haiku if MISS
// Updates useClayStore.setEvaluatorResults()
```

**app/api/copilotkit/route.ts — add evaluator action:**
- 'evaluate': receives `{ query, cards }`, calls claude-haiku-4-5-20251001 + EVALUATOR_PROMPT
- Parses JSON response, validates structure, returns EvaluatorResults
- Redis cache: key = `clay:eval:${hash(cards_text_concatenated)}`, 24h TTL
- Try/catch: if JSON parse fails, return null (UI gracefully shows no indicators)

**components/Card.tsx — add evaluator rendering:**
- Strength dot: 8px circle, position absolute top:6px right:6px
- Color: var(--eval-strong) / var(--eval-moderate) / var(--eval-weak) based on strength
- Fade-in: opacity 0→1, 0.5s transition after evaluator results arrive
- Tooltip on hover: DM Mono 11px, dark bg pill, shows suggestion text

**components/EvaluatorBar.tsx**
- Position: below Blueprint area / StatusBar, above Canvas, full width
- Font: DM Mono 11.5px, var(--text-muted)
- Shows evaluator.overall text
- Fade-in: opacity 0→1, 0.3s after evaluator results arrive
- Only visible when evaluatorResults !== null and cards.length > 0

**Canvas.tsx — add overlap lines:**
- When evaluator detects overlaps_with, render SVG line between the two card elements
- Line: var(--eval-overlap), 1px dashed, positioned via getBoundingClientRect()
- Fade-in with evaluator results
- Recalculate positions on card dismiss/reflow via ResizeObserver or layout effect re-render
- Kill switch: CSS class `hide-overlap-lines` on Canvas hides all lines instantly. Toggle if lines misposition during demo — strength dots + evaluator bar text independently convey overlap information.

**ACCEPTANCE CRITERIA**
- ?demo=1 loads 5 cards + evaluator data instantly with zero network requests
- Strength dots visible on all demo cards with correct colors
- Overlap line visible between cards 1 and 5
- Evaluator bar shows overall text
- Hover strength dot → tooltip shows suggestion
- Submit a live query → cards render → evaluator fires automatically → dots fade in
- Compress a card → evaluator re-fires after 800ms → dots update

---

### SEGMENT 4 OF 6 — CopilotKit Command Palette + Redis Cache + Export

**OBJECTIVE**
Add the CopilotKit-powered command palette (Cmd+K) for natural language canvas control.
Add Upstash Redis semantic caching to all routes (blueprint, actions, evaluator).
Add export system: Markdown download + copy to clipboard.

**PREREQUISITES**
Segments 1–3 complete. Blueprint + actions + evaluator all working.
Upstash Redis account created. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.

**NEW PACKAGES**
```
npm install @upstash/redis
```

**DELIVERABLES**

**components/CommandPalette.tsx**
- Wraps CopilotKit's `<CopilotPopup>` component
- Styled to match CLAY palette:
  - Background: var(--palette-bg)
  - Text: var(--palette-text)
  - Input font: Lora 15px
  - Suggestion font: DM Mono 12px
- Triggered by Cmd+K (keyboard listener in app/page.tsx) or ⌘K button in header
- Instructions prop tells the agent about CLAY context and available actions:
  "You control the CLAY canvas. Available actions: compressCard, expandCard, rephraseCard, dismissCards, highlightOverlaps. You have access to all card data and evaluator assessments. Execute the user's natural language commands."
- Auto-closes after action completes

**hooks/useCopilotActions.ts — update to add palette actions:**
```typescript
useCopilotAction({
  name: "dismissCards",
  description: "Dismiss one or more cards. Use evaluator data to identify weak or overlapping cards.",
  parameters: [{ name: "cardIds", type: "string[]", required: true }],
  handler: async ({ cardIds }) => cardIds.forEach(id => removeCard(id))
});

useCopilotAction({
  name: "highlightOverlaps",
  description: "Visually highlight overlapping cards for 2 seconds",
  parameters: [],
  handler: async () => { /* pulse overlap indicators */ }
});
```

**lib/redis.ts**
```typescript
import { Redis } from '@upstash/redis'
export const redis = Redis.fromEnv()

export async function getCached(key: string): Promise<string | null> {
  return await redis.get<string>(key);
}

export async function setCached(key: string, value: string): Promise<void> {
  await redis.set(key, value, { ex: 86400 }); // 24h TTL
}
```
Cache key format: `clay:${action}:${hash(content).slice(0,40)}`

**app/api/copilotkit/route.ts — add Redis to all actions:**
- Before Claude call: `const cached = await getCached(key)` — if cached, return immediately
- After Claude call: `await setCached(key, result)`
- Add response header: X-Cache: HIT or MISS

**app/api/blueprint/route.ts — add Redis:**
- Cache key: `clay:blueprint:${hash(query).slice(0,40)}`
- Same query returns cached blueprint instantly

**components/ExportButton.tsx**
2 export options in a dropdown triggered by '↓ export' button in header:

OPTION 1 — Copy to clipboard:
`cards.map((c,i) => \`${i+1}. ${c.text}\`).join('\n\n')` → `navigator.clipboard.writeText()`
Button label changes to '✓ copied!' for 2s then resets

OPTION 2 — Download Markdown:
```
Header: # CLAY Export\n\nQuery: {lastQuery}\nDate: {date}\n\n---\n\n
Each card: ## Card {n} [{variant}]\n\n{text}\n\n---
If evaluator data exists: append ## Evaluator Summary\n\n{overall}\n\n{recommended_action}
Blob download: clay-export-{timestamp}.md
```

**app/page.tsx** — add Cmd+K listener, pass lastQuery to ExportButton. Track query in useClayStore.

**ACCEPTANCE CRITERIA**
- Cmd+K opens command palette with CLAY styling
- Type "remove all weak cards" → weak cards (based on evaluator) dismiss simultaneously
- Type "compress the longest card" → longest card compresses
- Compress same card twice → second time returns in < 100ms (Redis HIT)
- Same query submitted twice → blueprint returns instantly (Redis HIT)
- Copy to clipboard → toast shows '✓ copied!' → clipboard contains numbered card list
- Download Markdown → .md file with all current cards, their variant labels, and evaluator summary
- Export button only visible when cards.length > 0

---

### SEGMENT 5 OF 6 — Polish Pass + Status System + Card Count

**OBJECTIVE**
Complete the UI polish layer. Add live card count to header. Build the status bar system.
Ensure all loading, error, and empty states are handled gracefully.

**PREREQUISITES**
Segments 1–4 complete. Full pipeline working: blueprint → cards → evaluator → palette → export.

**DELIVERABLES**

**app/page.tsx / components/Canvas.tsx — header updates:**
Left: '🏺 clay' in Playfair Display 28px bold + 'response sculpting' in DM Mono 11px muted
Right (visible when cards.length > 0): '{n} cards' label + evaluator summary badge + ExportButton dropdown + ⌘K button
Card count animates with framer-motion layout when count changes

**components/StatusBar.tsx** — positioned below QueryInput / Blueprint:
Font: DM Mono 11.5px, color var(--text-muted)
States and exact copy:
```
idle (no cards):       empty — show nothing
blueprinting:          '● Preparing blueprint…'            (● blinks 1s infinite)
loading:               '● Claude is thinking…'             (● blinks 1s infinite)
streaming:             '● Sculpting response…'
ready:                 '{n} cards ready — hover to sculpt · double-click to rephrase · ⌘K to command'
evaluating:            '● Evaluator analysing…'            (● blinks 1s infinite)
card-loading:          'Transforming card…'
error:                 '⚠ {error.message}'                 (color: var(--action-dismiss))
```
Transitions: opacity fade 0.2s between states

**components/Card.tsx — final polish:**
- Card variant badge uses uppercase DM Mono 10px, pill shape, 2px border matching action color
- Loading shimmer: linear-gradient sweep, 1.2s infinite, covers full card
- Inspect panel transition: height 0→auto with framer-motion AnimatePresence
- All shadows use CSS custom properties
- Evaluator dot renders correctly alongside variant badge without overlap

**Error handling in app/page.tsx:**
- try/catch around blueprint call → fall back to direct generation (skip blueprint)
- try/catch around streamClaude() → setStatus({ type:'error', message: e.message })
- try/catch in CopilotKit actions → card.loading = false, toast error message
- try/catch around evaluator → silently skip indicators (never block core flow)
- Handle 429 specifically: 'Rate limit hit — waiting 5 seconds…' then auto-retry once

**app/globals.css — final animation definitions:**
```css
@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes fadeIn { from { opacity: 0; transform: translateX(4px); } to { opacity: 1; transform: translateX(0); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
```
Duration: shimmer 1.2s linear infinite, fadeIn 0.15s ease, blink 1s infinite

**ACCEPTANCE CRITERIA**
- Status bar shows correct text for every app state (blueprint, loading, streaming, ready, evaluating, error)
- Card count in header updates instantly when cards added/removed
- Rate limit error shows user-friendly message, not a stack trace
- Blueprint failure gracefully skips to direct generation
- Evaluator failure silently skips indicators (no error shown to user)
- All card variant badges are visible and correctly colored
- Inspect panel animates open/closed smoothly

---

### SEGMENT 6 OF 6 — Error Boundary + P1 Enhancements + Final QA

**OBJECTIVE**
Add global error boundary. If time permits, add P1 enhancements (Tavus avatar, before/after animation).
Run full QA pass. Verify the complete demo journey end-to-end.

**PREREQUISITES**
Segments 1–5 complete. Full app working and polished.

**DELIVERABLES**

**app/error.tsx — Next.js error boundary:**
Displays friendly message: 'Something went wrong. Try refreshing.'
Shows CLAY logo so the page still looks intentional
Reset button calls reset()

**P1: Before/After Reveal Animation (if time — Raj owns):**
When cards first arrive after streaming, briefly (0.8s) show the raw text as a single monolithic block
(styled like a typical chat response — gray bg, monospace feel). Then animate the "decomposition":
horizontal fracture lines appear between paragraphs (0.2s), cards separate and float to positions (0.6s spring).
This is the visual "wow" — the text literally breaks apart into sculpting material.

**P1: Tavus Clay Coach Avatar (if time — Krutin owns):**
Small (200×200px) floating panel bottom-right corner, collapsible.
Uses `@tavus/cvi-ui` React components:
1. POST /api/tavus/conversation — creates Tavus conversation with replica + persona
2. Persona context includes current cards + evaluator data
3. Avatar speaks evaluator suggestions aloud
4. Muted by default with "unmute" button
Fallback: if Tavus API unavailable, panel doesn't render. Evaluator bar handles all feedback.

**QA checklist — verify ALL of the following before submission:**
```
BLUEPRINT JOURNEY: type query → blueprint appears (< 1.5s) → uncheck 2 topics → 
  click "Sculpt" → cards generate for selected topics only
USER JOURNEY: cards → evaluator dots fade in → compress one → expand one → rephrase 
  one → Cmd+K "remove weak cards" → dismiss → export MD → copy clipboard
DEMO JOURNEY: ?demo=1 → 5 pre-loaded cards + evaluator dots → sculpt all 5 → 
  Cmd+K works → export → works with zero API calls
ERRORS: disconnect wifi → graceful error message (no white screen)
ERRORS: invalid API key → graceful error message
ERRORS: blueprint fails → skips to direct generation gracefully
ERRORS: evaluator fails → no indicators, no error shown
PERFORMANCE: blueprint < 1.5s, card render < 8s, evaluator < 2s, compress < 2s
VISUAL: no layout shift, no font flash, all animations smooth at 60fps
RESPONSIVE: works at 1280px min width
```

---

### DEMO SCRIPT (90 seconds — rehearse this exactly)

```
0:00  'Every AI today gives you a wall of text and says "good luck."'
0:05  'CLAY asks: what if you could negotiate with the AI before it even responds?'
0:10  [Type: 'Why do people struggle with chat interfaces?'] [Hit Cmd+Enter]

      ─── NOVEL MOMENT #1: BLUEPRINT ───
0:12  [Blueprint panel slides in]
      'Claude shows me what it plans to cover. Six topics. I don't need all of them.'
0:18  [Uncheck 2 topics]
      'I deselect two. Claude will only generate what I actually want.'
0:22  [Click "Sculpt Response"] [Blueprint collapses, cards stream in]

      ─── CARDS LAND ───
0:28  [Cards fade in, then evaluator dots appear]
      'Only the topics I selected. Each one an idea I can shape.'

      ─── NOVEL MOMENT #2: EVALUATOR ───
0:32  'And look — Claude's evaluator just flagged this card as weak.'
      [Hover strength dot, show tooltip]
      'It suggests I expand it. Let me try something different.'

      ─── SCULPTING ───
0:38  [Hover card 1, click ↙]
      'This paragraph is too long. Compress.'
0:42  [1-sentence card appears]
      'One sentence. Exactly what I needed.'
0:45  [Double-click card 3]
      'This doesn't land. Rephrase.'

      ─── NOVEL MOMENT #3: COMMAND PALETTE ───
0:50  [Hit Cmd+K, type: 'remove all weak cards']
      'Or I can just command it in plain English.'
0:55  [Weak cards dismiss simultaneously]

      ─── CLOSE ───
0:58  [Click export → Copy to clipboard]
      'Copy my sculpted output.'
1:02  'Blueprint. Sculpt. Evaluate. Command.'
1:06  'Four ways to control AI that don't exist anywhere else.'
1:10  'This is CLAY. Claude's response is your raw material.'
```

**ACCEPTANCE CRITERIA**
- ?demo=1 loads 5 cards + evaluator data instantly with zero network requests
- Full demo script runs in under 90 seconds without any errors
- All three "novel moments" are clearly visible and demonstrable
- Error boundary catches and displays friendly message for all failure modes
- Entire app has been tested end-to-end by all three team members

---

## You are ready to build.

PRD v3.1 is final. All decisions are locked. Six Claude Code prompts are ready to paste.

**What changed from v2:** Three major additions (Blueprint, Evaluator, Command Palette) that transform CLAY from "a better way to read AI output" into "a new way for humans and AI to think together." PDF export and touch gestures removed. Build segments reordered: demo mode moved from last to third (safety net), novelty features front-loaded. CopilotKit elevated from route handler to core architectural component. Redis usage expanded to cover all five Claude interaction points.

Give Segment 1 to Claude Code now. Verify it. Then Segment 2. Do not skip ahead.

**Target:** Setup complete by 10:30 (during keynote). Blueprint + cards on screen by 12:00. Full action pipeline by 14:30. Evaluator + demo mode by 15:30. Command palette + export by 17:00. Polish + rehearsal by 18:00.

**Team CLAY** — Krutin · Raj · Shyam — go build something that changes how people touch AI.
