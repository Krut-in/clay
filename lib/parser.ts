import type { Card } from '@/types';

let counter = 0;
function uid(): string {
  return `card-${Date.now()}-${++counter}`;
}

export function parseIntoCards(text: string, selectedTopics?: string[]): Card[] {
  // Split on double newlines (primary delimiter)
  let paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 20);

  // Fallback: if only one paragraph, try single newline
  if (paragraphs.length <= 1) {
    paragraphs = text
      .split(/\n/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 20);
  }

  // Final fallback: split every ~100 words
  if (paragraphs.length <= 1 && text.length > 200) {
    const words = text.split(/\s+/);
    paragraphs = [];
    for (let i = 0; i < words.length; i += 100) {
      const chunk = words.slice(i, i + 100).join(' ').trim();
      if (chunk.length >= 20) paragraphs.push(chunk);
    }
  }

  // Reconciliation: if selectedTopics provided, try to match count
  if (selectedTopics && paragraphs.length > selectedTopics.length) {
    // Merge smallest adjacent paragraphs until count matches
    while (paragraphs.length > selectedTopics.length) {
      let minLen = Infinity;
      let minIdx = 0;
      for (let i = 0; i < paragraphs.length - 1; i++) {
        const combined = paragraphs[i].length + paragraphs[i + 1].length;
        if (combined < minLen) {
          minLen = combined;
          minIdx = i;
        }
      }
      paragraphs[minIdx] = paragraphs[minIdx] + ' ' + paragraphs[minIdx + 1];
      paragraphs.splice(minIdx + 1, 1);
    }
  }

  return paragraphs.map((text, i) => ({
    id: uid(),
    text,
    topic: selectedTopics?.[i] ?? null,
    variant: 'original' as const,
    loading: false,
    inspect: null,
  }));
}
