# CLAY — Product Requirements Document

> **Version:** 1.0  
> **Date:** February 22, 2026  
> **Product:** CLAY — Response-Sculpting Interface Powered by Claude  
> **Context:** Built at AI Tinkerers NYC Interfaces Hackathon, February 2026

---

## 1. Executive Summary

CLAY is a web-based AI interface that transforms how users interact with large language model responses. Instead of the traditional chat paradigm — where a user types a prompt and receives a single, monolithic block of text — CLAY breaks Claude's responses into individual, manipulable **cards** that can be compressed, expanded, rephrased, inspected, or dismissed independently. Before Claude generates anything, users negotiate the shape of the response through a **Blueprint** that proposes topics for coverage. After the response arrives as cards on a canvas, a background **Evaluator** automatically annotates each card with quality scores and overlap warnings. CLAY is built for anyone who uses AI to think — writers, product managers, researchers, strategists — and solves the fundamental problem that chat interfaces treat AI output as a finished product when it should be treated as raw material the user actively sculpts.

---

## 2. Problem Statement

Every AI chat interface makes the same mistake: it gives you a blank text box and asks you to be precise before you've seen anything. Users either over-specify with a paragraph-long prompt or under-specify with two vague words, and either way they receive a wall of text they didn't quite ask for. There are no handles. No affordances. Just a finished-looking response that must be re-prompted from scratch to change.

This creates three concrete human frictions:

1. **The blank box problem.** Users must fully articulate their need before seeing any output — a cognitively expensive task that punishes vague thinking at the exact moment thinking should be exploratory.
2. **The verbosity trap.** AI models optimize for completeness when users want relevance. The only fix is to re-prompt entirely, breaking the user's flow and mental model.
3. **The passive reader problem.** Chat architecture frames every response as final. Users become readers at the moment they should be collaborators. There are no UI controls for saying "this part is great, but that part needs work."

CLAY exists because the interface between human thinking and AI generation deserves the same richness software engineers expect from their code editors — selection, transformation, evaluation, and composition of individual ideas, not just wholesale acceptance or rejection of entire responses.

---

## 3. Target Users & Personas

### Persona 1: The Knowledge Worker

**Who they are:** Product managers, strategy consultants, writers, and researchers who use AI daily to draft, analyze, and ideate. They are comfortable with technology but are not developers.

**What they want to achieve:** Generate high-quality, structured thinking from AI that matches their intent — then refine individual pieces without losing the context of the whole.

**How CLAY serves them:** The Blueprint phase lets them shape the response before generation begins, eliminating the "re-prompt from scratch" loop. Per-card sculpting lets them compress verbose sections, expand thin ones, and dismiss irrelevant tangents without affecting the rest. The Evaluator acts as a built-in editor, surfacing which ideas are strong and which need work.

### Persona 2: The Power User / Prompt Engineer

**Who they are:** Technical users who already know how to write effective prompts but want finer-grained control over AI output. Often developers, AI researchers, or advanced content creators.

**What they want to achieve:** Decompose complex AI responses into modular parts, inspect underlying reasoning, and compose final outputs from the strongest pieces.

**How CLAY serves them:** The Command Palette (`⌘K`) allows natural-language commands like "compress the longest card" or "remove all weak cards" — operating on the canvas at a higher level than button clicks. The Inspect action reveals hidden assumptions. The Evaluator's overlap detection helps them spot redundancy that human reading might miss.

### Persona 3: The Demo Audience / Stakeholder

**Who they are:** Hackathon judges, investors, or team leads who want to understand the product without creating an API key or running a server.

**What they want to achieve:** Experience the full product interaction flow in under two minutes, without any setup.

**How CLAY serves them:** Demo mode (`?demo=1`) loads pre-written cards with varied variants (original, compressed, expanded, rephrased), pre-computed evaluator assessments, and zero API calls. Every feature — card sculpting, evaluator dots, overlap lines, export — is fully functional in demo mode. The Blueprint auto-proceed countdown is disabled in demo mode to avoid confusing non-interactive viewers.

---

## 4. Product Goals & Success Metrics

### Primary Goals

| # | Goal | Description |
|---|------|-------------|
| 1 | **Reduce re-prompting** | Users should never need to retype their entire query to adjust part of a response |
| 2 | **Enable pre-response negotiation** | Users should shape the scope and topics before generation, not after |
| 3 | **Surface AI-driven quality signals** | The interface should automatically show users which ideas are strong, weak, or redundant |
| 4 | **Maintain zero-config usability** | The app should work without Redis, degrade gracefully on API failures, and offer a full demo without keys |

### Inferrable Success Metrics

| Metric | How Measured | Rationale |
|--------|-------------|-----------|
| Blueprint completion rate | Percentage of queries where the user reaches the "Sculpt Response" button | Indicates whether pre-response negotiation adds value or creates friction |
| Card action frequency | Average number of compress/expand/rephrase/inspect/dismiss actions per session | High action frequency means users are actively sculpting, not passively reading |
| Evaluator agreement rate | Percentage of evaluator suggestions the user acts on (e.g., dismissing a "weak" card) | Measures whether the AI quality signals are trusted and actionable |
| Export rate | Percentage of sessions that end with a copy or download | Indicates the user found enough value to take the output somewhere else |
| Error recovery rate | Percentage of rate-limit or API errors that are automatically retried and succeed | Measures resilience of the graceful degradation design |

---

## 5. Full Feature Breakdown

### 5.1 Auth & Onboarding

CLAY has **no authentication system**. There are no user accounts, login screens, or session persistence. The application is a single-page, single-session tool. Every visit starts fresh. This is intentional for the hackathon context — the product prioritizes immediate value delivery over account management.

---

### 5.2 Query Input

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Query Input |
| **What it does** | Provides a multi-line text area where the user types their question or topic |
| **Who it serves** | All users — this is the entry point to every session |
| **Why it matters** | Replaces the single-line chat box with a generous text area that signals "take your time thinking" |
| **How it works** | The `QueryInput` component renders a `<textarea>` with 3 rows. Submission triggers on `Cmd+Enter` (keyboard shortcut) or clicking the "⌘↵ Ask" button. The button is disabled and grayed out when the input is empty or when the system is in a blocking state (blueprinting, streaming, loading) |
| **Input** | Free-text string from the user |
| **Output** | Calls `handleSubmit(query)` on the parent page, which initiates the Blueprint phase |
| **Edge cases** | Empty or whitespace-only input is silently rejected (`value.trim()` check). Input is disabled during blueprint generation, streaming, and loading to prevent duplicate submissions |

---

