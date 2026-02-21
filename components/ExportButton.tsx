'use client';

import { useState, useRef, useEffect } from 'react';
import type { Card, EvaluatorResults } from '@/types';

interface ExportButtonProps {
  cards: Card[];
  query: string;
  evaluatorResults: EvaluatorResults | null;
}

export function ExportButton({ cards, query, evaluatorResults }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (cards.length === 0) return null;

  // Escape characters that would break markdown structure
  function escapeMarkdown(text: string): string {
    return text
      .split('\n')
      .map((line) => line.replace(/^(#{1,6}\s)/, '\\$1'))  // escape heading markers at line start
      .join('\n')
      .replace(/([_*`[\]])/g, '\\$1');                      // escape inline markdown specials
  }

  const handleCopy = async () => {
    const text = cards.map((c, i) => `${i + 1}. ${c.text}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setIsOpen(false), 500);
  };

  const handleDownload = () => {
    const date = new Date().toISOString().split('T')[0];
    let md = `# CLAY Export\n\n`;
    md += `**Query:** ${query}\n`;
    md += `**Date:** ${date}\n\n---\n\n`;

    cards.forEach((c, i) => {
      md += `## Card ${i + 1}`;
      if (c.variant !== 'original') md += ` [${c.variant}]`;
      md += `\n\n${escapeMarkdown(c.text)}\n\n`;
      if (c.inspect) md += `> **Reasoning:** ${escapeMarkdown(c.inspect)}\n\n`;
      md += `---\n\n`;
    });

    if (evaluatorResults) {
      md += `## Evaluator Summary\n\n`;
      md += `${evaluatorResults.overall}\n\n`;
      md += `**Recommended action:** ${evaluatorResults.recommended_action}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clay-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'transparent',
          border: '1px solid var(--border-card)',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
      >
        ↓ export
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: 180,
        }}>
          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: copied ? 'var(--eval-strong)' : 'var(--text-body)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
          <div style={{ height: 1, background: 'var(--border-card)' }} />
          <button
            onClick={handleDownload}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-body)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Download .md
          </button>
        </div>
      )}
    </div>
  );
}
