'use client';

import { motion } from 'framer-motion';

interface ActionSidebarProps {
  onCompress: () => void;
  onExpand: () => void;
  onRephrase: () => void;
  onInspect: () => void;
  onDismiss: () => void;
  disabled: boolean;
}

const ACTIONS = [
  { key: 'compress', icon: '↙', color: 'var(--action-compress)', title: 'Compress to one sentence' },
  { key: 'expand', icon: '↗', color: 'var(--action-expand)', title: 'Expand with example' },
  { key: 'rephrase', icon: '↺', color: 'var(--action-rephrase)', title: 'Rephrase from new angle' },
  { key: 'inspect', icon: '⚙', color: 'var(--action-inspect)', title: 'Inspect reasoning' },
  { key: 'dismiss', icon: '✕', color: 'var(--action-dismiss)', title: 'Dismiss card' },
] as const;

export function ActionSidebar({
  onCompress, onExpand, onRephrase, onInspect, onDismiss, disabled,
}: ActionSidebarProps) {
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
        right: -48,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 10,
      }}
    >
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          title={action.title}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handlers[action.key]();
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: 'none',
            background: 'var(--bg-card)',
            color: action.color,
            fontSize: 16,
            cursor: disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            opacity: disabled ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1.12)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.22)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
          }}
        >
          {action.icon}
        </button>
      ))}
    </motion.div>
  );
}