### 5.3 Blueprint Negotiation

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Blueprint — Pre-Response Negotiation |
| **What it does** | Before generating any response, Claude analyzes the user's query and proposes 4–7 distinct topics. The user curates this outline — toggling topics on/off, editing the interpretation — then confirms to trigger generation |
| **Who it serves** | All users, especially knowledge workers who know what they want but struggle to express it as a perfect prompt |
| **Why it matters** | Eliminates the "blank box problem." The user doesn't need to specify everything; Claude proposes, the user curates |
| **How it works** | `POST /api/blueprint` sends the user's query to `claude-haiku-4-5-20251001` with the `BLUEPRINT_PROMPT`. The API returns a JSON object `{ interpretation: string, topics: string[] }`. The `Blueprint` component renders the interpretation as an editable `contentEditable` div and the topics as a checkbox list. A 45-second auto-proceed countdown bar runs at the bottom. If the user takes no action, the blueprint auto-confirms with all topics selected. Users may toggle any topic's checkbox or edit the interpretation text inline |
| **Input** | User's original query string |
| **Output** | Array of selected topic strings passed to `handleBlueprintConfirm()`, which triggers card generation |
| **Edge cases** | If the Blueprint API call fails (network error, rate limit, malformed JSON), the system silently skips the Blueprint phase and proceeds directly to card generation without topics — the `catch` block in `handleSubmit` calls `generateCards(q)` with no selected topics. If the user deselects all topics, the "Sculpt Response" button is disabled (the `selectedCount === 0` guard). Markdown fences in Claude's JSON response are stripped via regex. The auto-proceed timer resets only when the component becomes visible; changing topic selections does not restart the countdown |

---

### 5.4 Live Streaming Preview

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Streaming Preview |
| **What it does** | Displays Claude's response in real time as tokens arrive, with a blinking cursor at the end |
| **Who it serves** | All users — provides visual feedback during the 2–5 second generation window |
| **Why it matters** | Prevents the anxiety of staring at a blank screen. Users can start reading immediately |
| **How it works** | `POST /api/claude` uses `claude-sonnet-4-6` with the `SYSTEM_PROMPT` and streams via `anthropic.messages.stream()`. The response is encoded as chunked `text/plain` and read on the client via `ReadableStream.getReader()`. Each chunk updates the `streamingText` state, which the `StreamingPreview` component renders in a dashed-border box with a blinking cursor animation |
| **Input** | The user's query plus optional selected topics from the Blueprint phase |
| **Output** | Complete raw text string, which is then passed to `parseIntoCards()` |
| **Edge cases** | If the stream body is null, an error is thrown. If the API returns 429 (rate limit), the system waits 5 seconds and retries once before showing an error. The streaming preview is hidden once parsing begins |

---

### 5.5 Card Parsing — Text-to-Card Conversion

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Card Parser (`lib/parser.ts`) |
| **What it does** | Converts the streamed plain-text response into an array of `Card` objects |
| **Who it serves** | Internal system feature — invisible to the user |
| **Why it matters** | This is the core transformation that turns a monolithic response into sculpt-able pieces |
| **How it works** | The parser uses a 3-level fallback strategy: (1) split on `\n\n` (double newlines), (2) split on `\n` (single newlines) if only 1 paragraph results, (3) chunk every ~100 words if the text is longer than 200 characters but didn't split. Each chunk must be at least 20 characters to be included. If `selectedTopics` are provided and the paragraph count exceeds the topic count, the parser merges the shortest adjacent paragraphs repeatedly until the counts match. Each card gets a unique ID (`card-{timestamp}-{counter}`), the corresponding topic label (or `null`), variant `'original'`, and `loading: false` |
| **Input** | Raw text string + optional `string[]` of selected topics |
| **Output** | `Card[]` array |
| **Edge cases** | The 20-character minimum filter prevents empty or trivial fragments from becoming cards. The merge algorithm is greedy (always merges the pair with the smallest combined length), which could occasionally merge conceptually distinct but short paragraphs. If Claude returns fewer paragraphs than topics, some topic assignments will be `null` (though in practice the SYSTEM_PROMPT constrains Claude to match the topic count) |

---

### 5.6 Canvas Display & Card Stagger Animation

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Canvas |
| **What it does** | Renders the array of cards as a vertical list with staggered entry animations |
| **Who it serves** | All users — this is the primary interaction surface |
| **Why it matters** | The stagger animation (220ms between each card) creates a "dealing" effect that makes the cards feel individually distinct rather than a text dump |
| **How it works** | The `Canvas` component renders each `Card` inside a Framer Motion `AnimatePresence`. Cards enter with `opacity: 0 → 1`, `y: 12 → 0`, `scale: 0.98 → 1` using spring physics (damping 25, stiffness 300). Exiting cards animate with `opacity: 0`, `x: 60`, `scale: 0.95`. Each card's entry delay is `index * 0.22s`. The canvas has `paddingRight: 52px` to accommodate the `ActionSidebar` that appears on hover. An SVG overlay renders dashed lines between cards that the Evaluator identifies as overlapping |
| **Input** | `Card[]` array, `EvaluatorResults`, overlap highlight state, and 5 action handler functions |
| **Output** | Visual rendering of cards with interaction hooks |
| **Edge cases** | Returns `null` if `cards.length === 0`. Overlap line positioning uses a fixed `CARD_HEIGHT = 140px` estimate, which may misalign for cards with very long or very short text. After card dismissal, the `findIndex` check for overlap lines safely returns -1 and the line is not rendered |

---

### 5.7 Per-Card Sculpting Actions

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Card Actions — Compress, Expand, Rephrase, Inspect, Dismiss |
| **What it does** | Five hover-revealed buttons that transform individual cards via targeted Claude prompts |
| **Who it serves** | All users — the core "sculpting" interaction |
| **Why it matters** | This is what makes CLAY different from chat. Users sculpt at the idea level, not the prompt level |

#### 5.7.1 Compress (↙)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Reduces a card to a single punchy sentence |
| **Model** | `claude-haiku-4-5-20251001` (fast) |
| **Prompt** | `COMPRESS_PROMPT`: "Compress the following to a single punchy sentence. No preamble, no explanation — return ONLY the compressed sentence" |
| **Card state change** | `variant: 'compressed'`, text replaced with compressed version |
| **Visual indicator** | Card receives a `↙ compressed` badge (color: `#2D2D2D`) at the top-left |

#### 5.7.2 Expand (↗)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Elaborates a card to 3–5 sentences with a concrete example |
| **Model** | `claude-sonnet-4-6` (quality) |
| **Prompt** | `EXPAND_PROMPT`: "Expand the following into 3-5 sentences with a concrete, specific example" |
| **Card state change** | `variant: 'expanded'`, text replaced with expanded version |
| **Visual indicator** | Card receives a `↗ expanded` badge (color: `#1A4A8A`) at the top-left |

