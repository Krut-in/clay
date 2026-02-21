import Anthropic from '@anthropic-ai/sdk';
import { BLUEPRINT_PROMPT } from '@/lib/prompts';
import { getCached, setCached, hashKey } from '@/lib/redis';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `clay:blueprint:${hashKey(query)}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: BLUEPRINT_PROMPT(query) }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    // Strip markdown fences if Claude adds them despite instructions
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    // Validate shape
    if (!parsed.interpretation || !Array.isArray(parsed.topics)) {
      throw new Error('Invalid blueprint response shape');
    }

    await setCached(cacheKey, JSON.stringify(parsed));

    return NextResponse.json(parsed, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Blueprint generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
