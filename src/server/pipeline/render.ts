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

async function fileToDataUrl(filePath: string | null) {
  if (!filePath) return null;
  const buffer = await fs.readFile(filePath);
  return `data:${getMimeType(filePath)};base64,${buffer.toString('base64')}`;
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
  await runRegressionChecks({ runDir, design });
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
    const composition = await selectComposition({
      serveUrl: site,
      id: 'YtVidShort',
      inputProps: {
        script,
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
        script,
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