#### 5.7.3 Rephrase (↺)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Rewrites a card from a completely different angle or metaphor while preserving meaning |
| **Model** | `claude-sonnet-4-6` (quality) |
| **Prompt** | `REPHRASE_PROMPT`: "Rephrase the following from a completely different angle or metaphor. Same core meaning, fresh perspective" |
| **Card state change** | `variant: 'rephrased'`, text replaced with rephrased version |
| **Visual indicator** | Card receives a `↺ rephrased` badge (color: `#2D6A2D`) at the top-left |
| **Shortcut** | Double-clicking any card triggers rephrase immediately |

#### 5.7.4 Inspect (⚙)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Surfaces the reasoning and hidden assumptions behind a card's claims |
| **Model** | `claude-haiku-4-5-20251001` (fast) |
| **Prompt** | `INSPECT_PROMPT`: "Explain the reasoning and assumptions behind the following claim in 2-3 sentences" |
| **Card state change** | `inspect` field populated (does NOT change variant), a dashed-border panel appears below the card text showing the reasoning in monospace font colored `#8A6A00` |
| **Toggle behavior** | Clicking Inspect on a card that already has an inspect panel open closes it (`inspect: null`) |

#### 5.7.5 Dismiss (✕)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Removes a card from the canvas with an exit animation |
| **Model** | None — client-side only |
| **Card state change** | Card is removed from the Zustand store. Framer Motion animates the exit (`opacity: 0, x: 60, scale: 0.95`) |
| **Side effect** | After dismissal, the Evaluator automatically re-fires (debounced 800ms) to reassess the remaining cards |

**ActionSidebar technical details:** The sidebar appears to the right of the card (`left: calc(100% + 10px)`) when the card is hovered. Each button starts as a 34×34px circle showing only an icon. On hover, the button spring-animates to 120px wide, the background changes to the action's color, and the label fades in. Buttons are disabled during card loading state.

---

### 5.8 Claude Evaluator — AI-Native UI Intelligence

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Evaluator |
| **What it does** | A separate Claude personality that automatically analyzes all cards on the canvas and returns per-card quality assessments |
| **Who it serves** | All users — acts as a built-in editor that saves users from having to judge quality themselves |
| **Why it matters** | The Evaluator transforms the canvas from a static collection of ideas into an intelligent workspace that proactively surfaces what needs attention |
| **How it works** | The `useEvaluator` hook fires 500ms after the last card renders (or 800ms after any card action, via debounce). It sends all card IDs and text to `POST /api/copilotkit` with `action: 'evaluate'`. The route uses `claude-haiku-4-5-20251001` with the `EVALUATOR_PROMPT`, which asks Claude to assess each card's `strength` (strong/moderate/weak), provide a `suggestion`, and identify any `overlaps_with` (card IDs). The route strips markdown fences and extracts JSON via regex. Results are stored in Zustand and rendered as animated dots on each card |
| **Input** | The original user query + all current cards (`{ id, text }[]`) |
| **Output** | `EvaluatorResults` object containing per-card evaluations, an overall summary, and a recommended next action |
| **Visual rendering** | **Strength dots:** 7px circles in the top-right corner of each card. Green (`#2D6A2D`) for strong, amber (`#8A6A00`) for moderate, red (`#C0392B`) for weak. Each dot has two animations: a pulsing core (`eval-pulse`, 2s) and an expanding ping ring (`eval-ping`, 1.8s). Hovering the dot shows a tooltip with the evaluator's suggestion. **Overlap lines:** Dashed SVG lines connect cards that share thematic overlap, rendered at `x: 98%` of the canvas width. Lines are `1px, opacity 0.6` normally, and `2px, opacity 1` when highlighted via the `highlightOverlaps` CopilotKit command. **Evaluator Bar:** A persistent text summary below the status bar showing the overall assessment and recommended action (styled in italic blue) |
| **Edge cases** | The evaluator skips execution in demo mode. If any card is in a loading state, the evaluator waits. If the card text hash hasn't changed since the last evaluation, the evaluator skips (the `lastHashRef` guard). If JSON parsing of the evaluator response fails, the result is silently set to `null` — no error is shown to the user, and no dots appear. The evaluator uses a `isRunningRef` mutex to prevent concurrent calls |

---

### 5.9 CopilotKit Command Palette

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Command Palette |
| **What it does** | A natural-language command interface for operating on the canvas at a higher level than individual button clicks |
| **Who it serves** | Power users who want to batch-operate on multiple cards or use natural language instead of mouse clicks |
| **Why it matters** | Commands like "remove all weak cards" or "compress the longest card" would require many individual clicks otherwise |
| **How it works** | The `CommandPalette` component renders CopilotKit's `CopilotPopup` with CLAY-specific instructions. `useCopilotReadable` in `hooks/useCopilotActions.ts` continuously exposes the full canvas state (card text, variants, topics, evaluator assessments) to the agent. Six `useCopilotAction` registrations define the available operations: `compressCard`, `expandCard`, `rephraseCard`, `inspectCard`, `dismissCards` (batch), and `highlightOverlaps`. The CopilotKit runtime is backed by `claude-haiku-4-5-20251001` via the `AnthropicAdapter` |
| **Input** | Natural language command from the user (e.g., "remove weak cards") |
| **Output** | The agent resolves the intent against live canvas state and executes the matching action |
| **Activation** | `⌘K` keyboard shortcut (captured in `page.tsx` via `keydown` listener) or clicking the "⌘K" button in the header |
| **Edge cases** | Card text is truncated to 200 characters in the readable state to avoid exceeding context limits. If the CopilotKit setup fails entirely, the app falls back to direct Anthropic SDK calls for card actions |

---

