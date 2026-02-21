# PROMPT 2 OF 5 — Blueprint System, Card Canvas & Streaming Pipeline

## CONTEXT

You are continuing to build CLAY. Prompt 1 is complete: the project compiles, types are defined, Zustand store exists, all prompts are in `lib/prompts.ts`, API routes for `/api/blueprint` and `/api/claude` are functional, and the CSS design system is loaded.

This prompt builds the complete user-facing pipeline: user types a query → Blueprint panel appears with Claude's interpretation + topic outline → user curates topics → clicks "Sculpt Response" → Claude streams a response → parser splits it into cards → cards fade onto the canvas with staggered animation.

## PREREQUISITE VERIFICATION

Before starting, confirm ALL of these from Prompt 1:
- `npm run dev` runs without errors
- `types/index.ts` exports Card, BlueprintData, EvaluatorResults, AppStatus
- `hooks/useClayStore.ts` exports useClayStore with addCard, clearCards, updateCard, removeCard, setBlueprintData, setStatus, setQuery
- `lib/prompts.ts` exports BLUEPRINT_PROMPT, SYSTEM_PROMPT
- `lib/claude.ts` exports streamClaude, fetchBlueprint
- `lib/parser.ts` exports parseIntoCards
- `app/api/blueprint/route.ts` and `app/api/claude/route.ts` exist and handle POST
- `app/globals.css` has all CSS tokens

If any are missing, create them now before proceeding.

## DELIVERABLE 1 — `components/QueryInput.tsx`

A clean textarea input with submit functionality.

```typescript
'use client';

import { useState, useRef, useCallback } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

export function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }, [value, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: 'relative',
      marginBottom: 24,
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything — Cmd+Enter to submit"
        disabled={disabled}
        rows={3}
        style={{
          width: '100%',
          padding: '16px 20px',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-body)',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-card)',
          borderRadius: 12,
          resize: 'none',
          outline: 'none',
          lineHeight: 1.6,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-muted)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(160,146,128,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '8px 16px',
          background: value.trim() ? 'var(--text-body)' : 'var(--border-card)',
          color: value.trim() ? '#fff' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 8,
          cursor: value.trim() ? 'pointer' : 'default',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        ⌘↵ Ask
      </button>
    </div>
  );
}
```

Also expose a `populateQuery` mechanism: add a `defaultValue` prop so clicking an EmptyState chip can populate the textarea.

## DELIVERABLE 2 — `components/EmptyState.tsx`

Shows 4 example query chips when no cards exist.

