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
