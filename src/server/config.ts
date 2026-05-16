import path from 'node:path';
import dotenv from 'dotenv';
import { LANGUAGES } from '../shared/constants';
import type { LanguageCode } from '../shared/types';

dotenv.config();

const root = process.cwd();

export const config = {
  root,
  port: Number(process.env.PORT || 3000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  llmProvider: process.env.LLM_PROVIDER || 'openrouter',
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    appName: process.env.OPENROUTER_APP_NAME || 'yt-vid'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  },
  cartesia: {
    apiKey: process.env.CARTESIA_API_KEY || '',
    model: process.env.CARTESIA_MODEL || 'sonic-3.5',
    version: process.env.CARTESIA_VERSION || '2026-03-01',
    outputContainer: process.env.CARTESIA_OUTPUT_CONTAINER || 'wav',
    outputEncoding: process.env.CARTESIA_OUTPUT_ENCODING || 'pcm_s16le',
    sampleRate: Number(process.env.CARTESIA_SAMPLE_RATE || 44100),
    bitRate: Number(process.env.CARTESIA_BIT_RATE || 128000),
    voices: {
      en: process.env.CARTESIA_VOICE_ID_EN || '',
      ru: process.env.CARTESIA_VOICE_ID_RU || '',
      de: process.env.CARTESIA_VOICE_ID_DE || '',
      es: process.env.CARTESIA_VOICE_ID_ES || '',
      it: process.env.CARTESIA_VOICE_ID_IT || ''
    } satisfies Record<LanguageCode, string>
  },
  defaultLanguages: (process.env.DEFAULT_LANGUAGES || LANGUAGES.map((item) => item.code).join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as LanguageCode[],
  defaultDirection: process.env.DEFAULT_DIRECTION || 'self-awareness',
  defaultDurationSeconds: Number(process.env.DEFAULT_DURATION_SECONDS || 20),
  voiceoverEnabled: process.env.VOICEOVER_ENABLED !== '0',
  musicVolume: Number(process.env.MUSIC_VOLUME || 0.1),
  dataDir: path.join(root, 'data'),
  outputRoot: path.join(root, 'output', 'runs'),
  publicBundleDir: path.join(root, 'public', 'remotion-bundle')
};
