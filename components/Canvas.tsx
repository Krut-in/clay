'use client';

import { AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import type { Card as CardType } from '@/types';

interface CanvasProps {
  cards: CardType[];
  onCompress: (id: string) => void;
  onExpand: (id: string) => void;
  onRephrase: (id: string) => void;
  onInspect: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function Canvas({ cards, onCompress, onExpand, onRephrase, onInspect, onDismiss }: CanvasProps) {
  if (cards.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 80,
      paddingRight: 56,
    }}>
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            index={i}
            onCompress={onCompress}
            onExpand={onExpand}
            onRephrase={onRephrase}
            onInspect={onInspect}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
