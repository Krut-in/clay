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
        // Trust the evaluator to echo back the card IDs we sent it
        const mappedCards = data.cards.map((evalCard: { id: string; strength: string; suggestion: string; overlaps_with: string | null }) => ({
          id: evalCard.id,
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
