'use client';

import { useCallback, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClayStore } from '@/hooks/useClayStore';
import { fetchBlueprint } from '@/lib/claude';
import { parseIntoCards } from '@/lib/parser';
import { QueryInput } from '@/components/QueryInput';
import { Blueprint } from '@/components/Blueprint';
import { Canvas } from '@/components/Canvas';
import { StreamingPreview } from '@/components/StreamingPreview';
import { EmptyState } from '@/components/EmptyState';
import { GestureLegend } from '@/components/GestureLegend';
import type { BlueprintTopic } from '@/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const {
    cards, status,
    addCard, clearCards, setQuery, setStatus,
    setBlueprintData,
  } = useClayStore();

  const [streamingText, setStreamingText] = useState('');
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [localTopics, setLocalTopics] = useState<BlueprintTopic[]>([]);
  const [localInterpretation, setLocalInterpretation] = useState('');
  const queryInputRef = useRef<string>('');

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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
