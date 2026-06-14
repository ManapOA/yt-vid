import { describe, expect, it } from 'vitest';
import { loadVideoFonts } from '../src/server/pipeline/video-fonts';

describe('video fonts', () => {
  it('embeds free Manrope subsets for every supported script', async () => {
    const requested: string[] = [];
    const fonts = await loadVideoFonts(async (filePath) => {
      requested.push(filePath);
      return `data:font/woff2;base64,${requested.length}`;
    });

    expect(Object.keys(fonts)).toEqual(['fontLatin', 'fontLatinExt', 'fontCyrillic', 'fontCyrillicExt']);
    expect(requested).toHaveLength(4);
    expect(requested.some((filePath) => filePath.endsWith('manrope-latin-wght-normal.woff2'))).toBe(true);
    expect(requested.some((filePath) => filePath.endsWith('manrope-latin-ext-wght-normal.woff2'))).toBe(true);
    expect(requested.every((filePath) => filePath.includes('@fontsource-variable'))).toBe(true);
  });
});