### 5.10 Redis Caching Layer

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Redis Cache |
| **What it does** | Caches all AI responses (blueprint, card actions, evaluator) in Upstash Redis with a 24-hour TTL |
| **Who it serves** | All users — reduces latency and API cost |
| **Why it matters** | Identical compress/expand/rephrase requests return instantly from cache. Evaluator results are cached too, so revisiting the same canvas state doesn't trigger a new Claude call |
| **How it works** | `lib/redis.ts` exports `getCached(key)`, `setCached(key, value)`, and `hashKey(input)`. The hash function is a djb2-style algorithm that produces a base-36 string. Cache keys follow the pattern `clay:{action}:{hash}` (e.g., `clay:compress:abc123`, `clay:eval:xyz789`). Every API route checks the cache before calling Claude. Cache hits return with an `X-Cache: HIT` response header; misses with `X-Cache: MISS` |
| **Input** | Cache key string + value string |
| **Output** | Cached string or `null` |
| **Edge cases** | If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` environment variables are absent, `getRedis()` returns `null` and all cache operations silently no-op. Cache read or write failures are caught and silently ignored. The app is fully functional without Redis — it simply makes more Claude API calls |

---

### 5.11 Export

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Export to Markdown |
| **What it does** | Exports the current canvas to a Markdown file or clipboard |
| **Who it serves** | All users who want to take their sculpted output somewhere else |
| **Why it matters** | The canvas is a sculpting workspace, not a document editor. Export is the bridge to the user's actual workflow |
| **How it works** | The `ExportButton` component renders a dropdown with two options: "Copy to clipboard" (copies numbered card text as plain text) and "Download .md" (generates a full Markdown document with card metadata). The Markdown export includes the CLAY header, query, date, each card with its variant badge, inspect reasoning (if present), and the full evaluator summary at the end. Markdown-special characters are escaped via `escapeMarkdown()` to prevent rendering issues |
| **Input** | Current `cards[]`, `query`, and `evaluatorResults` from the Zustand store |
| **Output** | Clipboard text or downloaded `.md` file named `clay-export-{timestamp}.md` |
| **Edge cases** | The export button is hidden when `cards.length === 0`. The clipboard write uses `navigator.clipboard.writeText()`, which requires secure context (HTTPS or localhost). A "✓ Copied!" confirmation shows for 2 seconds after clipboard copy. The dropdown closes on outside click |

---

### 5.12 Demo Mode

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Demo Mode |
| **What it does** | Loads a pre-built canvas with 5 cards in various variants and pre-computed evaluator results, requiring zero API calls |
| **Who it serves** | Hackathon judges, stakeholders, and anyone who wants to experience CLAY without an API key |
| **Why it matters** | Removes the setup barrier entirely. The full product experience is available in one URL |
| **How it works** | Append `?demo=1` to the URL. The `isDemoParam` flag triggers a `useEffect` that calls `setIsDemo(true)`, loads `DEMO_CARDS` and `DEMO_EVALUATOR` from `lib/demo.ts`, and sets the status to `'ready'`. The demo cards include one `original`, one `compressed`, one `expanded`, and one `rephrased` card, plus evaluator assessments showing strong/moderate/weak ratings and one overlap pair. The Blueprint auto-proceed timer is disabled in demo mode. The evaluator auto-fire is skipped when `isDemo` is true |
| **Input** | `?demo=1` URL parameter |
| **Output** | Pre-loaded canvas with evaluator results, variant badges, overlap lines, and export functionality |
| **Edge cases** | The demo query is hardcoded as "Why do people struggle with chat interfaces, and how can AI be improved?" Card actions (compress, expand, etc.) still work in demo mode if an API key is configured — they hit the live API. The evaluator does NOT re-fire automatically in demo mode |

---

### 5.13 Error Handling & Recovery

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Error Boundary & Status System |
| **What it does** | Provides graceful error recovery at every level of the application |
| **Who it serves** | All users — ensures the app never shows a blank white screen |
| **Why it matters** | LLM APIs are inherently unreliable (rate limits, timeouts, malformed JSON). Resilient error handling is essential for a usable product |
| **How it works** | **Global error boundary:** `app/error.tsx` catches unhandled exceptions and renders a branded "Something went wrong" page with a "Try again" button that calls Next.js's `reset()`. **Status bar:** The `StatusBar` component displays animated status messages for every app state (blueprinting, streaming, evaluating, error). Error messages are prefixed with ⚠ and colored red (`--action-dismiss`). **Rate limit retry:** The `generateCards` function auto-retries once after a 5-second delay when it receives a 429 status code. **Blueprint fallback:** If the Blueprint API fails, the system silently skips to direct generation. **Evaluator fallback:** If the evaluator JSON parse fails, results are set to `null` — no dots appear, no error is shown. **CopilotKit fallback:** If CopilotKit setup fails, card actions fall back to direct Anthropic SDK calls |

---

### 5.14 Gesture Legend

| Attribute | Detail |
|-----------|--------|
| **Feature name** | Gesture Legend |
| **What it does** | A fixed-position footer showing all five card action icons with their labels |
| **Who it serves** | New users who need to discover the available interactions |
| **How it works** | The `GestureLegend` component renders at the bottom of the viewport with `position: fixed` and a gradient fade from transparent to canvas background. It shows 5 items: ↙ compress, ↗ expand, ↺ rephrase, ⚙ inspect, ✕ dismiss — each in their action color. The legend has `pointerEvents: 'none'` so it doesn't interfere with clicking cards below it |
| **Visibility** | Only visible when `cards.length > 0` |

---

## 6. Complete Application Workflow

### Step 1: First Visit — Empty State

**User does:** Opens `http://localhost:3000` (or the deployed URL).

**System does:** Renders the CLAY header ("clay — response sculpting"), an empty `QueryInput` textarea, and the `EmptyState` component showing four example query buttons: "Why do people struggle with chat interfaces?", "What makes a great product demo?", "Why do startups fail?", "How does machine learning work?"

**What happens next:** The user either types a custom query and presses `Cmd+Enter`, or clicks one of the example query buttons.

---

### Step 2: Query Submission → Blueprint Request

**User does:** Submits a query (e.g., "Why do startups fail?").

**System does:**
1. Stores the query in the Zustand store via `setQuery(q)`.
2. Clears any existing cards from the canvas.
3. Sets status to `{ type: 'blueprinting', message: 'Preparing blueprint…' }` — the `StatusBar` shows a blinking dot and "Preparing blueprint…".
4. Sends `POST /api/blueprint` with `{ query: "Why do startups fail?" }`.

**API does:**
1. Computes cache key `clay:blueprint:{hash("Why do startups fail?")}`.
2. Checks Redis. If cache hit, returns the cached JSON immediately with `X-Cache: HIT`.
3. If cache miss, calls `claude-haiku-4-5-20251001` with `BLUEPRINT_PROMPT`.
4. Strips any markdown fences from the response.
5. Parses JSON, validates `{ interpretation, topics[] }` shape.
6. Caches the result with 24-hour TTL.
7. Returns the JSON with `X-Cache: MISS`.

**What happens next:** The Blueprint panel slides in.

---

### Step 3: Blueprint Negotiation

**User does:** Reviews Claude's interpretation and topic list. May:
- Edit the interpretation (click to toggle `contentEditable`, type changes, blur to save).
- Toggle individual topic checkboxes (deselect irrelevant topics).
- Click "Sculpt Response (N topics)" to proceed.
- Or wait — the 45-second auto-proceed countdown will trigger automatically.

**System does:** The `Blueprint` component displays with a spring animation (`height: 0 → auto`, `opacity: 0 → 1`). A 2px progress bar at the bottom depletes over 45 seconds. The selected topic count updates in real time in both the label ("N of M selected") and the button text.

**What happens next:** When confirmed (manually or via auto-proceed), the selected topic strings are passed to `handleBlueprintConfirm()`, which calls `generateCards()`.

---

### Step 4: Streaming Response Generation

**User does:** Watches Claude stream its response in real time.

