import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLAY — Response Sculpting Interface',
  description: 'Sculpt AI responses into exactly what you need',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
