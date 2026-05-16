import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';

const musicPattern = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

function createAmbientWav(seconds = 20, sampleRate = 44100) {
  const sampleCount = seconds * sampleRate;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const signal =
      Math.sin(time * Math.PI * 2 * 220) * 0.04 +
      Math.sin(time * Math.PI * 2 * 329.63) * 0.025 +
      Math.sin(time * Math.PI * 2 * 440) * 0.012;
    const envelope = Math.min(1, i / (sampleRate * 1.6), (sampleCount - i) / (sampleRate * 1.6));
    const sample = Math.max(-1, Math.min(1, signal * envelope));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}

async function getAudioFiles(folder: string) {
  try {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && musicPattern.test(entry.name))
      .map((entry) => path.join(folder, entry.name));
  } catch {
    return [];
  }
}

export async function ensureBackgroundMusic(directionCategory: string, runDir: string) {
  const category = directionCategory.toLowerCase();
  const musicDir = config.musicDir;
  const categoryDirs = [
    category.includes('astro') ? path.join(musicDir, 'astrology') : null,
    category.includes('psych') || category.includes('relationship') || category.includes('mindset') ? path.join(musicDir, 'psychology') : null,
    category.includes('numero') ? path.join(musicDir, 'numerology') : null,
    musicDir
  ].filter(Boolean) as string[];

  for (const folder of categoryDirs) {
    const files = await getAudioFiles(folder);
    if (files.length > 0) {
      const pick = files.sort()[0];
      const output = path.join(runDir, `music${path.extname(pick) || '.wav'}`);
      await fs.copyFile(pick, output);
      return output;
    }
  }

  const generated = path.join(runDir, 'music.wav');
  await fs.writeFile(generated, createAmbientWav(20));
  return generated;
}