**System does:**
1. Sets status to `{ type: 'streaming', message: 'Sculpting response…' }`.
2. Sends `POST /api/claude` with the user's query and selected topics.
3. The API calls `claude-sonnet-4-6` with `SYSTEM_PROMPT(selectedTopics)`, which constrains Claude to produce exactly N paragraphs, one per topic, separated by blank lines.
4. The response streams via `ReadableStream`. Each chunk updates `streamingText`.
5. The `StreamingPreview` component renders the accumulating text in a dashed-border box with a blinking cursor.

**What happens next:** When the stream finishes, parsing begins.

---

### Step 5: Card Parsing & Stagger Entry

**User does:** Observes cards appearing one by one.

**System does:**
1. Hides the streaming preview.
2. Calls `parseIntoCards(fullText, selectedTopics)` to split the text into individual cards.
3. Clears any previous cards from the store.
4. Adds cards one at a time with a 220ms delay between each, creating a stagger effect.
5. Each card animates in with spring physics.
6. Sets status to `{ type: 'ready' }` — the `StatusBar` shows "N cards ready — hover to sculpt · double-click to rephrase · ⌘K to command".

**What happens next:** The Evaluator auto-fires.

---

### Step 6: Automatic Evaluation

**User does:** Nothing — this happens automatically.

**System does:**
1. The `useEvaluator` hook detects that cards have changed (via hash comparison).
2. Waits 500ms (initial delay) after the last card renders.
3. If no cards are loading, sends `POST /api/copilotkit` with `action: 'evaluate'` and all card data.
4. Sets status to `{ type: 'evaluating', message: 'Evaluator analysing…' }`.
5. Claude Haiku analyzes all cards and returns `{ cards: [...], overall, recommended_action }`.
6. Strength dots appear on each card (animated). Overlap lines render as dashed SVG.
7. The `EvaluatorBar` fades in showing the overall summary and recommended action.

**What happens next:** The user begins sculpting.

---

### Step 7: Sculpting Loop

**User does:** Hovers over a card to reveal the `ActionSidebar` (5 buttons), then:
- Clicks **↙ Compress** to shorten the card.
- Clicks **↗ Expand** to elaborate the card.
- Clicks **↺ Rephrase** (or double-clicks the card) to get a fresh angle.
- Clicks **⚙ Inspect** to see hidden assumptions.
- Clicks **✕ Dismiss** to remove the card.

**System does:**
1. Sets the card's `loading: true` — a shimmer overlay appears.
2. Sets status to `card-loading` with the action name.
3. Sends `POST /api/copilotkit` with `{ action, content: card.text }`.
4. The API checks Redis cache → if miss, calls Claude with the appropriate prompt and model → caches the result.
5. Updates the card's text, variant, and `loading: false`. Spring animation signals the change.
6. After 800ms debounce, the Evaluator automatically re-fires to reassess the modified canvas.

**This loop repeats** — the user sculpts individual ideas until satisfied with the overall canvas.

---

### Step 8: Command Palette (Optional)

**User does:** Presses `⌘K` to open the CopilotKit popup and types a natural language command like "remove all weak cards".

**System does:**
1. CopilotKit's agent reads the current canvas state (card text, evaluator assessments, topics).
2. The agent resolves "weak cards" to the card IDs where `evaluatorResults.cards[i].strength === 'weak'`.
3. The agent calls the `dismissCards` action with those IDs.
4. Cards animate out of the canvas.
5. The Evaluator re-fires on the remaining cards.

---

### Step 9: Export (Completion State)

**User does:** Clicks the "↓ export" button in the header.

**System does:** A dropdown appears with two options:
1. **Copy to clipboard:** Copies all card text as a numbered plain-text list.
2. **Download .md:** Generates a full Markdown document with CLAY header, query, date, card text with variant badges, inspect reasoning, and evaluator summary. Downloads as `clay-export-{timestamp}.md`.

**What happens next:** The session is effectively complete. The user can continue sculpting or start a new query.

---

## 7. Architecture & Technical Overview

### 7.1 Frontend Framework

| Aspect | Detail |
|--------|--------|
| **Framework** | Next.js 15 with the App Router |
| **Rendering** | Client-side rendering (`'use client'` on all interactive components). The root layout is a server component that wraps children in `<CopilotKit>` |
| **Language** | TypeScript 5 in strict mode |
| **UI Library** | React 19 |
| **Animation** | Framer Motion 11 — used for spring-based card entry/exit animations, the Blueprint slide-in, StatusBar transitions, and ActionSidebar expand effects |

**Why Next.js 15 specifically:** CopilotKit's runtime adapter requires Next.js App Router API routes. The project doesn't use SSR, SSG, or ISR — the App Router is used purely for its API route infrastructure and CopilotKit integration.

### 7.2 File Structure

```
Clay/
├── app/
│   ├── api/
│   │   ├── blueprint/route.ts    # POST — Haiku topic extraction
│   │   ├── claude/route.ts       # POST — Sonnet streaming generation
│   │   └── copilotkit/route.ts   # POST — Card actions + evaluator + CopilotKit runtime
│   ├── error.tsx                  # Global error boundary
│   ├── globals.css                # Design system tokens, keyframes, CopilotKit overrides
│   ├── layout.tsx                 # Root layout with CopilotKit provider
│   └── page.tsx                   # Main page orchestration (449 lines)
├── components/
│   ├── ActionSidebar.tsx          # 5 hover-revealed action buttons
│   ├── Blueprint.tsx              # Pre-response topic negotiation panel
│   ├── Canvas.tsx                 # Card grid + SVG overlap lines
│   ├── Card.tsx                   # Individual card with variant badges + eval dots
│   ├── CommandPalette.tsx         # CopilotKit popup wrapper
│   ├── EmptyState.tsx             # Example query buttons
│   ├── EvaluatorBar.tsx           # Overall evaluation summary bar
│   ├── ExportButton.tsx           # Markdown export + clipboard copy
│   ├── GestureLegend.tsx          # Fixed footer action reference
│   ├── QueryInput.tsx             # Multi-line input with ⌘↵ submit
│   ├── StatusBar.tsx              # Animated status messages
│   └── StreamingPreview.tsx       # Real-time token display with blinking cursor
├── hooks/
│   ├── useClayStore.ts            # Zustand state management (cards, evaluator, status)
│   ├── useCopilotActions.ts       # CopilotKit action + readable registrations
│   └── useEvaluator.ts            # Auto-fire evaluator with debounce + hash dedup
├── lib/
│   ├── claude.ts                  # Client-side fetch wrappers (streamClaude, fetchBlueprint)
│   ├── demo.ts                    # Pre-built demo cards + evaluator results
│   ├── parser.ts                  # 3-level text-to-Card[] parser
│   ├── prompts.ts                 # All 7 system prompts (single source of truth)
│   └── redis.ts                   # Upstash Redis client with graceful degradation
├── types/
│   └── index.ts                   # Card, BlueprintData, EvaluatorResults, AppStatus types
└── prompts/                       # Build sequence documentation (prompt-1 through prompt-5)
```

