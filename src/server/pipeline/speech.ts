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

const russianYoWords = new Map([
  ['еще', 'ещё'],
  ['ее', 'её'],
  ['темной', 'тёмной'],
  ['мертвый', 'мёртвый'],
  ['мертвая', 'мёртвая'],
  ['мертвое', 'мёртвое'],
  ['шел', 'шёл'],
  ['шепот', 'шёпот'],
  ['черный', 'чёрный'],
  ['черная', 'чёрная'],
  ['черное', 'чёрное'],
  ['костер', 'костёр']
]);

function preserveCase(source: string, replacement: string) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return `${replacement[0]?.toUpperCase() || ''}${replacement.slice(1)}`;
  }
  return replacement;
}

function restoreCommonRussianYo(value: string) {
  return value.replace(/[А-Яа-яЁё]+/g, (word) => {
    const replacement = russianYoWords.get(word.toLowerCase());
    return replacement ? preserveCase(word, replacement) : word;
  });
}

function makeHyphenatedRussianWordsSpeakable(value: string) {
  return value
    .replace(/([А-Яа-яЁё]+)\s*-\s*(то|либо|нибудь)/gi, '$1 $2')
    .replace(/(^|[^А-Яа-яЁё])(по)\s*-\s*([А-Яа-яЁё]+)/gi, '$1$2 $3')
    .replace(/(^|[^А-Яа-яЁё])(кое)\s*-\s*([А-Яа-яЁё]+)/gi, '$1$2 $3');
}

function expandRussianAbbreviations(value: string) {
  return value
    .replace(/(^|[^А-Яа-яЁё])т\.?\s*е\.?/gi, '$1то есть')
    .replace(/(^|[^А-Яа-яЁё])т\.?\s*д\.?/gi, '$1так далее')
    .replace(/(^|[^А-Яа-яЁё])т\.?\s*п\.?/gi, '$1тому подобное')
    .replace(/(^|[^А-Яа-яЁё])т\.?\s*к\.?/gi, '$1так как')
    .replace(/(^|[^А-Яа-яЁё])т\.?\s*н\.?/gi, '$1так называемый')
    .replace(/(^|[^А-Яа-яЁё])др\./gi, '$1другие')
    .replace(/(^|[^А-Яа-яЁё])г\.\s*/gi, '$1город ')
    .replace(/(^|[^А-Яа-яЁё])ул\.\s*/gi, '$1улица ')
    .replace(/(^|[^А-Яа-яЁё])д\.\s*/gi, '$1дом ')
    .replace(/(^|[^А-Яа-яЁё])кв\.\s*/gi, '$1квартира ');
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
  return normalizeSpaces(expandRussianAbbreviations(makeHyphenatedRussianWordsSpeakable(restoreCommonRussianYo(text))))
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/,\s*/g, ', ')
    .replace(/[;:]\s*/g, ', ')
    .replace(/[—–]\s*/g, '. ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function formatVoiceoverForDisplay(text: string) {
  return normalizeSpaces(restoreCommonRussianYo(text))
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
