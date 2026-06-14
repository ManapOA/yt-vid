import path from 'node:path';
import { config } from '../config';

const fontPackageDir = path.join(
  config.root,
  'node_modules',
  '@fontsource-variable',
  'manrope',
  'files'
);

export type VideoFonts = {
  fontLatin: string;
  fontLatinExt: string;
  fontCyrillic: string;
  fontCyrillicExt: string;
};

export async function loadVideoFonts(fileToDataUrl: (filePath: string) => Promise<string>): Promise<VideoFonts> {
  return {
    fontLatin: await fileToDataUrl(path.join(fontPackageDir, 'manrope-latin-wght-normal.woff2')),
    fontLatinExt: await fileToDataUrl(path.join(fontPackageDir, 'manrope-latin-ext-wght-normal.woff2')),
    fontCyrillic: await fileToDataUrl(path.join(fontPackageDir, 'manrope-cyrillic-wght-normal.woff2')),
    fontCyrillicExt: await fileToDataUrl(path.join(fontPackageDir, 'manrope-cyrillic-ext-wght-normal.woff2'))
  };
}
