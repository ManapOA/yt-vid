import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { HorrorStoryPart } from '../src/shared/types';
import { selectAutoBackground, selectHorrorBackground } from '../src/server/pipeline/media-library';

describe('media library', () => {
  it('contains five unique 1080x1920 images for every visual theme', () => {
    const folders = [
      'shorts/psychology',
      'shorts/relationships',
      'shorts/zodiac',
      'shorts/mindset',
      'shorts/numerology',
      'horror/parking',
      'horror/forest',
      'horror/corridor',
      'horror/house',
      'horror/road'
    ];
    const hashes = new Set<string>();

    for (const folder of folders) {
      const directory = path.join(process.cwd(), 'assets', 'backgrounds', folder);
      const files = fs.readdirSync(directory).filter((file) => file.endsWith('.png')).sort();
      expect(files, folder).toHaveLength(5);

      for (const file of files) {
        const bytes = fs.readFileSync(path.join(directory, file));
        expect(bytes.readUInt32BE(16), `${folder}/${file} width`).toBe(1080);
        expect(bytes.readUInt32BE(20), `${folder}/${file} height`).toBe(1920);
        hashes.add(createHash('sha256').update(bytes).digest('hex'));
      }
    }

    expect(hashes.size).toBe(50);
  });

  it.each([
    ['ru', 'почему партнер внезапно замолчал'],
    ['kk', 'қарым-қатынастағы үнсіздік'],
    ['de', 'Warum dein Partner plötzlich schweigt'],
    ['es', 'La distancia en una relación'],
    ['it', 'Il silenzio nella coppia'],
    ['en', 'Why your relationship feels distant']
  ])('selects the same relationship visual standard for %s', (_language, topic) => {
    const selected = selectAutoBackground('relationship-decoder', topic, () => 0);
    expect(selected.kind).toBe('image');
    expect(selected.path).toMatch(/shorts[\\/]relationships[\\/]relationships-01\.png$/);
  });

  it('uses one of five static zodiac images', () => {
    const selected = selectAutoBackground('zodiac-energy', 'daily energy', () => 0.99);
    expect(selected.kind).toBe('image');
    expect(selected.path).toMatch(/shorts[\\/]zodiac[\\/]zodiac-05\.png$/);
  });

  it.each([
    ['self-awareness', 'psychology'],
    ['relationship-decoder', 'relationships'],
    ['zodiac-energy', 'zodiac'],
    ['mindset-patterns', 'mindset'],
    ['numerology-vibes', 'numerology']
  ])('exposes all five independent %s image slots', (directionId, folder) => {
    const selected = [0, 0.2, 0.4, 0.6, 0.99].map((value) => (
      selectAutoBackground(directionId, 'topic', () => value).path
    ));
    expect(new Set(selected).size).toBe(5);
    expect(selected.every((filePath) => filePath.includes(`shorts${path.sep}${folder}`))).toBe(true);
  });

  it('matches a German parking horror story without a language special case', () => {
    const selected = selectHorrorBackground({
      index: 1,
      total: 1,
      title: 'Das Parkhaus um zwei Uhr',
      text: 'Im Parkhaus ging das Licht aus.',
      visualPrompt: 'Ein leeres Parkhaus',
      onScreenText: ['DAS LICHT GING AUS'],
      durationSec: 20
    } as HorrorStoryPart, () => 0);
    expect(selected.kind).toBe('image');
    expect(selected.path).toMatch(/horror[\\/]parking[\\/]parking-01\.png$/);
  });

  it.each([
    ['parking garage', 'parking'],
    ['dark forest', 'forest'],
    ['hotel corridor', 'corridor'],
    ['empty basement room', 'house'],
    ['night highway', 'road']
  ])('exposes all five independent horror image slots for %s', (visualPrompt, folder) => {
    const part = {
      index: 1,
      total: 1,
      title: visualPrompt,
      text: visualPrompt,
      visualPrompt,
      onScreenText: ['THE LIGHT WENT OUT'],
      durationSec: 20
    } as HorrorStoryPart;
    const selected = [0, 0.2, 0.4, 0.6, 0.99].map((value) => (
      selectHorrorBackground(part, () => value).path
    ));
    expect(new Set(selected).size).toBe(5);
    expect(selected.every((filePath) => filePath.includes(`horror${path.sep}${folder}`))).toBe(true);
  });
});
