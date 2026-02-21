import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  AnthropicAdapter,
} from '@copilotkit/runtime';
import Anthropic from '@anthropic-ai/sdk';
import { COMPRESS_PROMPT, EXPAND_PROMPT, REPHRASE_PROMPT, INSPECT_PROMPT } from '@/lib/prompts';
import { getCached, setCached, hashKey } from '@/lib/redis';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic();

async function callClaude(model: string, prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  // Find the first text block — thinking-enabled models may prepend a 'thinking' block
  const textBlock = message.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text : '';
}

async function handleCardAction(
  action: string,
  content: string,
): Promise<{ result: string; cached: boolean }> {
  const cacheKey = `clay:${action}:${hashKey(content)}`;
  const cached = await getCached(cacheKey);
  if (cached) return { result: cached, cached: true };

  const promptFn: Record<string, (t: string) => string> = {
    compress: COMPRESS_PROMPT,
    expand: EXPAND_PROMPT,
    rephrase: REPHRASE_PROMPT,
    inspect: INSPECT_PROMPT,
  };

  const modelMap: Record<string, string> = {
    compress: 'claude-haiku-4-5-20251001',
    expand: 'claude-sonnet-4-6',
    rephrase: 'claude-sonnet-4-6',
    inspect: 'claude-haiku-4-5-20251001',
  };

  const prompt = promptFn[action](content);
  const model = modelMap[action];
  const result = await callClaude(model, prompt);

  await setCached(cacheKey, result);
  return { result, cached: false };
}

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  // Check if this is a direct action request (non-CopilotKit)
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = await req.clone().json();

      // Handle direct card action requests
      if (body.action && body.content) {
        const { action, content } = body;
        if (['compress', 'expand', 'rephrase', 'inspect'].includes(action)) {
          const result = await handleCardAction(action, content);
          return new Response(JSON.stringify(result), {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': result.cached ? 'HIT' : 'MISS',
            },
          });
        }
      }

      // Handle evaluator requests
      if (body.action === 'evaluate' && body.query && body.cards) {
        const { query: evalQuery, cards: evalCards } = body;

        // Cache check
        const evalInput = evalCards.map((c: { text: string }) => c.text).join('|||');
        const evalCacheKey = `clay:eval:${hashKey(evalInput)}`;
        const evalCached = await getCached(evalCacheKey);
        if (evalCached) {
          return new Response(evalCached, {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
            },
          });
        }

        // Call Claude Haiku for evaluation
        const { EVALUATOR_PROMPT } = await import('@/lib/prompts');
        const evalPrompt = EVALUATOR_PROMPT(evalQuery, evalCards);
        const evalResult = await callClaude('claude-haiku-4-5-20251001', evalPrompt);

        try {
          // Strip markdown fences (Haiku often wraps JSON despite being told not to)
          const stripped = evalResult
            .replace(/^```[\w]*\n?/m, '')
            .replace(/\n?```$/m, '')
            .trim();
          // Extract the JSON object in case there is preamble/postamble text
          const jsonMatch = stripped.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : stripped;
          // Parse and validate JSON response
          const parsed = JSON.parse(jsonStr);
          if (!parsed.cards || !Array.isArray(parsed.cards)) {
            throw new Error('Invalid evaluator response shape');
          }

          const resultStr = JSON.stringify(parsed);
          await setCached(evalCacheKey, resultStr);

          return new Response(resultStr, {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
            },
          });
        } catch (parseErr) {
          // JSON parse failed — return null so UI gracefully skips indicators
          console.warn('Evaluator JSON parse failed:', parseErr);
          return new Response(JSON.stringify(null), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch {
      // Not a JSON body or not our format — fall through to CopilotKit
    }
  }

  // CopilotKit runtime handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new AnthropicAdapter({
      model: 'claude-haiku-4-5-20251001',
    }),
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};
