'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionSidebarProps {
  onCompress: () => void;
  onExpand: () => void;
  onRephrase: () => void;
  onInspect: () => void;
  onDismiss: () => void;
  disabled: boolean;
}

const ACTIONS = [
  { key: 'compress', icon: '↙', colorVar: 'var(--action-compress)', colorRaw: '#2D2D2D', label: 'Compress' },
  { key: 'expand', icon: '↗', colorVar: 'var(--action-expand)', colorRaw: '#1A4A8A', label: 'Expand' },
  { key: 'rephrase', icon: '↺', colorVar: 'var(--action-rephrase)', colorRaw: '#2D6A2D', label: 'Rephrase' },
  { key: 'inspect', icon: '⚙', colorVar: 'var(--action-inspect)', colorRaw: '#8A6A00', label: 'Inspect' },
  { key: 'dismiss', icon: '✕', colorVar: 'var(--action-dismiss)', colorRaw: '#C0392B', label: 'Dismiss' },
] as const;

export function ActionSidebar({
  onCompress, onExpand, onRephrase, onInspect, onDismiss, disabled,
}: ActionSidebarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const handlers: Record<string, () => void> = {
    compress: onCompress,
    expand: onExpand,
    rephrase: onRephrase,
    inspect: onInspect,
    dismiss: onDismiss,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        zIndex: 10,
      }}
    >
      {ACTIONS.map((action) => {
        const isHovered = hoveredKey === action.key;

        return (
          <motion.button
            key={action.key}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              handlers[action.key]();
            }}
            onMouseEnter={() => !disabled && setHoveredKey(action.key)}
            onMouseLeave={() => setHoveredKey(null)}
            animate={{
              width: isHovered ? 120 : 34,
              backgroundColor: isHovered ? action.colorRaw : '#FFFFFF',
              boxShadow: isHovered
                ? `0 4px 16px ${action.colorRaw}40`
                : '0 2px 8px rgba(0,0,0,0.18)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              height: 34,
              borderRadius: 8,
              border: 'none',
              color: isHovered ? '#fff' : action.colorVar,
              fontSize: 16,
              cursor: disabled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 9,
              gap: 6,
              opacity: disabled ? 0.4 : 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              outline: 'none',
            }}
          >
            <span style={{ flexShrink: 0, lineHeight: 1 }}>
              {action.icon}
            </span>

            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.12, delay: 0.04 }}
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    pointerEvents: 'none',
                  }}
                >
                  {action.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
