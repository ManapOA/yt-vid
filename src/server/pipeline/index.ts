import path from 'node:path';
import { DIRECTIONS } from '../../shared/constants';
import type { LanguageCode, RunRecord } from '../../shared/types';
import { appendHermesDecision } from '../hermes/decisions';
import { createYouTubePackage } from './assembler';
import { createDesign } from './design';
import { humanizeScript } from './humanize';
import { renderVideoRun } from './render';
import { generateScript } from './script-engine';
import { generateTopicCandidates } from './topic-engine';
import { buildMultilingualScript } from './translation';
import { createVoiceovers } from './voiceover';
import { createRunFolder, saveRunRecord, saveStageArtifact } from '../storage/runs';
import { appendTopicHistory } from '../storage/topic-history';

export async function runFullPipeline({
  directionId,
  topic,
  languages,
  durationSeconds,
  hasVoiceover
}: {
  directionId: string;
  topic: string;
  languages: LanguageCode[];
  durationSeconds: number;
  hasVoiceover: boolean;
}) {
  const direction = DIRECTIONS.find((item) => item.id === directionId);
  if (!direction) throw new Error('Unknown direction');

  const runDir = await createRunFolder(directionId, topic);
  const baseScript = humanizeScript(await generateScript(direction, topic, languages[0], durationSeconds));
  const multilingual = await buildMultilingualScript(baseScript, languages);
  multilingual.hasVoiceover = hasVoiceover;

  await saveStageArtifact(runDir, 'script.json', multilingual);

  const voiceArtifacts = hasVoiceover ? await createVoiceovers(runDir, multilingual) : [];
  await saveStageArtifact(runDir, 'voiceover.json', voiceArtifacts);

  const { bundle, design } = createDesign(direction, multilingual);
  await saveStageArtifact(runDir, 'design.json', design);

  const renders = await renderVideoRun({ runDir, bundleData: bundle, design });
  await saveStageArtifact(runDir, 'render.json', renders);

  const youtubePackage = createYouTubePackage(bundle);
  await saveStageArtifact(runDir, youtubePackage.fileName, youtubePackage);

  const run: RunRecord = {
    id: path.basename(runDir),
    createdAt: new Date().toISOString(),
    directionId: direction.id,
    directionName: direction.name,
    topic,
    languages,
    outputDir: runDir,
    hasVoiceover,
    renderStatus: 'completed',
    artifacts: {
      script: 'script.json',
      voiceover: 'voiceover.json',
      design: 'design.json',
      render: 'render.json',
      youtube: youtubePackage.fileName
    },
    youtubePackage
  };

  await saveRunRecord(runDir, run);
  await appendTopicHistory(direction.id, topic);
  await appendHermesDecision({
    directionId,
    topic,
    runDir,
    outcome: 'render-completed'
  });

  return run;
}

export async function generateTopicsForDirection(directionId: string, language: LanguageCode) {
  const direction = DIRECTIONS.find((item) => item.id === directionId);
  if (!direction) throw new Error('Unknown direction');
  return generateTopicCandidates(direction, language);
}
