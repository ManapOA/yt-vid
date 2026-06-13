import fs from 'node:fs/promises';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { HorrorStoryPart } from '../../shared/types';
import { config } from '../config';
import { getWavDurationSec } from './audio-duration';

function getMimeType(filePath: string) {
  return path.extname(filePath).toLowerCase() === '.mp3' ? 'audio/mpeg' : 'audio/wav';
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
  const outputs: Array<{ part: HorrorStoryPart; outputVideoPath: string }> = [];

  for (const entry of parts) {
    const stagedVoiceFile = await fileToDataUrl(entry.voiceFile);
    const voiceDuration = await getWavDurationSec(entry.voiceFile);
    if (voiceDuration && voiceDuration > 60) {
      throw new Error(`Horror story part ${entry.part.index} exceeds 60 seconds after voice synthesis.`);
    }

    const partForRender = {
      ...entry.part,
      durationSec: voiceDuration
        ? Math.max(5, Number(voiceDuration.toFixed(2)))
        : Math.min(60, entry.part.durationSec)
    };
    const inputProps = {
      part: partForRender,
      audioFile: stagedVoiceFile,
      musicFile: stagedMusicFile,
      musicVolume: Math.min(config.musicVolume, 0.08),
      visualization
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
