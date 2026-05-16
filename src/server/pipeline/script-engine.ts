import { config } from '../config';
import { CTA_FALLBACK } from '../../shared/constants';
import { generateWithGemini } from '../providers/gemini';
import { generateWithOpenRouter, openRouterSchemas } from '../providers/openrouter';
import type { Direction, LanguageCode, ScriptPackage } from '../../shared/types';

function fallbackScript(direction: Direction, topic: string, language: LanguageCode, durationSeconds: number): ScriptPackage {
  const cta = CTA_FALLBACK[language];
  const hook = language === 'ru'
    ? `Иногда тема "${topic}" цепляет сильнее, чем кажется сначала.`
    : `Sometimes "${topic}" hits harder than it looks at first.`;
  const body = language === 'ru'
    ? [
      'Сначала это выглядит как мелочь, но именно такие детали зритель узнает в себе.',
      'Фраза короткая, ритм быстрый, смысл держится на одном ясном наблюдении.'
    ]
    : [
      'It starts like a small observation, then turns into something instantly recognizable.',
      'Short lines, quick pacing, and one emotional detail keep the Short moving.'
    ];

  return {
    language,
    direction: direction.id,
    topic,
    durationSeconds,
    hook,
    body,
    cta,
    voiceoverText: `${hook} ${body.join(' ')} ${cta}`,
    onScreenText: [hook, ...body],
    title: topic[0].toUpperCase() + topic.slice(1),
    description: `${topic}. Built for ${direction.name}.`,
    tags: ['shorts', direction.category, language, 'yt-vid']
  };
}

export async function generateScript(direction: Direction, topic: string, language: LanguageCode, durationSeconds: number) {
  const fallback = fallbackScript(direction, topic, language, durationSeconds);
  const prompt = [
    `Create a native short-form script for a YouTube Short.`,
    `Direction: ${direction.name}`,
    `Topic: ${topic}`,
    `Language: ${language}`,
    `Duration seconds: ${durationSeconds}`,
    'Style: natural, short phrases, entertainment + self-reflection, no AI-generic tone.',
    'Return {"language","direction","topic","durationSeconds","hook","body","cta","voiceoverText","onScreenText","title","description","tags"}.'
  ].join('\n');

  return config.llmProvider === 'gemini'
    ? generateWithGemini({
      prompt,
      fallback,
      schema: openRouterSchemas.script,
      model: config.gemini.model,
      apiKey: config.gemini.apiKey
    })
    : generateWithOpenRouter({
      prompt,
      fallback,
      schema: openRouterSchemas.script,
      model: config.openrouter.model,
      apiKey: config.openrouter.apiKey,
      baseUrl: config.openrouter.baseUrl,
      siteUrl: config.openrouter.siteUrl,
      appName: config.openrouter.appName
    });
}
