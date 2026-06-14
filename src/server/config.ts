import path from 'node:path';
import dotenv from 'dotenv';
import type { LanguageCode, TextProviderId } from '../shared/types';

dotenv.config();

const root = process.cwd();

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function textProvider(value: string | undefined): TextProviderId {
  return value === 'gemini' || value === 'openrouter' ? value : 'cerebras';
}

export const config = {
  root,
  host: process.env.HOST || '127.0.0.1',
  port: positiveNumber(process.env.PORT, 3000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  llmProvider: textProvider(process.env.LLM_PROVIDER),
  llmRequestTimeoutMs: positiveNumber(process.env.LLM_REQUEST_TIMEOUT_MS, 45000),
  ttsRequestTimeoutMs: positiveNumber(process.env.TTS_REQUEST_TIMEOUT_MS, 60000),
  cerebras: {
    apiKey: process.env.CEREBRAS_API_KEY || '',
    model: process.env.CONTENT_MODEL || process.env.CEREBRAS_MODEL || 'gpt-oss-120b',
    baseUrl: process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1'
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'moonshotai/kimi-k2.6:free',
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
    sampleRate: positiveNumber(process.env.CARTESIA_SAMPLE_RATE, 44100),
    bitRate: positiveNumber(process.env.CARTESIA_BIT_RATE, 128000),
    voices: {
      en: process.env.CARTESIA_VOICE_ID_EN || '',
      ru: process.env.CARTESIA_VOICE_ID_RU || '',
      kk: process.env.CARTESIA_VOICE_ID_KK || '',
      de: process.env.CARTESIA_VOICE_ID_DE || '',
      es: process.env.CARTESIA_VOICE_ID_ES || '',
      it: process.env.CARTESIA_VOICE_ID_IT || ''
    } satisfies Record<LanguageCode, string>
  },
  musicVolume: boundedNumber(process.env.MUSIC_VOLUME, 0.1, 0, 1),
  dataDir: path.join(root, 'data'),
  outputRoot: path.join(root, 'output', 'runs'),
  videoExportDir: path.resolve(root, process.env.VIDEO_EXPORT_DIR || path.join('Video', 'Youtube')),
  musicDir: path.join(root, 'music')
};
