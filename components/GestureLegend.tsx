'use client';

const LEGEND_ITEMS = [
  { icon: '↙', label: 'compress', color: 'var(--action-compress)' },
  { icon: '↗', label: 'expand', color: 'var(--action-expand)' },
  { icon: '↺', label: 'rephrase', color: 'var(--action-rephrase)' },
  { icon: '⚙', label: 'inspect', color: 'var(--action-inspect)' },
  { icon: '✕', label: 'dismiss', color: 'var(--action-dismiss)' },
];

export function GestureLegend() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 24,
      padding: '10px 0',
      background: 'linear-gradient(transparent, var(--bg-canvas) 40%)',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      {LEGEND_ITEMS.map((item) => (
        <span key={item.label} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: item.color,
          letterSpacing: '0.04em',
        }}>
          {item.icon} {item.label}
        </span>
      ))}
    </div>
  );
}
