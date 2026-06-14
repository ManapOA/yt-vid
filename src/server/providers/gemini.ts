import { parseStructuredJson } from './json';
import { config } from '../config';
import { repairMojibakeDeep } from '../utils';
import { fetchWithTimeout } from './request';

export async function generateWithGemini<T>({
  prompt,
  fallback,
  schema,
  model,
  apiKey
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
  model: string;
  apiKey: string;
}) {
  if (!apiKey) return repairMojibakeDeep(fallback);

  let response: Response;
  try {
    response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${prompt}\n\nReturn JSON only.` }]
          }
        ],
        generationConfig: {
          temperature: 1
        }
      })
    }, config.llmRequestTimeoutMs);
  } catch (error) {
    console.warn(`[gemini] request failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return repairMojibakeDeep(fallback);
  }

  if (!response.ok) {
    console.warn(`[gemini] ${response.status} ${response.statusText}, using fallback: ${(await response.text()).slice(0, 240)}`);
    return repairMojibakeDeep(fallback);
  }

  try {
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text || '').join('') || '';
    return repairMojibakeDeep(parseStructuredJson(text, schema));
  } catch (error) {
    console.warn(`[gemini] invalid response, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return repairMojibakeDeep(fallback);
  }
}
