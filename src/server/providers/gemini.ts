import { parseStructuredJson } from './json';

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
  if (!apiKey) return fallback;

  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
    });
  } catch (error) {
    console.warn(`[gemini] request failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }

  if (!response.ok) {
    console.warn(`[gemini] ${response.status} ${response.statusText}, using fallback: ${(await response.text()).slice(0, 240)}`);
    return fallback;
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text || '').join('') || '';

  try {
    return parseStructuredJson(text, schema);
  } catch (error) {
    console.warn(`[gemini] invalid JSON, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}
