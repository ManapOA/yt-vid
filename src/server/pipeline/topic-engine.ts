import { config } from '../config';
import { generateWithGemini } from '../providers/gemini';
import { generateWithOpenRouter, openRouterSchemas } from '../providers/openrouter';
import { filterDuplicateTopics } from '../storage/topic-history';
import { clamp } from '../utils';
import type { Direction, LanguageCode, TopicGenerationResult } from '../../shared/types';

function buildFallbackTopics(direction: Direction, language: LanguageCode): TopicGenerationResult {
  const base = direction.topicSeeds.flatMap((seed, index) => [
    seed,
    `${seed} in a way that feels fresh this week`,
    `the hidden reason behind ${seed}`
  ]);

  return {
    direction: direction.id,
    language,
    topics: base.slice(0, 12).map((topic, index) => ({
      topic,
      hook: `Start with a sharp hook about ${topic}.`,
      angle: index % 2 === 0 ? 'self-reflection' : 'entertainment',
      audience: direction.audience,
      noveltyScore: clamp(0.92 - index * 0.04, 0.2, 0.98),
      risk: index < 8 ? 'low' : 'medium'
    }))
  };
}

export async function generateTopicCandidates(direction: Direction, language: LanguageCode) {
  const fallback = buildFallbackTopics(direction, language);
  const prompt = [
    `Generate 12 fresh short-form topic candidates for direction "${direction.name}".`,
    `Direction summary: ${direction.summary}`,
    `Audience: ${direction.audience}`,
    `Language: ${language}`,
    'Avoid stale repeats and generic topics.',
    'Return {"direction","language","topics":[{"topic","hook","angle","audience","noveltyScore","risk"}]}.'
  ].join('\n');

  const generated = config.llmProvider === 'gemini'
    ? await generateWithGemini({
      prompt,
      fallback,
      schema: openRouterSchemas.topics,
      model: config.gemini.model,
      apiKey: config.gemini.apiKey
    })
    : await generateWithOpenRouter({
      prompt,
      fallback,
      schema: openRouterSchemas.topics,
      model: config.openrouter.model,
      apiKey: config.openrouter.apiKey,
      baseUrl: config.openrouter.baseUrl,
      siteUrl: config.openrouter.siteUrl,
      appName: config.openrouter.appName
    });

  const dedupedTopics = await filterDuplicateTopics(
    direction.id,
    generated.topics.map((item) => item.topic)
  );

  return {
    ...generated,
    topics: generated.topics.filter((item) => dedupedTopics.includes(item.topic)).slice(0, 12)
  };
}
