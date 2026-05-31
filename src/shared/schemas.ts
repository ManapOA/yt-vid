import { z } from 'zod';

export const languageCodeSchema = z.enum(['en', 'ru', 'de', 'es', 'it', 'kk']);
export const autoDirectionSchema = z.enum(['psychology', 'relationships', 'zodiac', 'mindset', 'numerology', 'random']);

export const topicCandidateSchema = z.object({
  topic: z.string().min(3),
  hook: z.string().min(3),
  angle: z.string().min(3),
  audience: z.string().min(3),
  noveltyScore: z.number().min(0).max(1),
  risk: z.enum(['low', 'medium', 'high'])
});

export const topicGenerationSchema = z.object({
  direction: z.string().min(1),
  language: languageCodeSchema,
  topics: z.array(topicCandidateSchema).min(1)
});

export const scriptSchema = z.object({
  language: languageCodeSchema,
  direction: z.string().min(1),
  topic: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  hook: z.string().min(1),
  body: z.array(z.string().min(1)).min(2),
  cta: z.string().min(1),
  voiceoverText: z.string().min(1),
  onScreenText: z.array(z.string().min(1)).min(2),
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1)
});

export const autoMaterialSchema = z.object({
  topic: z.string().min(3),
  poster: z.object({
    title: z.string().min(3),
    facts: z.array(z.string().min(3)).min(2).max(3)
  }),
  voiceover: z.object({
    text: z.string().min(10),
    cta: z.string().min(3)
  }),
  onScreenText: z.array(z.string().min(2)).min(2).max(4),
  youtube: z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    tags: z.array(z.string().min(2)).min(1)
  }),
  rules: z.object({
    maxDurationSec: z.number().int().positive().max(30),
    ctaOnlyInVoice: z.literal(true),
    language: languageCodeSchema
  })
});

export const autoVideoRequestSchema = z.object({
  direction: autoDirectionSchema,
  language: languageCodeSchema,
  count: z.number().int().positive().max(1).optional(),
  voiceover: z.boolean().default(true),
  durationSec: z.number().int().positive().max(30).default(30)
});
