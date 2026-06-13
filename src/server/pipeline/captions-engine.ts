import type { AutoMaterial } from '../../shared/types';

function normalizeForComparison(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function removeTrailingCta(text: string, cta: string) {
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const cleanCta = String(cta || '').replace(/\s+/g, ' ').trim();
  if (!cleanCta) return cleanText;

  const exactIndex = cleanText.toLowerCase().lastIndexOf(cleanCta.toLowerCase());
  if (exactIndex >= 0 && normalizeForComparison(cleanText.slice(exactIndex)) === normalizeForComparison(cleanCta)) {
    return cleanText.slice(0, exactIndex).trim();
  }

  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (normalizeForComparison(sentences.at(-1) || '') === normalizeForComparison(cleanCta)) {
    return sentences.slice(0, -1).join(' ').trim();
  }

  return cleanText;
}

export function buildOnScreenTextPayload(material: AutoMaterial) {
  const body = removeTrailingCta(material.voiceover.text, material.voiceover.cta);
  return body
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
