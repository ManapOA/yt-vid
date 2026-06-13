import { topicGenerationSchema, scriptSchema } from '../../shared/schemas';
import { generateWithOpenAiCompatible } from './openai-compatible';

export async function generateWithOpenRouter<T>({
  prompt,
  fallback,
  schema,
  model,
  apiKey,
  baseUrl,
  siteUrl,
  appName
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
  model: string;
  apiKey: string;
  baseUrl: string;
  siteUrl: string;
  appName: string;
}) {
  return generateWithOpenAiCompatible({
    prompt,
    fallback,
    schema,
    config: {
      providerName: 'openrouter',
      apiKey,
      model,
      baseUrl,
      siteUrl,
      appName,
      maxCompletionTokens: 1800
    }
  });
}

export const openRouterSchemas = {
  topics: topicGenerationSchema,
  script: scriptSchema
};
