import { autoMaterialSchema } from '../../shared/schemas';
import { CTA_FALLBACK } from '../../shared/constants';
import type { AutoMaterial, Direction, LanguageCode } from '../../shared/types';
import { generateStructuredWithLlm } from '../providers/llm';

const fallbackBodies: Record<LanguageCode, string[]> = {
  en: [
    'Mixed signals can feel addictive for one uncomfortable reason.',
    'Your brain keeps waiting for the next small reward.',
    'That uncertainty creates intensity, but intensity is not closeness.'
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
    'Wenn Wärme nur in kleinen Dosen kommt, wirkt Warten schnell wie starke Chemie.',
    'So kann Unruhe leicht wie Liebe klingen.'
  ],
  es: [
    'El cerebro a veces se engancha no a la persona, sino a la atención intermitente.',
    'Cuando el afecto llega en dosis pequeñas, la espera parece una emoción enorme.',
    'Por eso la ansiedad puede disfrazarse de amor.'
  ],
  it: [
    'Il cervello a volte si lega non alla persona, ma ai rari momenti di attenzione.',
    'Quando il calore arriva a piccole dosi, l’attesa sembra qualcosa di fortissimo.',
    'Per questo l’ansia può sembrare amore.'
  ]
};

const fallbackDescriptions: Record<LanguageCode, string> = {
  en: 'Short YouTube video built for retention and spoken delivery.',
  ru: 'Короткое видео для YouTube Shorts с живой разговорной подачей.',
  kk: 'YouTube Shorts форматына лайық қысқа, ауызекі стильдегі видео.',
  de: 'Kurzes YouTube-Short mit natürlicher gesprochener Sprache.',
  es: 'Short de YouTube breve con ritmo de voz natural.',
  it: 'Short di YouTube breve con ritmo parlato naturale.'
};

const fallbackTitles: Record<LanguageCode, string> = {
  en: 'Why Mixed Signals Can Feel More Addictive Than Love',
  ru: '\u041f\u043e\u0447\u0435\u043c\u0443 \u0440\u0435\u0434\u043a\u043e\u0435 \u0432\u043d\u0438\u043c\u0430\u043d\u0438\u0435 \u0432\u044b\u0437\u044b\u0432\u0430\u0435\u0442 \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u044c',
  kk: '\u041d\u0435\u0433\u0435 \u0441\u0438\u0440\u0435\u043a \u043d\u0430\u0437\u0430\u0440 \u0442\u04d9\u0443\u0435\u043b\u0434\u0456\u043b\u0456\u043a \u0442\u0443\u0434\u044b\u0440\u0430\u0434\u044b',
  de: 'Warum gemischte Signale stärker als Nähe wirken',
  es: 'Por qué las señales mixtas pueden crear adicción',
  it: 'Perché i segnali contrastanti possono creare dipendenza'
};

const fallbackCaptions: Record<LanguageCode, string[]> = {
  en: ['Mixed signals feel addictive', 'Your brain waits for a reward', 'Intensity is not closeness'],
  ru: ['\u0420\u0435\u0434\u043a\u043e\u0435 \u0432\u043d\u0438\u043c\u0430\u043d\u0438\u0435 \u0446\u0435\u043f\u043b\u044f\u0435\u0442', '\u041c\u043e\u0437\u0433 \u0436\u0434\u0451\u0442 \u043d\u043e\u0432\u0443\u044e \u043d\u0430\u0433\u0440\u0430\u0434\u0443', '\u0422\u0440\u0435\u0432\u043e\u0433\u0430 \u043d\u0435 \u0440\u0430\u0432\u043d\u0430 \u043b\u044e\u0431\u0432\u0438'],
  kk: ['\u0421\u0438\u0440\u0435\u043a \u043d\u0430\u0437\u0430\u0440 \u0431\u0430\u0439\u043b\u0430\u043f \u049b\u043e\u044f\u0434\u044b', '\u041c\u0438 \u0436\u0430\u04a3\u0430 \u0441\u044b\u0439\u0430\u049b\u044b\u043d\u044b \u043a\u04af\u0442\u0435\u0434\u0456', '\u041c\u0430\u0437\u0430\u0441\u044b\u0437\u0434\u044b\u049b \u043c\u0430\u0445\u0430\u0431\u0431\u0430\u0442 \u0435\u043c\u0435\u0441'],
  de: ['Gemischte Signale fesseln', 'Das Gehirn wartet auf Belohnung', 'Intensität ist keine Nähe'],
  es: ['Las señales mixtas enganchan', 'El cerebro espera otra recompensa', 'La intensidad no es cercanía'],
  it: ['I segnali contrastanti agganciano', 'Il cervello aspetta una ricompensa', 'L’intensità non è vicinanza']
};

function trimSentence(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildFallbackMaterial(direction: Direction, topic: string, language: LanguageCode, durationSec: number): AutoMaterial {
  const title = fallbackTitles[language];
  const facts = fallbackBodies[language].map(trimSentence).slice(0, 3);
  const cta = CTA_FALLBACK[language];
  const voiceBody = fallbackBodies[language].map(trimSentence);
  const voiceoverText = [...voiceBody, cta].join(' ');

  return {
    topic: title,
    poster: {
      title,
      facts
    },
    voiceover: {
      text: voiceoverText,
      cta
    },
    onScreenText: fallbackCaptions[language],
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
    'Build the voiceover as: immediate hook, two escalating beats, one clear payoff, then CTA.',
    'The first sentence must create tension, contradiction, consequence, or recognition within 6-16 words.',
    'Cover exactly one useful idea. Every sentence must advance it.',
    'Avoid academic, corporate, robotic, or overly formal wording.',
    'Avoid vague abstractions unless they are tied to a concrete behavior or situation.',
    'The voiceover must contain a mandatory CTA at the end.',
    'The CTA must be contextual and no longer than 14 words. Prefer save/return intent over generic advertising.',
    'Never use generic commands such as "subscribe now", "learn more", "like and subscribe", or their translations.',
    'The CTA must only appear in voiceover.cta and the final part of voiceover.text.',
    'The CTA must not appear in poster.title, poster.facts, or onScreenText.',
    'The poster must include a specific curiosity-driven title and 2-3 concrete facts from the text.',
    'The YouTube title must promise the exact insight delivered. Never include duration, format, or production notes.',
    'Avoid generic title words such as "pattern" unless paired with a specific behavior and consequence.',
    'Return 3-4 on-screen phrases. Each phrase must contain 3-9 words and must not copy a full voiceover sentence.',
    'Keep voiceover.text between 38 and 60 words including CTA.',
    'Keep every spoken sentence under 22 words.',
    'Use correct native grammar and natural idioms for the selected language.',
    'Output schema:',
    '{"topic":"...","poster":{"title":"...","facts":["...","...","..."]},"voiceover":{"text":"...","cta":"..."},"onScreenText":["...","...","..."],"youtube":{"title":"...","description":"...","tags":["..."]},"rules":{"maxDurationSec":30,"ctaOnlyInVoice":true,"language":"ru"}}'
  ].join('\n');

  return generateStructuredWithLlm({
    prompt,
    fallback,
    schema: autoMaterialSchema
  });
}
