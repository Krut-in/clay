'use client';

import { useState, useRef, useCallback } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  defaultValue?: string;
}

export function QueryInput({ onSubmit, disabled, defaultValue }: QueryInputProps) {
  const [value, setValue] = useState(defaultValue || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }, [value, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: 'relative',
      marginBottom: 24,
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything — Cmd+Enter to submit"
        disabled={disabled}
        rows={3}
        style={{
          width: '100%',
          padding: '16px 20px',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          color: 'var(--text-body)',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-card)',
          borderRadius: 12,
          resize: 'none',
          outline: 'none',
          lineHeight: 1.6,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-muted)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(160,146,128,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '8px 16px',
          background: value.trim() ? 'var(--text-body)' : 'var(--border-card)',
          color: value.trim() ? '#fff' : 'var(--text-muted)',
          border: 'none',
          borderRadius: 8,
          cursor: value.trim() ? 'pointer' : 'default',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        ⌘↵ Ask
      </button>
    </div>
  );
}
