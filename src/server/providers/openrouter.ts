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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': appName
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
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

  if (!response.ok) {
    return fallback;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return fallback;

  try {
    return parseStructuredJson(content, schema);
  } catch {
    return fallback;
  }
}

export const openRouterSchemas = {
  topics: topicGenerationSchema,
  script: scriptSchema
};
