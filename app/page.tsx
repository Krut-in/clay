'use client';

import { useCallback, useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useClayStore } from '@/hooks/useClayStore';
import { useCopilotActions } from '@/hooks/useCopilotActions';
import { useEvaluator } from '@/hooks/useEvaluator';
import { fetchBlueprint } from '@/lib/claude';
import { parseIntoCards } from '@/lib/parser';
import { DEMO_CARDS, DEMO_EVALUATOR, DEMO_QUERY } from '@/lib/demo';
import { QueryInput } from '@/components/QueryInput';
import { Blueprint } from '@/components/Blueprint';
import { Canvas } from '@/components/Canvas';
import { StreamingPreview } from '@/components/StreamingPreview';
import { EmptyState } from '@/components/EmptyState';
import { GestureLegend } from '@/components/GestureLegend';
import { EvaluatorBar } from '@/components/EvaluatorBar';
import { ExportButton } from '@/components/ExportButton';
import { StatusBar } from '@/components/StatusBar';
import { CommandPalette } from '@/components/CommandPalette';
import type { BlueprintTopic } from '@/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';

  const {
    cards, status, query, evaluatorResults, overlapHighlighted,
    addCard, clearCards, setQuery, setStatus,
    setBlueprintData, updateCard, removeCard,
    setEvaluatorResults, setIsDemo, isDemo,
  } = useClayStore();

  // Register CopilotKit actions and readable state
  useCopilotActions();

  // Auto-fire evaluator when cards change
  useEvaluator();

  // Cmd+K keyboard shortcut → open CopilotKit command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const trigger = document.querySelector('[class*="copilotKitButton"]') as HTMLElement;
        if (trigger) trigger.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [streamingText, setStreamingText] = useState('');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [localTopics, setLocalTopics] = useState<BlueprintTopic[]>([]);
  const [localInterpretation, setLocalInterpretation] = useState('');
  const queryInputRef = useRef<string>('');

  // Demo mode: load pre-built cards + evaluator data instantly
  useEffect(() => {
    if (!isDemoParam) return;
    setIsDemo(true);
    setQuery(DEMO_QUERY);
    clearCards();
    for (const card of DEMO_CARDS) {
      addCard(card);
    }
    setEvaluatorResults(DEMO_EVALUATOR);
    setStatus({
      type: 'ready',
      message: `${DEMO_CARDS.length} cards ready — hover to sculpt · double-click to rephrase`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoParam]);

  const generateCards = async (q: string, selectedTopics?: string[]) => {
    setStatus({ type: 'streaming', message: 'Sculpting response…' });
    setShowStreaming(true);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }],
          selectedTopics,
        }),
      });

      if (res.status === 429) {
        setStatus({ type: 'error', message: 'Rate limit hit — retrying in 5 seconds…' });
        await new Promise((r) => setTimeout(r, 5000));
        return generateCards(q, selectedTopics);
      }

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

  const handleSubmit = useCallback(async (q: string) => {
    setQuery(q);
    queryInputRef.current = q;
    clearCards();
    setStreamingText('');
    setShowBlueprint(false);
    setShowStreaming(false);

    // Phase 1: Blueprint
    setStatus({ type: 'blueprinting', message: 'Preparing blueprint…' });
    try {
      const blueprint = await fetchBlueprint(q);
      const topics: BlueprintTopic[] = blueprint.topics.map((t: string) => ({
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlueprintConfirm = useCallback(async (selectedTopics: string[]) => {
    setShowBlueprint(false);
    await generateCards(queryInputRef.current, selectedTopics);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleTopic = (index: number) => {
    setLocalTopics((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleSelectQuery = (q: string) => {
    handleSubmit(q);
  };

  // Card action handlers
  const handleCompress = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    updateCard(id, { loading: true });
    setStatus({ type: 'loading', message: 'Compressing…' });
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

  const handleExpand = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    updateCard(id, { loading: true });
    setStatus({ type: 'loading', message: 'Expanding…' });
    try {
      const res = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expand', content: card.text }),
      });
      const data = await res.json();
      updateCard(id, { text: data.result, variant: 'expanded', loading: false });
      setStatus({ type: 'ready', message: `${cards.length} cards ready — hover to sculpt` });
    } catch {
      updateCard(id, { loading: false });
      setStatus({ type: 'error', message: 'Expand failed — try again' });
    }
  };

  const handleRephrase = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    updateCard(id, { loading: true });
    setStatus({ type: 'loading', message: 'Rephrasing…' });
    try {
      const res = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rephrase', content: card.text }),
      });
      const data = await res.json();
      updateCard(id, { text: data.result, variant: 'rephrased', loading: false });
      setStatus({ type: 'ready', message: `${cards.length} cards ready — hover to sculpt` });
    } catch {
      updateCard(id, { loading: false });
      setStatus({ type: 'error', message: 'Rephrase failed — try again' });
    }
  };

  const handleInspect = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    // Toggle inspect off if already open
    if (card.inspect) {
      updateCard(id, { inspect: null });
      return;
    }

    updateCard(id, { loading: true });
    setStatus({ type: 'loading', message: 'Inspecting…' });
    try {
      const res = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inspect', content: card.text }),
      });
      const data = await res.json();
      updateCard(id, { inspect: data.result, loading: false });
      setStatus({ type: 'ready', message: `${cards.length} cards ready — hover to sculpt` });
    } catch {
      updateCard(id, { loading: false });
      setStatus({ type: 'error', message: 'Inspect failed — try again' });
    }
  };

  const handleDismiss = (id: string) => {
    removeCard(id);
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

      {/* Query Input */}
      <QueryInput onSubmit={handleSubmit} disabled={isDisabled} />

      {/* Status */}
      <StatusBar status={status} cardCount={cards.length} />

      {/* Blueprint Panel */}
      <Blueprint
        interpretation={localInterpretation}
        topics={localTopics}
        onConfirm={handleBlueprintConfirm}
        onUpdateInterpretation={setLocalInterpretation}
        onToggleTopic={handleToggleTopic}
        isDemo={isDemoParam}
        visible={showBlueprint}
      />

      {/* Streaming Preview */}
      {showStreaming && <StreamingPreview text={streamingText} />}

      {/* Evaluator Bar */}
      <EvaluatorBar results={evaluatorResults} cardCount={cards.length} />

      {/* Card Canvas */}
      <Canvas
        cards={cards}
        evaluatorResults={evaluatorResults}
        overlapHighlighted={overlapHighlighted}
        onCompress={handleCompress}
        onExpand={handleExpand}
        onRephrase={handleRephrase}
        onInspect={handleInspect}
        onDismiss={handleDismiss}
      />

      {/* Empty State */}
      {cards.length === 0 && !showBlueprint && !showStreaming && status.type === 'idle' && (
        <EmptyState onSelectQuery={handleSelectQuery} />
      )}

      {/* Gesture Legend */}
      {cards.length > 0 && <GestureLegend />}

      {/* Command Palette */}
      <CommandPalette />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
