'use client';

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { useClayStore } from './useClayStore';

export function useCopilotActions() {
  const { cards, evaluatorResults, query, updateCard, removeCard, setOverlapHighlighted } = useClayStore();

  // Expose canvas state to CopilotKit agent
  useCopilotReadable({
    description: 'Current CLAY canvas state: all cards with their text, variant, topic, and evaluator assessments',
    value: {
      query,
      cards: cards.map((c) => ({
        id: c.id,
        text: c.text.slice(0, 200),
        variant: c.variant,
        topic: c.topic,
        loading: c.loading,
      })),
      evaluatorResults: evaluatorResults
        ? {
            cards: evaluatorResults.cards.map((e) => ({
              id: e.id,
              strength: e.strength,
              suggestion: e.suggestion,
            })),
            overall: evaluatorResults.overall,
          }
        : null,
    },
  });

  // Card actions for CopilotKit command palette
  useCopilotAction({
    name: 'compressCard',
    description: 'Compress a specific card to one punchy sentence. Use when a card is verbose or too long.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to compress', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';

      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'compress', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'compressed', loading: false });
        return `Compressed card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Compress failed';
      }
    },
  });

  useCopilotAction({
    name: 'expandCard',
    description: 'Expand a card to 3-5 sentences with a concrete example. Use when a card needs more detail.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to expand', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';

      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'expand', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'expanded', loading: false });
        return `Expanded card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Expand failed';
      }
    },
  });

  useCopilotAction({
    name: 'rephraseCard',
    description: 'Rephrase a card from a completely different angle while preserving meaning.',
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to rephrase', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';

      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rephrase', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { text: data.result, variant: 'rephrased', loading: false });
        return `Rephrased card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Rephrase failed';
      }
    },
  });

  useCopilotAction({
    name: 'inspectCard',
    description: "Reveal the reasoning and assumptions behind a card's claims.",
    parameters: [
      { name: 'cardId', type: 'string', description: 'The ID of the card to inspect', required: true },
    ],
    handler: async ({ cardId }) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return 'Card not found';

      if (card.inspect) {
        updateCard(cardId, { inspect: null });
        return `Closed inspect for card ${cardId}`;
      }

      updateCard(cardId, { loading: true });
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'inspect', content: card.text }),
        });
        const data = await res.json();
        updateCard(cardId, { inspect: data.result, loading: false });
        return `Inspected card ${cardId}`;
      } catch {
        updateCard(cardId, { loading: false });
        return 'Inspect failed';
      }
    },
  });

  useCopilotAction({
    name: 'dismissCards',
    description: 'Dismiss one or more cards from the canvas. Use evaluator data to identify weak or overlapping cards when the user asks to "remove weak cards" or similar.',
    parameters: [
      { name: 'cardIds', type: 'string[]', description: 'Array of card IDs to dismiss', required: true },
    ],
    handler: async ({ cardIds }) => {
      (cardIds as string[]).forEach((id: string) => removeCard(id));
      return `Dismissed ${(cardIds as string[]).length} card(s)`;
    },
  });

  useCopilotAction({
    name: 'highlightOverlaps',
    description: 'Visually highlight cards that overlap with each other. Overlap lines pulse for 2 seconds.',
    parameters: [],
    handler: async () => {
      const hasOverlaps = evaluatorResults?.cards.some((e) => e.overlaps_with !== null);
      if (!hasOverlaps) return 'No overlapping cards found';
      setOverlapHighlighted(true);
      setTimeout(() => setOverlapHighlighted(false), 2000);
      return 'Highlighting overlapping cards';
    },
  });
}
