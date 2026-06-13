import { config } from '../config';
import { generateWithCerebras } from './cerebras';
import { generateWithGemini } from './gemini';
import { generateWithOpenRouter } from './openrouter';

export async function generateStructuredWithLlm<T>({
  prompt,
  fallback,
  schema
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
}) {
  if (config.llmProvider === 'cerebras') {
    return generateWithCerebras({
      prompt,
      fallback,
      schema,
      model: config.cerebras.model,
      apiKey: config.cerebras.apiKey,
      baseUrl: config.cerebras.baseUrl
    });
  }

  if (config.llmProvider === 'gemini') {
    return generateWithGemini({
      prompt,
      fallback,
      schema,
      model: config.gemini.model,
      apiKey: config.gemini.apiKey
    });
  }

  return generateWithOpenRouter({
    prompt,
    fallback,
    schema,
    model: config.openrouter.model,
    apiKey: config.openrouter.apiKey,
    baseUrl: config.openrouter.baseUrl,
    siteUrl: config.openrouter.siteUrl,
    appName: config.openrouter.appName
  });
}