```typescript
'use client';

const EXAMPLE_QUERIES = [
  'Why do people struggle with chat interfaces?',
  'What makes a great product demo?',
  'Why do startups fail?',
  'How does machine learning work?',
];

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

export function EmptyState({ onSelectQuery }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      paddingTop: 80,
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-meta)',
      }}>
        Shape raw ideas into exactly what you need
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        maxWidth: 600,
      }}>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onSelectQuery(q)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 20,
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              maxWidth: 280,
              textAlign: 'left',
              lineHeight: 1.4,
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
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## DELIVERABLE 3 — `components/Blueprint.tsx`

The pre-response negotiation panel. This is CLAY's most novel feature.

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlueprintTopic } from '@/types';

interface BlueprintProps {
  interpretation: string;
  topics: BlueprintTopic[];
  onConfirm: (selectedTopics: string[]) => void;
  onUpdateInterpretation: (text: string) => void;
  onToggleTopic: (index: number) => void;
  isDemo: boolean;
  visible: boolean;
}

const AUTO_PROCEED_DURATION = 5000; // 5 seconds

export function Blueprint({
  interpretation,
  topics,
  onConfirm,
  onUpdateInterpretation,
  onToggleTopic,
  isDemo,
  visible,
}: BlueprintProps) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_DURATION);
  const [isEditing, setIsEditing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const resetCountdown = useCallback(() => {
    setCountdown(AUTO_PROCEED_DURATION);
    startTimeRef.current = Date.now();
  }, []);

  const handleConfirm = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const selected = topics.filter((t) => t.selected).map((t) => t.text);
    onConfirm(selected);
  }, [topics, onConfirm]);

  // Auto-proceed countdown (disabled in demo mode)
  useEffect(() => {
    if (isDemo || !visible) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = AUTO_PROCEED_DURATION - elapsed;
      if (remaining <= 0) {
        handleConfirm();
      } else {
        setCountdown(remaining);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDemo, visible, handleConfirm]);

  const handleInteraction = () => {
    if (!isDemo) resetCountdown();
  };

  const selectedCount = topics.filter((t) => t.selected).length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ overflow: 'hidden' }}
          onMouseEnter={handleInteraction}
        >
          <div
            style={{
              background: 'var(--bg-blueprint)',
              border: '1.5px solid var(--border-blueprint)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* Interpretation */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'block',
              }}>
                Claude's interpretation
              </label>
              <div
                contentEditable
                suppressContentEditableWarning
                onFocus={() => {
                  setIsEditing(true);
                  handleInteraction();
                }}
                onBlur={(e) => {
                  setIsEditing(false);
                  onUpdateInterpretation(e.currentTarget.textContent || interpretation);
                }}
                onInput={handleInteraction}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14.5,
                  fontStyle: 'italic',
                  color: 'var(--text-body)',
                  lineHeight: 1.6,
                  outline: 'none',
                  padding: '8px 0',
                  borderBottom: isEditing ? '1px solid var(--text-muted)' : '1px solid transparent',
                  transition: 'border-color 0.2s',
                }}
              >
                {interpretation}
              </div>
            </div>

            {/* Topic checklist */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: 10,
                display: 'block',
              }}>
                Topics to cover ({selectedCount} of {topics.length} selected)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topics.map((topic, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                    onClick={handleInteraction}
                  >
                    <input
                      type="checkbox"
                      checked={topic.selected}
                      onChange={() => {
                        onToggleTopic(i);
                        handleInteraction();
                      }}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: 'var(--text-body)',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: topic.selected ? 'var(--text-body)' : 'var(--text-muted)',
                      textDecoration: topic.selected ? 'none' : 'line-through',
                      transition: 'color 0.15s, text-decoration 0.15s',
                    }}>
                      {topic.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sculpt button + auto-proceed bar */}
            <div>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                style={{
                  width: '100%',
                  height: 44,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: selectedCount > 0 ? '#fff' : 'var(--text-muted)',
                  background: selectedCount > 0 ? 'var(--text-body)' : 'var(--border-card)',
                  border: 'none',
                  borderRadius: 22,
                  cursor: selectedCount > 0 ? 'pointer' : 'default',
                  transition: 'background 0.15s, transform 0.1s',
                  letterSpacing: '0.02em',
                }}
                onMouseDown={(e) => {
                  if (selectedCount > 0) e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sculpt Response ({selectedCount} topic{selectedCount !== 1 ? 's' : ''})
              </button>

              {/* Auto-proceed progress bar (hidden in demo mode) */}
              {!isDemo && (
                <div style={{
                  width: '100%',
                  height: 2,
                  background: 'var(--border-card)',
                  borderRadius: 1,
                  marginTop: 8,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--action-expand)',
                      width: `${(countdown / AUTO_PROCEED_DURATION) * 100}%`,
                      transition: 'width 0.05s linear',
                      borderRadius: 1,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## DELIVERABLE 4 — `components/Card.tsx`

Individual card component with fade-in animation. Action sidebar and evaluator dot will be added in Prompts 3 and 4.

```typescript
'use client';

import { motion } from 'framer-motion';
import type { Card as CardType } from '@/types';

interface CardProps {
  card: CardType;
  index: number;
}

const VARIANT_COLORS: Record<string, string> = {
  compressed: 'var(--action-compress)',
  expanded: 'var(--action-expand)',
  rephrased: 'var(--action-rephrase)',
};

const VARIANT_LABELS: Record<string, string> = {
  compressed: '↙ compressed',
  expanded: '↗ expanded',
  rephrased: '↺ rephrased',
};

