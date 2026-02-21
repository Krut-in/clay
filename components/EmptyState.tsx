'use client';

const EXAMPLE_QUERIES = [
  'Why do people struggle with chat interfaces?',
  'What makes a great product demo?',
  'Why do startups fail?',
  'How does machine learning work?',
];

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

export function EmptyState({ onSelectQuery }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      paddingTop: 80,
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-meta)',
      }}>
        Shape raw ideas into exactly what you need
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        maxWidth: 600,
      }}>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onSelectQuery(q)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 20,
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              maxWidth: 280,
              textAlign: 'left',
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-muted)';
              e.currentTarget.style.color = 'var(--text-body)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-card)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
