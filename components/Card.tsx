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
        margin: 0,
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
            margin: 0,
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
