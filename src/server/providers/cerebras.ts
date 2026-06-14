import { autoMaterialSchema, topicGenerationSchema } from '../../shared/schemas';
import { generatePlainWithOpenAiCompatible, generateWithOpenAiCompatible } from './openai-compatible';

const languageEnum = ['en', 'ru', 'de', 'es', 'it', 'kk'];

const topicResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'topic_generation',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['direction', 'language', 'topics'],
      properties: {
        direction: { type: 'string' },
        language: { type: 'string', enum: languageEnum },
        topics: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['topic', 'hook', 'angle', 'audience', 'noveltyScore', 'risk'],
            properties: {
              topic: { type: 'string' },
              hook: { type: 'string' },
              angle: { type: 'string' },
              audience: { type: 'string' },
              noveltyScore: { type: 'number' },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        }
      }
    }
  }
};

const autoMaterialResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'auto_video_material',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['topic', 'poster', 'voiceover', 'onScreenText', 'youtube', 'rules'],
      properties: {
        topic: { type: 'string' },
        poster: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'facts'],
          properties: {
            title: { type: 'string' },
            facts: { type: 'array', items: { type: 'string' } }
          }
        },
        voiceover: {
          type: 'object',
          additionalProperties: false,
          required: ['text', 'cta'],
          properties: {
            text: { type: 'string' },
            cta: { type: 'string' }
          }
        },
        onScreenText: { type: 'array', items: { type: 'string' } },
        youtube: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description', 'tags'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        rules: {
          type: 'object',
          additionalProperties: false,
          required: ['maxDurationSec', 'ctaOnlyInVoice', 'language'],
          properties: {
            maxDurationSec: { type: 'integer' },
            ctaOnlyInVoice: { type: 'boolean' },
            language: { type: 'string', enum: languageEnum }
          }
        }
      }
    }
  }
};

function getResponseFormat(schema: { parse: (value: unknown) => unknown }) {
  if (schema === topicGenerationSchema) return topicResponseFormat;
  if (schema === autoMaterialSchema) return autoMaterialResponseFormat;
  return undefined;
}

export async function generateWithCerebras<T>({
  prompt,
  fallback,
  schema,
  model,
  apiKey,
  baseUrl
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
  model: string;
  apiKey: string;
  baseUrl: string;
}) {
  return generateWithOpenAiCompatible({
    prompt,
    fallback,
    schema,
    config: {
      providerName: 'cerebras',
      apiKey,
      model,
      baseUrl,
      maxCompletionTokens: 1800,
      responseFormat: getResponseFormat(schema)
    }
  });
}

export async function generatePlainWithCerebras({
  prompt,
  fallback,
  model,
  apiKey,
  baseUrl,
  temperature,
  maxCompletionTokens
}: {
  prompt: string;
  fallback: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature?: number;
  maxCompletionTokens?: number;
}) {
  return generatePlainWithOpenAiCompatible({
    prompt,
    fallback,
    temperature,
    maxCompletionTokens,
    config: {
      providerName: 'cerebras',
      apiKey,
      model,
      baseUrl
    }
  });
}

export const cerebrasSchemas = {
  topics: topicGenerationSchema
};
