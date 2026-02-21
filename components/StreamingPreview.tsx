'use client';

interface StreamingPreviewProps {
  text: string;
}

export function StreamingPreview({ text }: StreamingPreviewProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1.5px dashed var(--border-card)',
      borderRadius: 10,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        margin: 0,
      }}>
        {text || 'Sculpting response…'}
        <span style={{
          display: 'inline-block',
          width: 2,
          height: 16,
          background: 'var(--text-muted)',
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink 1s infinite',
        }} />
      </p>
    </div>
  );
}
