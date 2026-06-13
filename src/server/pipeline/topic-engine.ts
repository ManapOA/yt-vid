import { generateWithCerebras, cerebrasSchemas } from '../providers/cerebras';
import { generateWithGemini } from '../providers/gemini';
import { generateWithOpenRouter, openRouterSchemas } from '../providers/openrouter';
import { resolveTextSettings } from '../providers/text-settings';
import { filterDuplicateTopics, getTopicHistory } from '../storage/topic-history';
import { clamp } from '../utils';
import type { Direction, LanguageCode, TextGenerationSettings, TopicGenerationResult } from '../../shared/types';

const generatedTopicMemory = new Map<string, Set<string>>();

function normalizeTopic(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildFallbackTopics(direction: Direction, language: LanguageCode, recentlyUsed: string[]): TopicGenerationResult {
  const used = new Set(recentlyUsed.map(normalizeTopic));
  const now = new Date();
  const context = [
    'right before sleep',
    'after a dry reply',
    'when the chat suddenly gets quiet',
    'during a life reset',
    'after someone acts normal but feels distant',
    'when old patterns come back',
    'after a small tone shift',
    'when nobody says the real reason out loud'
  ];
  const lenses = [
    'the tiny sign that',
    'why it feels strange when',
    'the hidden pattern behind',
    'what people misunderstand about',
    'the quiet moment before',
    'why your brain replays',
    'the reason it hits harder when',
    'what changes when'
  ];
  const endings = [
    'but nobody talks about it',
    'and it changes the whole mood',
    'even when everything looks fine',
    'before anyone admits what happened',
    'when emotions are already overloaded',
    'and the reaction says more than the words',
    'without making it look dramatic',
    `in ${now.toLocaleString('en-US', { month: 'long' })}`
  ];

  const generatedPool = direction.topicSeeds.flatMap((seed) => {
    const cleanSeed = seed.replace(/^why\s+/i, '').replace(/^the\s+/i, '');
    return [
      seed,
      `${lenses[Math.floor(Math.random() * lenses.length)]} ${cleanSeed}`,
      `${cleanSeed} ${endings[Math.floor(Math.random() * endings.length)]}`,
      `${lenses[Math.floor(Math.random() * lenses.length)]} ${cleanSeed} ${context[Math.floor(Math.random() * context.length)]}`,
      `${cleanSeed}: the part people notice too late`
    ];
  });

  const base = shuffle(generatedPool)
    .filter((topic, index, topics) => topics.findIndex((item) => normalizeTopic(item) === normalizeTopic(topic)) === index)
    .filter((topic) => !used.has(normalizeTopic(topic)))
    .slice(0, 12);

  const topics = base.length >= 6
    ? base
    : shuffle([...base, ...generatedPool.map((topic) => `${topic} (${Math.floor(100 + Math.random() * 900)})`)]).slice(0, 12);

  const localizedHooks: Record<LanguageCode, (topic: string) => string> = {
    en: (topic) => `A short emotional angle about ${topic}.`,
    ru: (topic) => `Короткий эмоциональный заход про ${topic}.`,
    kk: (topic) => `${topic} туралы қысқа эмоциялық заход.`,
    de: (topic) => `Ein kurzer emotionaler Einstieg zu ${topic}.`,
    es: (topic) => `Un gancho emocional corto sobre ${topic}.`,
    it: (topic) => `Un aggancio emotivo breve su ${topic}.`
  };

  return {
    direction: direction.id,
    language,
    topics: topics.map((topic, index) => ({
      topic,
      hook: localizedHooks[language](topic),
      angle: index % 2 === 0 ? 'self-reflection' : 'entertainment',
      audience: direction.audience,
      noveltyScore: clamp(0.92 - index * 0.04, 0.2, 0.98),
      risk: index < 8 ? 'low' : 'medium'
    }))
  };
}

export async function generateTopicCandidates(direction: Direction, language: LanguageCode, textSettings?: TextGenerationSettings) {
  const resolvedTextSettings = resolveTextSettings(textSettings);
  const memoryKey = `${direction.id}:${language}`;
  const sessionTopics = generatedTopicMemory.get(memoryKey) || new Set<string>();
  const recentHistory = (await getTopicHistory())
    .filter((entry) => entry.directionId === direction.id)
    .slice(0, 50)
    .map((entry) => entry.topic);
  const fallback = buildFallbackTopics(direction, language, [
    ...recentHistory,
    ...sessionTopics
  ]);
  const requestNonce = `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
  const prompt = [
    `Generate 12 fresh short-form topic candidates for direction "${direction.name}".`,
    `Direction summary: ${direction.summary}`,
    `Audience: ${direction.audience}`,
    `Language: ${language}`,
    `Freshness nonce: ${requestNonce}`,
    `Do not reuse or lightly reword these recent topics: ${recentHistory.slice(0, 25).join(' | ') || 'none'}.`,
    'Make every request feel new. Avoid returning the default seed phrases.',
    'Avoid stale repeats and generic topics.',
    'noveltyScore must be a decimal from 0 to 1, for example 0.87. Do not use 87 or percentages.',
    'Return {"direction","language","topics":[{"topic","hook","angle","audience","noveltyScore","risk"}]}.'
  ].join('\n');

  const generated = resolvedTextSettings.provider === 'cerebras'
    ? await generateWithCerebras({
      prompt,
      fallback,
      schema: cerebrasSchemas.topics,
      model: resolvedTextSettings.cerebras.model,
      apiKey: resolvedTextSettings.cerebras.apiKey,
      baseUrl: resolvedTextSettings.cerebras.baseUrl
    })
    : resolvedTextSettings.provider === 'gemini'
    ? await generateWithGemini({
      prompt,
      fallback,
      schema: openRouterSchemas.topics,
      model: resolvedTextSettings.gemini.model,
      apiKey: resolvedTextSettings.gemini.apiKey
    })
    : await generateWithOpenRouter({
      prompt,
      fallback,
      schema: openRouterSchemas.topics,
      model: resolvedTextSettings.openrouter.model,
      apiKey: resolvedTextSettings.openrouter.apiKey,
      baseUrl: resolvedTextSettings.openrouter.baseUrl,
      siteUrl: resolvedTextSettings.openrouter.siteUrl,
      appName: resolvedTextSettings.openrouter.appName
    });

  const dedupedTopics = await filterDuplicateTopics(
    direction.id,
    generated.topics.map((item) => item.topic)
  );
  const freshTopics = generated.topics
    .filter((item) => dedupedTopics.includes(item.topic))
    .filter((item) => !sessionTopics.has(normalizeTopic(item.topic)))
    .slice(0, 12);

  for (const topic of freshTopics) {
    sessionTopics.add(normalizeTopic(topic.topic));
  }
  if (sessionTopics.size > 200) {
    generatedTopicMemory.set(memoryKey, new Set([...sessionTopics].slice(-120)));
  } else {
    generatedTopicMemory.set(memoryKey, sessionTopics);
  }

  return {
    ...generated,
    topics: freshTopics.length > 0 ? freshTopics : fallback.topics
  };
}
