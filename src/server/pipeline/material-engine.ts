import { autoMaterialSchema } from '../../shared/schemas';
import { CTA_FALLBACK } from '../../shared/constants';
import type { AutoMaterial, Direction, LanguageCode } from '../../shared/types';
import { generateStructuredWithLlm } from '../providers/llm';

const fallbackBodies: Record<LanguageCode, string[]> = {
  en: [
    'Your brain can get attached to uncertainty faster than to calm attention.',
    'When warmth comes in tiny doses, waiting starts to feel like chemistry.',
    'That is why confusion can feel deeper than real closeness.'
  ],
  ru: [
    'Мозг легко привязывается не к человеку, а к редким вспышкам внимания.',
    'Когда тепло дают дозами, ожидание начинает казаться сильным чувством.',
    'Поэтому тревога иногда ощущается как любовь.'
  ],
  kk: [
    'Ми кейде адамның өзіне емес, сирек берілетін назарға байланып қалады.',
    'Жылылық аз-аздан келсе, күту сезімі махаббаттай болып көрінеді.',
    'Сондықтан мазасыздықты нағыз сезіммен шатастыру оңай.'
  ],
  de: [
    'Das Gehirn bindet sich oft nicht an den Menschen, sondern an seltene Aufmerksamkeit.',
    'Wenn Warme nur in kleinen Dosen kommt, wirkt Warten schnell wie starke Chemie.',
    'So kann Unruhe leicht wie Liebe klingen.'
  ],
  es: [
    'El cerebro a veces se engancha no a la persona, sino a la atencion intermitente.',
    'Cuando el calor llega a dosis pequenas, la espera parece una emocion enorme.',
    'Por eso la ansiedad puede disfrazarse de amor.'
  ],
  it: [
    'Il cervello a volte si lega non alla persona, ma ai rari momenti di attenzione.',
    'Quando il calore arriva a piccole dosi, l attesa sembra qualcosa di fortissimo.',
    'Per questo l ansia puo sembrare amore.'
  ]
};

const fallbackDescriptions: Record<LanguageCode, string> = {
  en: 'Short YouTube video built for retention and spoken delivery.',
  ru: 'Короткое видео для YouTube Shorts с живой разговорной подачей.',
  kk: 'YouTube Shorts форматына лайык кыска, ауызекі стильдегі видео.',
  de: 'Kurzes YouTube-Short mit naturlicher gesprochener подачи.',
  es: 'Short de YouTube breve con ritmo de voz natural.',
  it: 'Short di YouTube breve con ritmo parlato naturale.'
};

function trimSentence(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildFallbackMaterial(direction: Direction, topic: string, language: LanguageCode, durationSec: number): AutoMaterial {
  const title = topic[0]?.toUpperCase() + topic.slice(1);
  const facts = fallbackBodies[language].map(trimSentence).slice(0, 3);
  const cta = CTA_FALLBACK[language];
  const voiceBody = fallbackBodies[language].slice(0, 2).map(trimSentence);
  const voiceoverText = [...voiceBody, cta].join(' ');

  return {
    topic,
    poster: {
      title,
      facts
    },
    voiceover: {
      text: voiceoverText,
      cta
    },
    onScreenText: facts,
    youtube: {
      title,
      description: fallbackDescriptions[language],
      tags: ['shorts', direction.category, language]
    },
    rules: {
      maxDurationSec: Math.min(30, durationSec),
      ctaOnlyInVoice: true,
      language
    }
  };
}

export async function generateAutoMaterial({
  direction,
  topic,
  language,
  durationSec
}: {
  direction: Direction;
  topic: string;
  language: LanguageCode;
  durationSec: number;
}) {
  const fallback = buildFallbackMaterial(direction, topic, language, durationSec);
  const prompt = [
    'Generate a short YouTube Shorts material in the selected language.',
    `Direction: ${direction.name}`,
    `Direction summary: ${direction.summary}`,
    `Audience: ${direction.audience}`,
    `Language: ${language}`,
    `Topic: ${topic}`,
    `The video must be no longer than ${Math.min(30, durationSec)} seconds.`,
    'Return only valid JSON.',
    'The voiceover must sound natural, human, conversational, and easy to pronounce.',
    'Avoid academic, corporate, robotic, or overly formal wording.',
    'The voiceover must contain a mandatory CTA at the end.',
    'The CTA must only appear in voiceover.cta and the final part of voiceover.text.',
    'The CTA must not appear in poster.title, poster.facts, or onScreenText.',
    'The poster must include a topic title and 2-3 catchy facts from the text.',
    'On-screen text must be short, punchy, and in the selected language.',
    'Do not exceed 45-65 words in voiceover.text.',
    'Use very short sentences that sound good spoken aloud.',
    'Output schema:',
    '{"topic":"...","poster":{"title":"...","facts":["...","...","..."]},"voiceover":{"text":"...","cta":"..."},"onScreenText":["...","...","..."],"youtube":{"title":"...","description":"...","tags":["..."]},"rules":{"maxDurationSec":30,"ctaOnlyInVoice":true,"language":"ru"}}'
  ].join('\n');

  return generateStructuredWithLlm({
    prompt,
    fallback,
    schema: autoMaterialSchema
  });
}
