export function extractJsonCandidate(value: string) {
  const text = String(value || '').trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

export function parseStructuredJson<T>(value: string, schema: { parse: (value: unknown) => T }) {
  const candidate = extractJsonCandidate(value);
  if (!candidate) {
    throw new Error('No JSON candidate found');
  }
  return schema.parse(JSON.parse(candidate));
}
