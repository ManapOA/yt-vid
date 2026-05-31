import fs from 'node:fs/promises';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { config } from '../config';
import { runRegressionChecks } from '../hermes/regression-checks';
import type { DesignPackage, MultiScriptPackage } from '../../shared/types';

async function createBundle() {
  return bundle({
    entryPoint: path.join(config.root, 'src', 'remotion', 'index.ts')
  });
}

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.ogg') return 'audio/ogg';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.m4a') return 'audio/mp4';
  return 'audio/wav';
}

function normalizeAssetPath(filePath: string) {
  if (filePath.startsWith('data:')) return filePath;
  if (filePath.startsWith('file:///')) {
    return decodeURIComponent(new URL(filePath).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  }
  return filePath;
}

async function fileToDataUrl(filePath: string | null) {
  if (!filePath) return null;
  if (filePath.startsWith('data:')) return filePath;
  const normalizedPath = normalizeAssetPath(filePath);
  const buffer = await fs.readFile(normalizedPath);
  return `data:${getMimeType(normalizedPath)};base64,${buffer.toString('base64')}`;
}

async function getWavDurationSec(filePath: string | null) {
  if (!filePath) return null;
  const normalizedPath = normalizeAssetPath(filePath);
  const buffer = await fs.readFile(normalizedPath);
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  const byteRate = buffer.readUInt32LE(28);
  if (!byteRate) return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      return Number((chunkSize / byteRate).toFixed(2));
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}

function estimateSpeechDurationSec(text: string) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Number((words / 2.6).toFixed(2)));
}

export async function renderVideoRun({
  runDir,
  bundleData,
  design,
  musicFile,
  autoContext
}: {
  runDir: string;
  bundleData: MultiScriptPackage;
  design: DesignPackage;
  musicFile: string | null;
  autoContext?: {
    material: {
      voiceover: { text: string; cta: string };
      poster: { title: string; facts: string[] };
      onScreenText: string[];
      rules: { maxDurationSec: number; language: string };
    };
    language: string;
    requestedDurationSec: number;
  };
}) {
  await runRegressionChecks({ runDir, design, autoContext });
  const outputs: Record<string, string> = {};
  const stagedMusicFile = await fileToDataUrl(musicFile);
  const stagedVoiceFiles: Record<string, string | null> = {};

  for (const script of bundleData.languages) {
    stagedVoiceFiles[script.language] = bundleData.hasVoiceover
      ? await fileToDataUrl(path.join(runDir, `voice-${script.language}.wav`))
      : null;
  }

  const site = await createBundle();

  for (const script of bundleData.languages) {
    const outputLocation = path.join(runDir, `short-${script.language}.mp4`);
    const stagedVoiceFile = stagedVoiceFiles[script.language];
    const voiceFilePath = bundleData.hasVoiceover ? path.join(runDir, `voice-${script.language}.wav`) : null;
    const actualVoiceDurationSec = await getWavDurationSec(voiceFilePath);
    const effectiveDurationSec = actualVoiceDurationSec || (bundleData.hasVoiceover
      ? estimateSpeechDurationSec(script.voiceoverText)
      : Number(script.durationSeconds || 8));
    const scriptForRender = {
      ...script,
      durationSeconds: Math.max(3, Number(effectiveDurationSec.toFixed(2)))
    };
    const composition = await selectComposition({
      serveUrl: site,
      id: 'YtVidShort',
      inputProps: {
        script: scriptForRender,
        design,
        audioFile: stagedVoiceFile,
        musicFile: stagedMusicFile,
        musicVolume: config.musicVolume
      }
    });

    await renderMedia({
      serveUrl: site,
      composition,
      codec: 'h264',
      outputLocation,
      inputProps: {
        script: scriptForRender,
        design,
        audioFile: stagedVoiceFile,
        musicFile: stagedMusicFile,
        musicVolume: config.musicVolume
      }
    });
    outputs[script.language] = outputLocation;
  }

  return outputs;
}