export function Card({ card, index }: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300,
        delay: index * 0.22,
      }}
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 10,
        padding: '20px 24px',
        boxShadow: 'var(--shadow-idle)',
        transition: 'box-shadow 0.2s, background 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        e.currentTarget.style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-idle)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      {/* Variant badge */}
      {card.variant !== 'original' && VARIANT_LABELS[card.variant] && (
        <span style={{
          position: 'absolute',
          top: -10,
          left: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: VARIANT_COLORS[card.variant],
          background: 'var(--bg-card)',
          border: `1.5px solid ${VARIANT_COLORS[card.variant]}`,
          borderRadius: 10,
          padding: '2px 10px',
        }}>
          {VARIANT_LABELS[card.variant]}
        </span>
      )}

      {/* Loading shimmer overlay */}
      {card.loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(160,146,128,0.08), transparent)',
            animation: 'shimmer 1.2s linear infinite',
          }} />
        </div>
      )}

      {/* Card body text */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 15.5,
        lineHeight: 1.7,
        color: 'var(--text-body)',
        opacity: card.loading ? 0.5 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: card.loading ? 'none' : 'auto',
      }}>
        {card.text}
      </p>

      {/* Inspect panel (shown when card.inspect is not null) */}
      {card.inspect && (
        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px dashed var(--action-inspect)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'var(--action-inspect)',
          }}>
            {card.inspect}
          </p>
        </div>
      )}

      {/* Topic label */}
      {card.topic && (
        <span style={{
          display: 'inline-block',
          marginTop: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-meta)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {card.topic}
        </span>
      )}
    </motion.div>
  );
}
```

## DELIVERABLE 5 — `components/Canvas.tsx`

Card grid container with stagger orchestration.

```typescript
'use client';

import { AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { Card as CardType } from '@/types';

interface CanvasProps {
  cards: CardType[];
}

export function Canvas({ cards }: CanvasProps) {
  if (cards.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 80,
    }}>
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <Card key={card.id} card={card} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

## DELIVERABLE 6 — `components/StreamingPreview.tsx`

Shows live streaming text with a blinking cursor.

```typescript
'use client';

interface StreamingPreviewProps {
  text: string;
}

export function StreamingPreview({ text }: StreamingPreviewProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1.5px dashed var(--border-card)',
      borderRadius: 10,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
      }}>
        {text || 'Sculpting response…'}
        <span style={{
          display: 'inline-block',
          width: 2,
          height: 16,
          background: 'var(--text-muted)',
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink 1s infinite',
        }} />
      </p>
    </div>
  );
}
```

## DELIVERABLE 7 — `components/GestureLegend.tsx`

Fixed bottom legend bar, visible only when cards exist.

```typescript
'use client';

const LEGEND_ITEMS = [
  { icon: '↙', label: 'compress', color: 'var(--action-compress)' },
  { icon: '↗', label: 'expand', color: 'var(--action-expand)' },
  { icon: '↺', label: 'rephrase', color: 'var(--action-rephrase)' },
  { icon: '⚙', label: 'inspect', color: 'var(--action-inspect)' },
  { icon: '✕', label: 'dismiss', color: 'var(--action-dismiss)' },
];

export function GestureLegend() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 24,
      padding: '10px 0',
      background: 'linear-gradient(transparent, var(--bg-canvas) 40%)',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      {LEGEND_ITEMS.map((item) => (
        <span key={item.label} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: item.color,
          letterSpacing: '0.04em',
        }}>
          {item.icon} {item.label}
        </span>
      ))}
    </div>
  );
}
```

## DELIVERABLE 8 — `app/page.tsx` (Full Orchestration)

Wire everything together: QueryInput → Blueprint → Streaming → Cards.

```typescript
'use client';

import { useCallback, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClayStore } from '@/hooks/useClayStore';
import { streamClaude, fetchBlueprint } from '@/lib/claude';
import { parseIntoCards } from '@/lib/parser';
import { QueryInput } from '@/components/QueryInput';
import { Blueprint } from '@/components/Blueprint';
import { Canvas } from '@/components/Canvas';
import { StreamingPreview } from '@/components/StreamingPreview';
import { EmptyState } from '@/components/EmptyState';
import { GestureLegend } from '@/components/GestureLegend';
import type { BlueprintTopic } from '@/types';

export default function Home() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const {
    cards, query, blueprintData, status,
    addCard, clearCards, setQuery, setStatus,
    setBlueprintData,
  } = useClayStore();

  const [streamingText, setStreamingText] = useState('');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [localTopics, setLocalTopics] = useState<BlueprintTopic[]>([]);
  const [localInterpretation, setLocalInterpretation] = useState('');
  const queryInputRef = useRef<string>('');

  const handleSubmit = useCallback(async (q: string) => {
    setQuery(q);
    queryInputRef.current = q;
    clearCards();
    setStreamingText('');
    setShowStreaming(false);

    // Phase 1: Blueprint
    setStatus({ type: 'blueprinting', message: 'Preparing blueprint…' });
    try {
      const blueprint = await fetchBlueprint(q);
      const topics: BlueprintTopic[] = blueprint.topics.map((t) => ({
        text: t,
        selected: true,
      }));
      setLocalTopics(topics);
      setLocalInterpretation(blueprint.interpretation);
      setBlueprintData({ interpretation: blueprint.interpretation, topics });
      setShowBlueprint(true);
      setStatus({ type: 'idle' });
    } catch (err) {
      // Blueprint failed — skip to direct generation
      console.warn('Blueprint failed, generating directly:', err);
      setShowBlueprint(false);
      await generateCards(q);
    }
  }, []);

  const handleBlueprintConfirm = useCallback(async (selectedTopics: string[]) => {
    setShowBlueprint(false);
    await generateCards(queryInputRef.current, selectedTopics);
  }, []);

  const generateCards = async (q: string, selectedTopics?: string[]) => {
    setStatus({ type: 'streaming', message: 'Sculpting response…' });
    setShowStreaming(true);

    try {
      // Stream the response
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          selectedTopics,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream available');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      // Parse into cards
      setShowStreaming(false);
      const parsed = parseIntoCards(fullText, selectedTopics);

      // Stagger cards onto canvas
      clearCards();
      for (let i = 0; i < parsed.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, i === 0 ? 0 : 220));
        addCard(parsed[i]);
      }

      setStatus({
        type: 'ready',
        message: `${parsed.length} cards ready — hover to sculpt · double-click to rephrase`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setStatus({ type: 'error', message });
      setShowStreaming(false);
    }
  };

  const handleToggleTopic = (index: number) => {
    setLocalTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleSelectQuery = (q: string) => {
    handleSubmit(q);
  };

  const isDisabled = status.type === 'blueprinting' || status.type === 'streaming' || status.type === 'loading';

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
        justifyContent: 'space-between',
        marginBottom: 32,
      }}>
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
        {cards.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            {cards.length} card{cards.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {/* Query Input */}
      <QueryInput onSubmit={handleSubmit} disabled={isDisabled} />

      {/* Status */}
      {status.type !== 'idle' && status.message && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: status.type === 'error' ? 'var(--action-dismiss)' : 'var(--text-muted)',
          marginBottom: 16,
        }}>
          {(status.type === 'blueprinting' || status.type === 'streaming' || status.type === 'evaluating') && (
            <span style={{ animation: 'blink 1s infinite' }}>● </span>
          )}
          {status.message}
        </p>
      )}

      {/* Blueprint Panel */}
      <Blueprint
        interpretation={localInterpretation}
        topics={localTopics}
        onConfirm={handleBlueprintConfirm}
        onUpdateInterpretation={setLocalInterpretation}
        onToggleTopic={handleToggleTopic}
        isDemo={isDemo}
        visible={showBlueprint}
      />

      {/* Streaming Preview */}
      {showStreaming && <StreamingPreview text={streamingText} />}

      {/* Card Canvas */}
      <Canvas cards={cards} />

      {/* Empty State */}
      {cards.length === 0 && !showBlueprint && !showStreaming && status.type === 'idle' && (
        <EmptyState onSelectQuery={handleSelectQuery} />
      )}

      {/* Gesture Legend */}
      {cards.length > 0 && <GestureLegend />}
    </main>
  );
}
```

## ACCEPTANCE CRITERIA — All must pass before Prompt 3

1. App loads at `localhost:3000` with parchment background, CLAY header, and 4 example chips
2. Clicking an example chip triggers the full flow: blueprint → cards
3. Type a custom query → press Cmd+Enter → Blueprint panel slides in within 1.5 seconds showing Claude's interpretation + 4-7 topic checkboxes
4. Uncheck 2 topics → click "Sculpt Response" → Blueprint collapses with spring animation → StreamingPreview shows live text → cards fade in with 220ms stagger
5. Card count matches selected topic count (±1 acceptable due to parser reconciliation)
6. Cards render Lora serif text in white rounded cards on parchment background
7. Variant badges render correctly for any card variant
8. Auto-proceed countdown bar animates (5s), resets on panel interaction. Disabled when `?demo=1` in URL.
9. Blueprint failure gracefully skips to direct card generation (no white screen)
10. Status messages update correctly: "Preparing blueprint…" → "Sculpting response…" → "{n} cards ready"
11. GestureLegend appears at bottom when cards are present
