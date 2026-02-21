'use client';

import { AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { Card as CardType, EvaluatorResults } from '@/types';

// Approximate layout constants for overlap line positioning
const CARD_HEIGHT = 140;
const GAP = 16;

interface CanvasProps {
  cards: CardType[];
  evaluatorResults: EvaluatorResults | null;
  overlapHighlighted?: boolean;
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function Canvas({ cards, evaluatorResults, overlapHighlighted = false, onCompress, onExpand, onRephrase, onInspect, onDismiss }: CanvasProps) {
  if (cards.length === 0) return null;

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: GAP,
      paddingBottom: 80,
      paddingRight: 52,
    }}>
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const evaluation = evaluatorResults?.cards.find((e) => e.id === card.id) ?? null;
          return (
            <Card
              key={card.id}
              card={card}
              index={i}
              evaluation={evaluation}
              onCompress={onCompress}
              onExpand={onExpand}
              onRephrase={onRephrase}
              onInspect={onInspect}
              onDismiss={onDismiss}
            />
          );
        })}
      </AnimatePresence>

      {/* Overlap lines SVG */}
      {evaluatorResults && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {evaluatorResults.cards
            .filter((e) => e.overlaps_with !== null)
            .map((e) => {
              const fromIdx = cards.findIndex((c) => c.id === e.id);
              // Use card ID lookup — safe even after card dismissal
              const toIdx = cards.findIndex((c) => c.id === e.overlaps_with);
              if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return null;

              const fromY = fromIdx * (CARD_HEIGHT + GAP) + CARD_HEIGHT / 2;
              const toY = toIdx * (CARD_HEIGHT + GAP) + CARD_HEIGHT / 2;

              return (
                <line
                  key={`overlap-${e.id}`}
                  x1="98%"
                  y1={fromY}
                  x2="98%"
                  y2={toY}
                  stroke={overlapHighlighted ? 'var(--action-inspect)' : 'var(--eval-overlap)'}
                  strokeWidth={overlapHighlighted ? 2 : 1}
                  strokeDasharray="4 4"
                  opacity={overlapHighlighted ? 1 : 0.6}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s' }}
                />
              );
            })}
        </svg>
      )}
    </div>
  );
}
