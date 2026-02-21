'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CLAY Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 24,
      padding: 32,
      background: 'var(--bg-canvas)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--text-body)',
      }}>
        clay
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        color: 'var(--text-muted)',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        Something went wrong. This is probably temporary.
      </p>
      <button
        onClick={reset}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: '#fff',
          background: 'var(--text-body)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
