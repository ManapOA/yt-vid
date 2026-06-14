import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { generateWithOpenAiCompatible } from '../src/server/providers/openai-compatible';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAI-compatible provider', () => {
  it('uses the fallback when the provider returns malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not-json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })));

    const fallback = { value: 'fallback' };
    const result = await generateWithOpenAiCompatible({
      prompt: 'Return JSON',
      fallback,
      schema: z.object({ value: z.string() }),
      config: {
        providerName: 'test',
        apiKey: 'key',
        model: 'model',
        baseUrl: 'https://example.test'
      }
    });

    expect(result).toEqual(fallback);
  });
});
