import fs from 'node:fs/promises';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { config } from '../config';
import type { DesignPackage, MultiScriptPackage } from '../../shared/types';
import { getWavDurationSec } from './audio-duration';
import { selectAutoBackground } from './media-library';
import { loadVideoFonts } from './video-fonts';

async function createBundle() {
  return bundle({
    entryPoint: path.join(config.root, 'src', 'remotion', 'index.ts')
  });
}

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.ttf') return 'font/ttf';
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

function estimateSpeechDurationSec(text: string) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Number((words / 2.6).toFixed(2)));
}

async function findVoiceFile(runDir: string, language: string) {
  const preferredExt = config.cartesia.outputContainer === 'mp3' ? 'mp3' : 'wav';
  const candidates = [
    path.join(runDir, `voice-${language}.${preferredExt}`),
    path.join(runDir, `voice-${language}.wav`),
    path.join(runDir, `voice-${language}.mp3`)
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next supported voice container.
    }
  }

  return null;
}

export async function renderVideoRun({
  runDir,
  bundleData,
  design,
  musicFile
}: {
  runDir: string;
  bundleData: MultiScriptPackage;
  design: DesignPackage;
  musicFile: string | null;
}) {
  const outputs: Record<string, string> = {};
  const stagedMusicFile = await fileToDataUrl(musicFile);
  const videoFonts = await loadVideoFonts(async (filePath) => (
    (await fileToDataUrl(filePath))!
  ));
  const stagedVoiceFiles: Record<string, string | null> = {};
  const voiceFilePaths: Record<string, string | null> = {};

  for (const script of bundleData.languages) {
    const voiceFilePath = bundleData.hasVoiceover ? await findVoiceFile(runDir, script.language) : null;
    voiceFilePaths[script.language] = voiceFilePath;
    stagedVoiceFiles[script.language] = bundleData.hasVoiceover
      ? await fileToDataUrl(voiceFilePath)
      : null;
  }

  const site = await createBundle();

  for (const script of bundleData.languages) {
    const outputLocation = path.join(runDir, `short-${script.language}.mp4`);
    const stagedVoiceFile = stagedVoiceFiles[script.language];
    const voiceFilePath = voiceFilePaths[script.language];
    const actualVoiceDurationSec = await getWavDurationSec(voiceFilePath ? normalizeAssetPath(voiceFilePath) : null);
    const effectiveDurationSec = actualVoiceDurationSec || (bundleData.hasVoiceover
      ? estimateSpeechDurationSec(script.voiceoverText)
      : Number(script.durationSeconds || 8));
    const scriptForRender = {
      ...script,
      durationSeconds: Math.max(3, Number(effectiveDurationSec.toFixed(2)))
    };
    const selectedBackground = selectAutoBackground(design.directionId, script.topic);
    const backgroundMedia = await fileToDataUrl(selectedBackground.path);
    const composition = await selectComposition({
      serveUrl: site,
      id: 'YtVidShort',
      inputProps: {
        script: scriptForRender,
        design,
        audioFile: stagedVoiceFile,
        musicFile: stagedMusicFile,
        musicVolume: config.musicVolume,
        backgroundMedia,
        backgroundMediaKind: 'image',
        ...videoFonts
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
        musicVolume: config.musicVolume,
        backgroundMedia,
        backgroundMediaKind: 'image',
        ...videoFonts
      }
    });
    outputs[script.language] = outputLocation;
  }

  return outputs;
}
