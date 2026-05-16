import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { config } from '../config';
import { runRegressionChecks } from '../hermes/regression-checks';
import type { DesignPackage, MultiScriptPackage } from '../../shared/types';

let bundledSite: string | null = null;

async function ensureBundle() {
  if (bundledSite) return bundledSite;
  bundledSite = await bundle({
    entryPoint: path.join(config.root, 'src', 'remotion', 'index.ts')
  });
  return bundledSite;
}

export async function renderVideoRun({
  runDir,
  bundleData,
  design
}: {
  runDir: string;
  bundleData: MultiScriptPackage;
  design: DesignPackage;
}) {
  await runRegressionChecks({ runDir, design });
  const site = await ensureBundle();
  const outputs: Record<string, string> = {};

  for (const script of bundleData.languages) {
    const outputLocation = path.join(runDir, `short-${script.language}.mp4`);
    const composition = await selectComposition({
      serveUrl: site,
      id: 'YtVidShort',
      inputProps: {
        script,
        design,
        runDir,
        audioFile: bundleData.hasVoiceover ? path.join(runDir, `voice-${script.language}.wav`) : null
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
        runDir,
        audioFile: bundleData.hasVoiceover ? path.join(runDir, `voice-${script.language}.wav`) : null
      }
    });
    outputs[script.language] = outputLocation;
  }

  return outputs;
}
