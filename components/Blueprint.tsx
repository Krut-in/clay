'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlueprintTopic } from '@/types';

interface BlueprintProps {
  interpretation: string;
  topics: BlueprintTopic[];
  onConfirm: (selectedTopics: string[]) => void;
  onUpdateInterpretation: (text: string) => void;
  onToggleTopic: (index: number) => void;
  isDemo: boolean;
  visible: boolean;
}

const AUTO_PROCEED_DURATION = 45000; // 45 seconds

export function Blueprint({
  interpretation,
  topics,
  onConfirm,
  onUpdateInterpretation,
  onToggleTopic,
  isDemo,
  visible,
}: BlueprintProps) {
  const [countdown, setCountdown] = useState(AUTO_PROCEED_DURATION);
  const [isEditing, setIsEditing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const handleConfirm = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const selected = topics.filter((t) => t.selected).map((t) => t.text);
    onConfirm(selected);
  }, [topics, onConfirm]);

  // Keep a stable ref to handleConfirm so the timer effect never needs to restart
  // when topics change (which would reset startTimeRef and restart the countdown).
  const handleConfirmRef = useRef(handleConfirm);
  useEffect(() => {
    handleConfirmRef.current = handleConfirm;
  }, [handleConfirm]);

  // Auto-proceed countdown — fires once when Blueprint becomes visible.
  // Depends only on isDemo / visible so topic changes never restart the clock.
  useEffect(() => {
    if (isDemo || !visible) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = AUTO_PROCEED_DURATION - elapsed;
      if (remaining <= 0) {
        handleConfirmRef.current();
      } else {
        setCountdown(remaining);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, visible]);

  const selectedCount = topics.filter((t) => t.selected).length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ overflow: 'hidden' }}
        >
          <div
            style={{
              background: 'var(--bg-blueprint)',
              border: '1.5px solid var(--border-blueprint)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            {/* Interpretation */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'block',
              }}>
                Claude&apos;s interpretation
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => {
                    setIsEditing(true);
                  }}
                  onBlur={(e) => {
                    setIsEditing(false);
                    onUpdateInterpretation(e.currentTarget.textContent || interpretation);
                  }}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14.5,
                    fontStyle: 'italic',
                    color: 'var(--text-body)',
                    lineHeight: 1.6,
                    outline: 'none',
                    padding: '8px 24px 8px 0',
                    borderBottom: isEditing ? '1px solid var(--text-muted)' : '1px solid transparent',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {interpretation}
                </div>
                <span style={{
                  position: 'absolute',
                  right: 0,
                  top: 8,
                  fontSize: 13,
                  color: 'var(--text-meta)',
                  pointerEvents: 'none',
                  opacity: isEditing ? 0 : 0.7,
                  transition: 'opacity 0.15s',
                }}>
                  ✏
                </span>
              </div>
            </div>

            {/* Topic checklist */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: 10,
                display: 'block',
              }}>
                Topics to cover ({selectedCount} of {topics.length} selected)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topics.map((topic, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}

                  >
                    <input
                      type="checkbox"
                      checked={topic.selected}
                      onChange={() => {
                        onToggleTopic(i);
                      }}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: 'var(--text-body)',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: topic.selected ? 'var(--text-body)' : 'var(--text-muted)',
                      textDecoration: topic.selected ? 'none' : 'line-through',
                      transition: 'color 0.15s, text-decoration 0.15s',
                    }}>
                      {topic.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sculpt button + auto-proceed bar */}
            <div>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                style={{
                  width: '100%',
                  height: 44,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: selectedCount > 0 ? '#fff' : 'var(--text-muted)',
                  background: selectedCount > 0 ? 'var(--text-body)' : 'var(--border-card)',
                  border: 'none',
                  borderRadius: 22,
                  cursor: selectedCount > 0 ? 'pointer' : 'default',
                  transition: 'background 0.15s, transform 0.1s',
                  letterSpacing: '0.02em',
                }}
                onMouseDown={(e) => {
                  if (selectedCount > 0) e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sculpt Response ({selectedCount} topic{selectedCount !== 1 ? 's' : ''})
              </button>

              {/* Auto-proceed progress bar (hidden in demo mode) */}
              {!isDemo && (
                <div style={{
                  width: '100%',
                  height: 2,
                  background: 'var(--border-card)',
                  borderRadius: 1,
                  marginTop: 8,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--action-expand)',
                      width: `${(countdown / AUTO_PROCEED_DURATION) * 100}%`,
                      transition: 'width 0.05s linear',
                      borderRadius: 1,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
