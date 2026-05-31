import type { AutoMaterial, LanguageCode } from '../../shared/types';
import { generateStructuredWithLlm } from '../providers/llm';
import { autoMaterialSchema } from '../../shared/schemas';

const MIN_WORDS = 45;
const MAX_WORDS = 65;
const MAX_DURATION_SEC = 30;

const ctaMarkersByLanguage: Record<LanguageCode, string[]> = {
  en: ['save this', 'follow for more', 'come back to this'],
  ru: ['сохрани', 'подпишись', 'вернись к этому'],
  kk: ['сактап', 'жазылып', 'кейін қайта'],
  de: ['speicher', 'folge', 'komm darauf zuruck'],
  es: ['guarda', 'sigueme', 'vuelve a esto'],
  it: ['salva', 'seguimi', 'torna a questo']
};

function normalize(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value: string) {
  return normalize(value).split(' ').filter(Boolean).length;
}

function containsCtaLikePhrase(value: string, language: LanguageCode) {
  const text = normalize(value);
  return ctaMarkersByLanguage[language].some((marker) => text.includes(marker));
}

function detectLanguageMatch(value: string, language: LanguageCode) {
  const text = String(value || '').trim();
  if (!text) return true;

  if (language === 'ru') {
    return /[А-Яа-яЁё]/.test(text);
  }

  if (language === 'kk') {
    return /[ӘәҒғҚқҢңӨөҰұҮүІі]/.test(text) || /[А-Яа-яЁё]/.test(text);
  }

  if (language === 'en') {
    return /^[\x00-\x7F\s"'!?.,:;()/\-]+$/.test(text);
  }

  return true;
}

function shortenTextFallback(text: string, cta: string) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  const normalizedCta = String(cta || '').replace(/\s+/g, ' ').trim();
  const parts = compact
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const body = parts.filter((part) => normalize(part) !== normalize(normalizedCta));
  const picked: string[] = [];

  for (const part of body) {
    picked.push(part);
    if (countWords([...picked, normalizedCta].join(' ')) >= MIN_WORDS) break;
  }

  const shortened = [...picked, normalizedCta].join(' ').trim();
  if (countWords(shortened) <= MAX_WORDS) return shortened;

  const words = shortened.split(/\s+/).slice(0, MAX_WORDS - countWords(normalizedCta));
  return `${words.join(' ')} ${normalizedCta}`.trim();
}

export function shortenVoiceoverText(text: string, cta: string, targetWords = MAX_WORDS) {
  const normalizedCta = String(cta || '').replace(/\s+/g, ' ').trim();
  const shortened = shortenTextFallback(text, normalizedCta);
  const ctaWordCount = countWords(normalizedCta);
  const words = shortened.split(/\s+/).filter(Boolean).slice(0, Math.max(1, targetWords - ctaWordCount));
  const merged = `${words.join(' ')} ${normalizedCta}`.trim();
  return normalize(merged).endsWith(normalize(normalizedCta)) ? merged : `${merged} ${normalizedCta}`.trim();
}

async function shortenWithLlm(material: AutoMaterial) {
  const fallback = {
    ...material,
    voiceover: {
      ...material.voiceover,
      text: shortenVoiceoverText(material.voiceover.text, material.voiceover.cta)
    }
  };

  const prompt = [
    `Shorten this voiceover in ${material.rules.language}.`,
    'Keep it natural and spoken.',
    `Keep the CTA unchanged at the end: ${material.voiceover.cta}`,
    'Keep total voiceover length between 45 and 65 words.',
    'Return the full original JSON schema with only the voiceover.text adjusted if needed.',
    JSON.stringify(material)
  ].join('\n');

  return generateStructuredWithLlm({
    prompt,
    fallback,
    schema: autoMaterialSchema
  });
}

export type AutoMaterialValidationResult = {
  material: AutoMaterial;
  estimatedDurationSec: number;
};

function estimateDurationSec(text: string) {
  return Math.ceil((countWords(text) / 2.2) * 10) / 10;
}

export async function validateAutoMaterial(material: AutoMaterial) {
  let current = {
    ...material,
    poster: {
      ...material.poster,
      facts: material.poster.facts.slice(0, 3)
    },
    onScreenText: material.onScreenText.slice(0, 3)
  };

  if (!current.voiceover.text.trim()) throw new Error('Auto material validation failed: voiceover.text is required.');
  if (!current.voiceover.cta.trim()) throw new Error('Auto material validation failed: voiceover.cta is required.');
  if (!current.poster.title.trim()) throw new Error('Auto material validation failed: poster.title is required.');
  if (current.poster.facts.length < 2 || current.poster.facts.length > 3) {
    throw new Error('Auto material validation failed: poster.facts must contain 2-3 items.');
  }

  if (countWords(current.voiceover.text) > MAX_WORDS || estimateDurationSec(current.voiceover.text) > MAX_DURATION_SEC) {
    current = await shortenWithLlm(current);
  }

  const normalizedVoiceover = normalize(current.voiceover.text);
  const normalizedCta = normalize(current.voiceover.cta);
  if (!normalizedVoiceover.includes(normalizedCta)) {
    current = {
      ...current,
      voiceover: {
        ...current.voiceover,
        text: `${current.voiceover.text.replace(/\s+$/, '')} ${current.voiceover.cta}`.trim()
      }
    };
  }

  if (!normalize(current.voiceover.text).endsWith(normalizedCta)) {
    current = {
      ...current,
      voiceover: {
        ...current.voiceover,
        text: shortenVoiceoverText(current.voiceover.text, current.voiceover.cta)
      }
    };
  }

  for (const item of [...current.onScreenText, current.poster.title, ...current.poster.facts]) {
    if (containsCtaLikePhrase(item, current.rules.language)) {
      throw new Error('Auto material validation failed: CTA must not appear in poster or on-screen text.');
    }
  }

  const languageSamples = [
    current.poster.title,
    current.voiceover.text,
    current.onScreenText.join(' ')
  ];
  if (!languageSamples.every((value) => detectLanguageMatch(value, current.rules.language))) {
    throw new Error('Auto material validation failed: generated text does not match the selected language.');
  }

  if (current.rules.maxDurationSec > MAX_DURATION_SEC) {
    current = {
      ...current,
      rules: {
        ...current.rules,
        maxDurationSec: MAX_DURATION_SEC
      }
    };
  }

  const wordCount = countWords(current.voiceover.text);
  if (wordCount > MAX_WORDS) {
    current = {
      ...current,
      voiceover: {
        ...current.voiceover,
        text: shortenVoiceoverText(current.voiceover.text, current.voiceover.cta)
      }
    };
  }

  return {
    material: current,
    estimatedDurationSec: estimateDurationSec(current.voiceover.text)
  } satisfies AutoMaterialValidationResult;
}
