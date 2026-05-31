import { sentence } from '../utils';

function normalizeSpaces(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const metaPatterns = [
  /\bthis topic\b/gi,
  /\bthis video\b/gi,
  /\bshort lines?\b/gi,
  /\bquick pacing\b/gi,
  /иногда тема/gi,
  /фразы короткие/gi,
  /ритм быстрый/gi,
  /в этом видео/gi,
  /эта тема/gi,
  /\bstyle:?\b/gi,
  /\bbuilt for\b/gi
];

export function stripMetaSpeech(value: string) {
  let next = normalizeSpaces(value);
  for (const pattern of metaPatterns) {
    next = next.replace(pattern, '');
  }
  return normalizeSpaces(next);
}

export function removeDirectTopicMention(value: string, topic: string, localizedTitle?: string) {
  let next = normalizeSpaces(value);
  const candidates = [topic, localizedTitle].map((item) => normalizeSpaces(item || '')).filter(Boolean);

  for (const candidate of candidates) {
    const safe = escapeRegExp(candidate);
    next = next.replace(new RegExp(`"?${safe}"?`, 'gi'), '');
  }

  return normalizeSpaces(next)
    .replace(/^[,.\-:;]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function makeSpeechFriendlyLine(value: string) {
  return sentence(
    stripMetaSpeech(value)
      .replace(/\btherefore\b/gi, 'so')
      .replace(/\bmoreover\b/gi, 'and')
      .replace(/\bin conclusion\b/gi, 'so')
      .replace(/\bоднако\b/gi, 'но')
      .replace(/\bследовательно\b/gi, 'поэтому')
      .replace(/\bв конечном счете\b/gi, 'в итоге')
  );
}

export function formatVoiceoverForSpeech(text: string) {
  return normalizeSpaces(text)
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/,\s*/g, ', ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
