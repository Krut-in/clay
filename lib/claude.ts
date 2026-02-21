export async function streamClaude(
  query: string,
  selectedTopics?: string[]
): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      selectedTopics,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${error}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream available');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  return fullText;
}

export async function fetchBlueprint(
  query: string
): Promise<{ interpretation: string; topics: string[] }> {
  const res = await fetch('/api/blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Blueprint API error: ${res.status}`);
  }

  return res.json();
}