### 7.3 State Management

**Engine:** Zustand 4 (a lightweight, no-boilerplate state store for React).

**Why Zustand:** The app has a single global state (cards array, evaluator results, status, query) that needs to be accessible across deeply nested components (Card, Canvas, CopilotKit actions, Evaluator hook). Zustand provides this without the verbosity of Redux or the complexity of Context.

**Store shape (`useClayStore`):**

| State | Type | Purpose |
|-------|------|---------|
| `cards` | `Card[]` | All cards on the canvas |
| `query` | `string` | The user's active query |
| `blueprintData` | `BlueprintData \| null` | Current blueprint interpretation + topics |
| `evaluatorResults` | `EvaluatorResults \| null` | Per-card evaluations + overall summary |
| `status` | `AppStatus` | Current app state (idle, blueprinting, streaming, ready, error, etc.) |
| `isDemo` | `boolean` | Whether demo mode is active |
| `overlapHighlighted` | `boolean` | Whether overlap SVG lines are in "highlighted" mode |

**Mutations:** `addCard`, `clearCards`, `updateCard`, `removeCard`, `setBlueprintData`, `setEvaluatorResults`, `setStatus`, `setQuery`, `setIsDemo`, `setOverlapHighlighted`.

### 7.4 Backend / API Layer

All backend logic is in Next.js API routes — there is no separate backend server.

| Route | Method | Model | Cache Key Pattern | Purpose |
|-------|--------|-------|-------------------|---------|
| `/api/blueprint` | POST | `claude-haiku-4-5-20251001` | `clay:blueprint:{hash}` | Extract topic outline from query |
| `/api/claude` | POST | `claude-sonnet-4-6` | (not cached) | Stream card content |
| `/api/copilotkit` | POST | Varies | `clay:{action}:{hash}` | Card actions, evaluator, CopilotKit runtime |

**The `/api/copilotkit` dual-mode design:** This route handles three distinct request types through a branching `if` chain:
1. **Direct card actions:** If `body.action` is `compress/expand/rephrase/inspect` and `body.content` exists → routes to `handleCardAction()` with the correct model and prompt.
2. **Evaluator requests:** If `body.action === 'evaluate'` and `body.query` and `body.cards` exist → routes to the evaluator flow.
3. **CopilotKit protocol:** All other requests fall through to the CopilotKit runtime handler (`copilotRuntimeNextJSAppRouterEndpoint`).

