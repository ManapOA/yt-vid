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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
        temperature: 0.9
      }
    })
  });

  if (!response.ok) return fallback;
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text || '').join('') || '';

  try {
    return schema.parse(JSON.parse(text));
  } catch {
    return fallback;
  }
}
