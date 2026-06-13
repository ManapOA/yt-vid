import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { config } from '../src/server/config';
import type { AutoMaterial } from '../src/shared/types';
import { createSafeFolderName, createUploadTxt, exportYoutubePackage } from '../src/server/pipeline/video-exporter';

const originalExportDir = config.videoExportDir;
let tempDir = '';

const material: AutoMaterial = {
  topic: 'Why silence feels louder?',
  poster: {
    title: 'Why silence feels louder',
    facts: ['Attention changes the nervous system', 'Distance makes patterns louder']
  },
  voiceover: {
    text: 'A short voiceover. Save this if it felt accurate.',
    cta: 'Save this if it felt accurate.'
  },
  onScreenText: ['Attention changes the nervous system', 'Distance makes patterns louder'],
  youtube: {
    title: 'Why silence feels louder',
    description: 'A short psychology video about distance and attention.',
    tags: ['psychology', 'shorts']
  },
  rules: {
    maxDurationSec: 30,
    ctaOnlyInVoice: true,
    language: 'en'
  }
};

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-vid-export-'));
  config.videoExportDir = path.join(tempDir, 'Video', 'Youtube');
});

afterEach(async () => {
  config.videoExportDir = originalExportDir;
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('video exporter', () => {
  it('creates a Windows-safe export folder name', () => {
    expect(createSafeFolderName('Why silence: feels louder?', '2026-06-01T02:45:00')).toBe(
      'why_silence_feels_louder_2026-06-01_02-45'
    );
  });

  it('creates upload.txt without technical fields', () => {
    const upload = createUploadTxt({
      title: material.youtube.title,
      description: material.youtube.description,
      tags: material.youtube.tags,
      topic: material.topic,
      language: 'en',
      createdAt: '2026-06-01T02:45:00',
      videoFile: 'video.mp4'
    });

    expect(upload).toContain('Название:\nWhy silence feels louder');
    expect(upload).toContain('Теги:\npsychology, shorts');
    expect(upload).not.toContain('output/runs');
    expect(upload).not.toContain('run-manifest');
  });

  it('copies video and writes metadata package paths', async () => {
    const sourceVideoPath = path.join(tempDir, 'source.mp4');
    await fs.writeFile(sourceVideoPath, 'video-bytes');

    const result = await exportYoutubePackage({
      sourceVideoPath,
      material,
      language: 'en',
      createdAt: '2026-06-01T02:45:00'
    });

    await expect(fs.readFile(path.join(result.absoluteExportDir, 'video.mp4'), 'utf8')).resolves.toBe('video-bytes');
    await expect(fs.stat(path.join(result.absoluteExportDir, 'video.mp4.part'))).rejects.toThrow();
    await expect(fs.readFile(path.join(result.absoluteExportDir, 'upload.txt'), 'utf8')).resolves.toContain(material.youtube.title);

    const metadata = JSON.parse(await fs.readFile(path.join(result.absoluteExportDir, 'metadata.json'), 'utf8'));
    expect(metadata).toMatchObject({
      title: material.youtube.title,
      description: material.youtube.description,
      tags: material.youtube.tags,
      topic: material.topic,
      language: 'en',
      createdAt: '2026-06-01T02:45:00',
      videoFile: 'video.mp4'
    });
    expect(result.exportDir).toContain('Video/Youtube/why_silence_feels_louder_2026-06-01_02-45');
    expect(result.exportVideoPath).toMatch(/\/video\.mp4$/);
    expect(result.uploadTextPath).toMatch(/\/upload\.txt$/);
    expect(result.metadataPath).toMatch(/\/metadata\.json$/);
  });
});
