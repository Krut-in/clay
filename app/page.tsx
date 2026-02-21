'use client';

export default function Home() {
  return (
    <main style={{
      maxWidth: 880,
      margin: '0 auto',
      padding: '32px 24px',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 48,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--text-body)',
          letterSpacing: '-0.02em',
        }}>
          clay
        </h1>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          response sculpting
        </span>
      </header>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: 120,
      }}>
        Foundation loaded. Proceed to Prompt 2.
      </p>
    </main>
  );
}
