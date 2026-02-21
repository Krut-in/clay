# CLAY — Response-Sculpting Interface Powered by Claude

> *Shape raw ideas into exactly what you need.*

**Built at AI Tinkerers NYC Interfaces Hackathon · February 2026**

---

## The Problem with Chat

Every AI chat interface makes the same mistake: it gives you a blank box and asks you to be precise before you've seen anything. You either over-specify with a paragraph-long prompt, or under-specify with two vague words — and either way, you get a wall of text you didn't quite ask for. There are no handles. No affordances. Just a finished-looking response that you have to re-prompt from scratch to change. The interface treats you as a passive reader at the exact moment you should be an active collaborator.

---

## What CLAY Does

**CLAY reimagines the AI response as raw material, not a finished product.** Instead of a single monolithic reply, Claude's output arrives as a set of sculpt-able cards — discrete ideas you can compress, expand, rephrase, or discard individually. Before Claude even writes a word, you negotiate the shape of the response. After it arrives, a second Claude personality silently evaluates the cards and surfaces quality indicators directly in the UI.

Three interaction paradigms power the experience:

- **Blueprint** — Pre-response negotiation. Claude proposes a topic outline; you select, deselect, or reorder before generation begins.
- **Sculpt** — Post-response card manipulation. Each card carries five hover-revealed actions powered by targeted Claude prompts.
- **Evaluate** — AI-driven interface intelligence. A background evaluator annotates every card with strength scores and overlap warnings.

---

## Key Features

**Blueprint Negotiation**
Before a single token is generated, Claude analyzes your query and proposes 4–7 distinct topic cards. You curate the outline — removing irrelevant angles, reordering priorities — then trigger generation. This pre-response contract means the response fits your intent, not Claude's best guess at it.

**Live Streaming Preview**
Claude streams its response in real time into a preview area, then the `parser.ts` module splits the completed stream into cards using a three-level fallback algorithm: double-newline splitting → single-newline → word-count chunking. When selected topics are provided, the parser reconciles paragraph count by merging the smallest adjacent chunks until card count matches topic count exactly.

**Per-Card Sculpting Actions**
Hovering any card reveals an animated `ActionSidebar` with five actions, each routed to a purpose-optimized Claude model:
- **↙ Compress** → `claude-haiku` for fast, punchy summarization
- **↗ Expand** → `claude-sonnet` for depth and concrete examples
- **↺ Rephrase** → `claude-sonnet` for a fresh metaphor or angle
- **⚙ Inspect** → `claude-haiku` to surface the card's hidden assumptions
- **✕ Dismiss** → removes the card with an exit animation

Double-clicking any card triggers rephrase instantly.

**Claude Evaluator — AI-Native UI Intelligence**
After cards land on the canvas, `useEvaluator` debounces a background call to a separate Claude Evaluator personality. It returns per-card strength scores (`strong` / `moderate` / `weak`), actionable suggestions, and overlap warnings — all rendered as animated indicator dots directly on each card. Evaluator results are also surfaced in a persistent `EvaluatorBar` with a recommended next action.

**CopilotKit Command Palette**
Press `⌘K` to open a natural-language command interface backed by CopilotKit. Type *"remove all weak cards"* or *"compress the longest card"* and the agent resolves the intent against live canvas state — including evaluator assessments — and executes the action. The canvas state is continuously exposed to the agent via `useCopilotReadable`.

**Redis Caching Layer**
Every card action and evaluator call checks Upstash Redis before hitting the Claude API. Cache keys are built from a lightweight djb2-style hash of the input content. The Redis client degrades gracefully to no-ops when environment variables are absent, so the app runs in zero-config environments without errors.

**Export**
Completed canvases export to Markdown with full card metadata: variant badges, inspect reasoning, and the evaluator summary. One-click copy-to-clipboard is also supported.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 / React 19 |
| AI | Anthropic Claude SDK (`claude-sonnet-4-6`, `claude-haiku-4-5`) |
| Agentic UI | CopilotKit (React Core + Runtime) |
| State | Zustand 4 |
| Animation | Framer Motion 11 |
| Cache | Upstash Redis |
| Styling | CSS custom properties (no Tailwind) |

---

## Project Setup

**Prerequisites:** Node.js 18+, an Anthropic API key, and (optionally) an Upstash Redis instance.

**1. Clone and install**
```bash
git clone https://github.com/Krut-in/clay.git
cd clay
npm install
```

**2. Configure environment**
```bash
# Create .env.local at the project root
ANTHROPIC_API_KEY=your_key_here
UPSTASH_REDIS_REST_URL=        # optional — app works without it
UPSTASH_REDIS_REST_TOKEN=      # optional — app works without it
```

**3. Run the development server**
```bash
npm run dev
# Open http://localhost:3000
```

**4. Try demo mode** (no API key needed)
```
http://localhost:3000?demo=1
```

**5. Build for production**
```bash
npm run build && npm start
```

---

## Roadmap

- **Drag-to-reorder canvas** — spatial card arrangement with persistent layout saved to Redis
- **Multi-session history** — blueprint + canvas snapshots browsable in a side panel
- **Collaborative sculpting** — shared canvas URLs with real-time card state sync via WebSockets
- **Voice-to-blueprint** — whisper transcription feeding directly into the Blueprint negotiation flow
- **Custom evaluator personas** — configurable Evaluator personalities (e.g. *Devil's Advocate*, *Plain Language Editor*) switchable per session