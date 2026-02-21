'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { EvaluatorResults } from '@/types';

interface EvaluatorBarProps {
  results: EvaluatorResults | null;
  cardCount: number;
}

export function EvaluatorBar({ results, cardCount }: EvaluatorBarProps) {
  const visible = results !== null && cardCount > 0;

  return (
    <AnimatePresence>
      {visible && results && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            padding: '10px 0',
            marginBottom: 16,
            borderBottom: '1px solid var(--border-card)',
          }}
        >
          <span style={{ marginRight: 16 }}>{results.overall}</span>
          {results.recommended_action && (
            <span style={{
              color: 'var(--action-expand)',
              fontStyle: 'italic',
            }}>
              → {results.recommended_action}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