This design avoided creating 6+ separate API routes while still keeping card actions fast (direct Anthropic calls instead of CopilotKit's agent overhead).

### 7.5 AI Models Used

| Model | Used For | Reason |
|-------|----------|--------|
| `claude-haiku-4-5-20251001` | Blueprint, Compress, Inspect, Evaluator, CopilotKit command palette | Fast (~200ms), cheap — ideal for quick transformations and analysis tasks |
| `claude-sonnet-4-6` | Card generation (streaming), Expand, Rephrase | Higher quality — needed for depth, examples, and creative rephrasing |

### 7.6 Authentication

There is no user authentication. The Anthropic API key is stored as a server-side environment variable (`ANTHROPIC_API_KEY`) and is never exposed to the client. The Anthropic SDK on the server reads the key from `process.env.ANTHROPIC_API_KEY` automatically (the `new Anthropic()` constructor checks this by default).

### 7.7 Database & Data Model

CLAY has **no database**. There is no persistent storage of user sessions, queries, or canvas states. All state lives in the client-side Zustand store and is lost on page refresh. Redis is used purely as a cache for API responses, not as a persistent data store.

**Data types:**

| Type | Fields | Purpose |
|------|--------|---------|
| `Card` | `id`, `text`, `topic`, `variant`, `loading`, `inspect` | A single idea on the canvas |
| `CardVariant` | `'original' \| 'compressed' \| 'expanded' \| 'rephrased'` | The card's transformation state |
| `BlueprintTopic` | `text`, `selected` | A topic in the Blueprint negotiation panel |
| `BlueprintData` | `interpretation`, `topics[]` | Claude's pre-response analysis |
| `EvalStrength` | `'strong' \| 'moderate' \| 'weak'` | Per-card quality rating |
| `CardEvaluation` | `id`, `strength`, `suggestion`, `overlaps_with` | Single card evaluation |
| `EvaluatorResults` | `cards[]`, `overall`, `recommended_action` | Full evaluation output |
| `AppStatus` | `type`, `message?` | 8-state status machine |

### 7.8 File Storage / Media Handling

CLAY has **no file storage or media handling**. There are no uploads, images, or binary assets processed by the application. The export feature generates files on-the-fly in the browser via `Blob` and `URL.createObjectURL()`.

### 7.9 Third-Party Services

| Service | Package | Purpose | Required? |
|---------|---------|---------|-----------|
| **Anthropic Claude API** | `@anthropic-ai/sdk ^0.57.0` | All AI generation — blueprints, card content, actions, evaluation | ✅ Yes (unless demo mode) |
| **CopilotKit** | `@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime` (all `^1.51.4`) | Command palette, agentic action registration, readable state exposure | ✅ Yes (for command palette) |
| **Upstash Redis** | `@upstash/redis ^1.36.2` | Response caching with 24h TTL | ❌ Optional (degrades gracefully) |
| **Google Fonts** | CSS @import | Playfair Display, Lora, DM Mono | ✅ Yes (loaded via CSS) |
| **Framer Motion** | `framer-motion ^11.0.0` | Spring-based card animations | ✅ Yes |

### 7.10 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes (unless demo-only) | Authenticates all Claude API calls. Used server-side only. The Anthropic SDK reads it automatically from `process.env` |
| `UPSTASH_REDIS_REST_URL` | No | The REST endpoint for the Upstash Redis instance. If absent, all cache operations silently no-op |
| `UPSTASH_REDIS_REST_TOKEN` | No | Authentication token for Upstash Redis. Must be set together with `UPSTASH_REDIS_REST_URL` |

### 7.11 Design System

CLAY uses a **no-Tailwind, CSS custom properties** design system defined in `app/globals.css`. The aesthetic is deliberately analog — warm parchment backgrounds, paper-like card surfaces, and serif typography that evokes physical note cards.

**Color palette:**

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-canvas` | `#F5F0E8` | Warm parchment page background |
| `--bg-card` | `#FFFFFF` | Card surface |
| `--bg-card-hover` | `#FAFAF8` | Card hover state |
| `--border-card` | `#E8E4DE` | Card borders |
| `--text-body` | `#2A2520` | Primary text |
| `--text-muted` | `#A09280` | Secondary text, labels |
| `--text-meta` | `#C0B8AA` | Topic labels, footnotes |
| `--action-compress` | `#2D2D2D` | Compress action (dark) |
| `--action-expand` | `#1A4A8A` | Expand action (blue) |
| `--action-rephrase` | `#2D6A2D` | Rephrase action (green) |
| `--action-inspect` | `#8A6A00` | Inspect action (amber) |
| `--action-dismiss` | `#C0392B` | Dismiss action (red) |

**Typography:**

| Font | Usage | Size |
|------|-------|------|
| Playfair Display (800w) | "clay" wordmark only | 28px |
| Lora (400w, 500w) | Card body text, interpretation | 15.5px |
| DM Mono (400w, 500w) | UI chrome — labels, badges, buttons, status | 10–13px |

**Animations (CSS keyframes):**

| Keyframe | Duration | Purpose |
|----------|----------|---------|
| `shimmer` | 1.2s linear infinite | Loading overlay on cards during action processing |
| `fadeIn` | — | Generic fade-up entrance |
| `blink` | 1s infinite | Streaming cursor + status indicator |
| `eval-pulse` | 2s ease-in-out infinite | Evaluator strength dot breathing |
| `eval-ping` | 1.8s ease-out infinite | Evaluator dot expanding ring |

---

## 8. Data Flow Diagrams

### 8.1 Blueprint Flow

```
User types query → [Cmd+Enter or click "Ask"]
  → POST /api/blueprint { query }
    → Check Redis cache (clay:blueprint:{hash})
      → Cache HIT → return cached { interpretation, topics[] }
      → Cache MISS → claude-haiku-4-5-20251001 + BLUEPRINT_PROMPT
        → Strip markdown fences → Parse JSON → Validate shape
        → Cache result (24h TTL) → return { interpretation, topics[] }
  → Blueprint panel slides in (spring animation)
  → User curates topics (toggle checkboxes, edit interpretation)
  → User clicks "Sculpt Response" (or 45s auto-proceed triggers)
  → Selected topic strings passed to generateCards()
```

### 8.2 Card Generation Flow

```
generateCards(query, selectedTopics)
  → POST /api/claude { messages: [{ role: 'user', content: query }], selectedTopics }
    → claude-sonnet-4-6 + SYSTEM_PROMPT(selectedTopics)
    → Stream via ReadableStream (chunked text/plain)
  → Client reads stream chunks → updates streamingText → StreamingPreview renders
  → Stream complete → parseIntoCards(fullText, selectedTopics)
    → Split on \n\n (fallback: \n, fallback: 100-word chunks)
    → Reconcile paragraph count to match topic count (merge smallest adjacent)
    → Return Card[] with unique IDs, topics, variant='original'
  → Clear existing cards → Stagger-add cards (220ms delay each)
  → Status → 'ready'
```

### 8.3 Card Action Flow (e.g., Compress)

```
User hovers card → ActionSidebar appears → clicks ↙ Compress
  → card.loading = true (shimmer overlay)
  → POST /api/copilotkit { action: 'compress', content: card.text }
    → Check Redis cache (clay:compress:{hash(text)})
      → Cache HIT → return { result: cachedText, cached: true }
      → Cache MISS → claude-haiku-4-5-20251001 + COMPRESS_PROMPT
        → Cache result → return { result: compressedText, cached: false }
  → Update card: { text: result, variant: 'compressed', loading: false }
  → Card spring-animates to show change
  → After 800ms debounce → Evaluator re-fires (8.4)
```

### 8.4 Evaluator Flow

```
useEvaluator hook detects cards changed (hash mismatch)
  → Wait 500ms (initial) or 800ms (debounce after action)
  → Skip if: demo mode | any card loading | hash unchanged | already running
  → POST /api/copilotkit { action: 'evaluate', query, cards: [{ id, text }] }
    → Check Redis cache (clay:eval:{hash(allCardText)})
      → Cache HIT → return cached evaluation JSON
      → Cache MISS → claude-haiku-4-5-20251001 + EVALUATOR_PROMPT
        → Strip markdown fences → Extract JSON via regex
        → Validate { cards: [...] } shape
        → Cache result → return EvaluatorResults
  → Store results in Zustand
  → Strength dots render on each card (animated)
  → SVG overlap lines render between overlapping cards
  → EvaluatorBar shows overall summary + recommended action
```

### 8.5 CopilotKit Command Flow

```
User presses ⌘K → CopilotPopup opens
  → User types "remove all weak cards"
  → CopilotKit agent reads canvas state via useCopilotReadable
    → { cards: [...], evaluatorResults: { cards: [{ id, strength, ... }], ... } }
  → Agent resolves intent → identifies cards where strength === 'weak'
  → Agent calls dismissCards(cardIds: ['card-xyz', ...])
    → Each card removed from Zustand store
    → Cards animate out (opacity 0, x: 60, scale 0.95)
  → Evaluator re-fires on remaining cards
```

### 8.6 Export Flow

```
User clicks "↓ export" button in header
  → Dropdown appears: [Copy to clipboard] [Download .md]

[Copy to clipboard]:
  → Generate numbered text: "1. card1text\n\n2. card2text..."
  → navigator.clipboard.writeText(text)
  → "✓ Copied!" confirmation (2s)

[Download .md]:
  → Generate Markdown with header, query, date, card metadata, evaluator summary
  → Escape markdown-special characters
  → Create Blob → URL.createObjectURL → trigger <a> download
  → File saved as clay-export-{timestamp}.md
```

---

## 9. Permissions & Access Control

### 9.1 User Roles

CLAY has **no user roles, authentication, or authorization**. There is a single user type: anyone with access to the URL.

### 9.2 API Security

| Layer | Protection |
|-------|-----------|
| **API key** | The Anthropic API key is stored as a server-side environment variable and never exposed to the client. All Claude calls happen in API routes (`/api/*`), not in browser JavaScript |
| **Input validation** | The `/api/blueprint` route validates that `query` exists and is a string. The `/api/copilotkit` route validates `action` against an allowlist (`['compress', 'expand', 'rephrase', 'inspect']`) |
| **Rate limiting** | API routes detect Anthropic's `rate_limit` error in the error message and return `429` with a `Retry-After: 5` header. The client auto-retries `generateCards` once after 5 seconds |
| **CORS** | Not explicitly configured — Next.js API routes default to same-origin only |
| **Redis access** | Upstash Redis is accessed via REST API with a bearer token stored in environment variables |

### 9.3 Route Protection

There are no protected routes. All routes (`/`, `/api/blueprint`, `/api/claude`, `/api/copilotkit`) are publicly accessible. There is no middleware, no auth guards, and no session management.

### 9.4 Data Privacy

All user data (queries, card text) lives only in the client-side Zustand store and is lost on page refresh. Redis caches contain AI-generated responses only, keyed by content hash — there is no user-identifying information stored anywhere.

---

## 10. Known Gaps, Assumptions & Open Questions

### Known Gaps

| # | Gap | Evidence | Impact |
|---|-----|----------|--------|
| 1 | **No session persistence** | No database, no localStorage, no cookies | Refreshing the page destroys all work. Users cannot revisit previous canvases |
| 2 | **No user accounts or history** | No auth system, no session management | Users cannot access past queries or share canvases across devices |
| 3 | **Overlap line positioning is approximate** | `CARD_HEIGHT = 140` is hardcoded in `Canvas.tsx` | SVG lines between overlapping cards may misalign for cards with significantly more or less text |
| 4 | **No drag-to-reorder** | Mentioned in README roadmap but not implemented | Cards are fixed in their generated order; spatial arrangement is not possible |
| 5 | **No collaborative features** | Mentioned in README roadmap (WebSocket sync) but not implemented | CLAY is single-user, single-session only |
| 6 | **No voice input** | Mentioned in README roadmap (Whisper transcription) but not implemented | Blueprint input is text-only |
| 7 | **The `fetchBlueprint` client wrapper in `lib/claude.ts` is unused** | `page.tsx` calls `fetchBlueprint` from `lib/claude.ts`, but the function signature returns `topics: string[]` while `BlueprintTopic` expects `{ text, selected }[]`. The `page.tsx` handles the mapping inline | Minor — the function works, but the type mismatch means the mapping must happen at the call site |
| 8 | **No mobile optimization** | No responsive breakpoints, fixed 880px max-width, hover-dependent interactions (ActionSidebar) | The app is desktop-only. Touch devices cannot access card actions since there is no hover on mobile |
| 9 | **The streaming response from `/api/claude` is not cached** | Only blueprint, card actions, and evaluator responses are cached | Identical queries will re-stream from Claude every time |

### Assumptions Made During Analysis

| # | Assumption | Reasoning |
|---|-----------|-----------|
| 1 | The product is a hackathon project, not a production application | The README states "Built at AI Tinkerers NYC Interfaces Hackathon · February 2026" and there is no CI/CD, testing, or deployment configuration |
| 2 | The `.env.local` file in the repository is for development purposes only | API keys in version-controlled `.env.local` files are a security concern in production but common in hackathon contexts |
| 3 | The `prompts/` directory contains build documentation, not runtime prompts | These files document the step-by-step build sequence used during the hackathon, not prompts the app executes |
| 4 | CopilotKit's CSS overrides in `globals.css` indicate that the default CopilotKit theme clashed with CLAY's design system | The extensive `.clay-copilot-popup` CSS rules override fonts, colors, and backgrounds to match the parchment aesthetic |

### Open Questions

1. **Should the streaming response be cached?** The `/api/claude` route does not check Redis, which means the same query re-generates every time. Is this intentional (freshness) or an oversight?
2. **What happens when the Evaluator returns card IDs that don't match any current canvas card?** The `useEvaluator` hook trusts the evaluator to echo back correct IDs. If Claude hallucinates or reuses demo IDs, dots may not render on the correct cards.
3. **Is the 45-second auto-proceed timer the right duration?** It's long enough for reading but may frustrate users who want more time to edit topics.
4. **Should dismissed cards be recoverable?** Currently there is no undo for dismiss. An undo stack or card history would improve forgiveness.
5. **How should the product handle simultaneous card actions?** The current implementation does not prevent the user from compressing one card while another is still loading. Each card's `loading` state is independent, but the evaluator debounce could race-condition with multiple concurrent updates.

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **Blueprint** | The pre-response negotiation phase where Claude proposes topics and the user curates which ones to generate |
| **Canvas** | The main workspace area where cards are displayed and manipulated |
| **Card** | A single idea or paragraph from Claude's response, displayed as an individual UI element that can be transformed independently |
| **Card Action** | One of five operations (compress, expand, rephrase, inspect, dismiss) that transforms or removes an individual card |
| **Card Variant** | The current transformation state of a card: `original`, `compressed`, `expanded`, or `rephrased` |
| **CopilotKit** | An open-source framework for building AI copilot experiences in React apps, used in CLAY for the command palette and agentic action system |
| **Command Palette** | The `⌘K`-activated natural language interface powered by CopilotKit that allows batch operations on the canvas |
| **Demo Mode** | A zero-API-call mode activated by `?demo=1` that loads pre-built cards and evaluator results for demonstration purposes |
| **djb2 Hash** | A fast string hashing algorithm used in `lib/redis.ts` to generate cache keys from card content |
| **Evaluator** | A separate Claude Haiku personality that automatically analyzes all cards and provides strength ratings, suggestions, and overlap warnings |
| **EvalStrength** | The evaluator's quality rating for a card: `strong`, `moderate`, or `weak` |
| **Framer Motion** | A React animation library used for spring-based card animations, panel transitions, and micro-interactions |
| **Graceful Degradation** | The design principle that every optional feature (Redis, CopilotKit, Evaluator, Blueprint) fails silently rather than breaking the app |
| **Haiku** | `claude-haiku-4-5-20251001` — Anthropic's fast, cost-efficient model used for quick tasks (compress, inspect, evaluate, blueprint) |
| **Inspect** | A card action that reveals the hidden assumptions and reasoning behind a card's claims, rendered in a dashed-border panel below the card text |
| **Overlap** | When two cards share enough thematic similarity that the Evaluator flags them as redundant, visualized as dashed SVG lines connecting the cards |
| **Parser** | `lib/parser.ts` — the module that converts Claude's streamed text into individual `Card` objects using a 3-level splitting algorithm |
| **Sculpt** | The core interaction paradigm of CLAY: transforming individual cards via compress, expand, rephrase, inspect, or dismiss |
| **Shimmer** | A loading animation overlay (linear gradient sliding left-to-right) that appears on cards during action processing |
| **Sonnet** | `claude-sonnet-4-6` — Anthropic's higher-quality model used for tasks requiring depth (card generation, expand, rephrase) |
| **Stagger** | The 220ms-delayed sequential appearance of cards on the canvas, creating a "dealing" effect |
| **TTL** | Time-To-Live — the 24-hour (86400 second) expiration on all Redis cache entries |
| **Upstash Redis** | A serverless Redis service used for caching AI responses via REST API |
| **Zustand** | A lightweight React state management library used as CLAY's central store for cards, evaluator results, and application status |

---

*This document was generated by analyzing every source file in the CLAY codebase — all 3 API routes, 12 components, 3 hooks, 5 library modules, 1 type definition file, 1 CSS design system, and all supporting documentation (CLAUDE.md, README.md, package.json). No code was left unread.*
