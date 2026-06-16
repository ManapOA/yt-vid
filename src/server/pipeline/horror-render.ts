import fs from 'node:fs/promises';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { HorrorStoryPart } from '../../shared/types';
import { config } from '../config';
import { getWavDurationSec } from './audio-duration';
import { selectHorrorBackground } from './media-library';
import { loadVideoFonts } from './video-fonts';

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.ttf') return 'font/ttf';
  return ext === '.mp3' ? 'audio/mpeg' : 'audio/wav';
}

async function fileToDataUrl(filePath: string | null) {
  if (!filePath) return null;
  const buffer = await fs.readFile(filePath);
  return `data:${getMimeType(filePath)};base64,${buffer.toString('base64')}`;
}

export async function renderHorrorSeries({
  parts,
  musicFile,
  visualization
}: {
  parts: Array<{
    part: HorrorStoryPart;
    partDir: string;
    voiceFile: string | null;
  }>;
  musicFile: string | null;
  visualization: boolean;
}) {
  const site = await bundle({
    entryPoint: path.join(config.root, 'src', 'remotion', 'index.ts')
  });
  const stagedMusicFile = await fileToDataUrl(musicFile);
  const videoFonts = await loadVideoFonts(async (filePath) => (
    (await fileToDataUrl(filePath))!
  ));
  const outputs: Array<{ part: HorrorStoryPart; outputVideoPath: string }> = [];

  for (const entry of parts) {
    const stagedVoiceFile = await fileToDataUrl(entry.voiceFile);
    const voiceDuration = await getWavDurationSec(entry.voiceFile);

    const partForRender = {
      ...entry.part,
      durationSec: voiceDuration
        ? Math.max(5, Number(voiceDuration.toFixed(2)))
        : Math.max(5, entry.part.durationSec)
    };
    const selectedBackground = selectHorrorBackground(partForRender);
    const backgroundMedia = visualization
      ? await fileToDataUrl(selectedBackground.path)
      : null;
    const inputProps = {
      part: partForRender,
      audioFile: stagedVoiceFile,
      musicFile: stagedMusicFile,
      musicVolume: Math.min(config.musicVolume, 0.08),
      visualization,
      backgroundMedia,
      backgroundMediaKind: 'image' as const,
      ...videoFonts
    };
    const composition = await selectComposition({
      serveUrl: site,
      id: 'HorrorStory',
      inputProps
    });
    const outputVideoPath = path.join(entry.partDir, 'video.mp4');

    await renderMedia({
      serveUrl: site,
      composition,
      codec: 'h264',
      outputLocation: outputVideoPath,
      inputProps
    });

    outputs.push({ part: partForRender, outputVideoPath });
  }

  return outputs;
}
