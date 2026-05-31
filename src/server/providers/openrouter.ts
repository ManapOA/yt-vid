import { topicGenerationSchema, scriptSchema } from '../../shared/schemas';
import { parseStructuredJson } from './json';

export async function generateWithOpenRouter<T>({
  prompt,
  fallback,
  schema,
  model,
  apiKey,
  baseUrl,
  siteUrl,
  appName
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
  model: string;
  apiKey: string;
  baseUrl: string;
  siteUrl: string;
  appName: string;
}) {
  if (!apiKey) return fallback;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': appName
      },
      body: JSON.stringify({
        model,
        temperature: 1,
        messages: [
          {
            role: 'system',
            content: 'Return JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
  } catch (error) {
    console.warn(`[openrouter] request failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }

  if (!response.ok) {
    console.warn(`[openrouter] ${response.status} ${response.statusText}, using fallback: ${(await response.text()).slice(0, 240)}`);
    return fallback;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    console.warn('[openrouter] empty response content, using fallback');
    return fallback;
  }

  try {
    return parseStructuredJson(content, schema);
  } catch (error) {
    console.warn(`[openrouter] invalid JSON, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

export const openRouterSchemas = {
  topics: topicGenerationSchema,
  script: scriptSchema
};
