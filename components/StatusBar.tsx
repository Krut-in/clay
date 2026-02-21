'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { AppStatus } from '@/types';

interface StatusBarProps {
  status: AppStatus;
  cardCount: number;
}

function getStatusContent(status: AppStatus, cardCount: number): { text: string; blink: boolean; isError: boolean } {
  switch (status.type) {
    case 'idle':
      return { text: '', blink: false, isError: false };
    case 'blueprinting':
      return { text: 'Preparing blueprint…', blink: true, isError: false };
    case 'loading':
      return { text: 'Claude is thinking…', blink: true, isError: false };
    case 'streaming':
      return { text: 'Sculpting response…', blink: true, isError: false };
    case 'ready':
      return {
        text: status.message || `${cardCount} cards ready — hover to sculpt · double-click to rephrase · ⌘K to command`,
        blink: false,
        isError: false,
      };
    case 'evaluating':
      return { text: 'Evaluator analysing…', blink: true, isError: false };
    case 'card-loading':
      return { text: status.message || 'Transforming card…', blink: false, isError: false };
    case 'error':
      return { text: `⚠ ${status.message || 'Something went wrong'}`, blink: false, isError: true };
    default:
      return { text: '', blink: false, isError: false };
  }
}

export function StatusBar({ status, cardCount }: StatusBarProps) {
  const { text, blink, isError } = getStatusContent(status, cardCount);

  if (!text) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.type + (status.message || '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: isError ? 'var(--action-dismiss)' : 'var(--text-muted)',
          marginBottom: 16,
          lineHeight: 1.4,
        }}
      >
        {blink && (
          <span style={{ animation: 'blink 1s infinite', marginRight: 4 }}>●</span>
        )}
        {text}
      </motion.div>
    </AnimatePresence>
  );
}
