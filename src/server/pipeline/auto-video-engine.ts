import fs from 'node:fs/promises';
import path from 'node:path';
import { AUTO_DIRECTIONS, DIRECTIONS } from '../../shared/constants';
import type {
  AutoDirectionId,
  AutoMaterial,
  AutoVideoManifest,
  AutoVideoRequest,
  AutoVideoResult,
  Direction,
  RunRecord,
  ScriptPackage
} from '../../shared/types';
import { appendHermesDecision } from '../hermes/decisions';
import { createYouTubePackage } from './assembler';
import { shortenVoiceoverText, validateAutoMaterial } from './auto-video-validation';
import { buildOnScreenTextPayload } from './captions-engine';
import { createDesign } from './design';
import { generateAutoMaterial } from './material-engine';
import { ensureBackgroundMusic } from './music';
import { buildPosterPayload } from './poster-engine';
import { renderVideoRun } from './render';
import { createVoiceovers } from './voiceover';
import { createRunFolder, saveRunRecord, saveStageArtifact } from '../storage/runs';
import { appendTopicHistory } from '../storage/topic-history';
import { buildMultilingualScript } from './translation';
import { sentence } from '../utils';
import { generateTopicCandidates } from './topic-engine';
import { getWavDurationSec } from './audio-duration';

const categoryToDirectionId: Record<Exclude<AutoDirectionId, 'random'>, string> = {
  psychology: 'self-awareness',
  relationships: 'relationship-decoder',
  zodiac: 'zodiac-energy',
  mindset: 'mindset-patterns',
  numerology: 'numerology-vibes'
};

function resolveAutoDirection(requested: AutoDirectionId) {
  if (requested !== 'random') {
    return categoryToDirectionId[requested];
  }

  const seeded = AUTO_DIRECTIONS.filter((item) => item.directionId);
  const selected = seeded[Math.floor(Math.random() * seeded.length)];
  return selected.directionId!;
}

function getDirectionById(directionId: string) {
  const direction = DIRECTIONS.find((item) => item.id === directionId);
  if (!direction) throw new Error(`Unknown direction: ${directionId}`);
  return direction;
}

function buildAutoScript(direction: Direction, material: AutoMaterial, durationSec: number): ScriptPackage {
  const body = material.poster.facts.map((item) => sentence(item));

  return {
    language: material.rules.language,
    direction: direction.id,
    topic: material.topic,
    durationSeconds: Math.min(30, durationSec),
    hook: sentence(material.poster.title),
    body,
    cta: sentence(material.voiceover.cta),
    voiceoverText: material.voiceover.text,
    onScreenText: buildOnScreenTextPayload(material),
    title: material.poster.title,
    description: material.youtube.description,
    tags: material.youtube.tags
  };
}

async function createAutoRunRecord({
  runDir,
  direction,
  material,
  request,
  artifacts,
  youtubePackage
}: {
  runDir: string;
  direction: Direction;
  material: AutoMaterial;
  request: AutoVideoRequest;
  artifacts: Record<string, string>;
  youtubePackage: ReturnType<typeof createYouTubePackage>;
}) {
  const run: RunRecord = {
    id: path.basename(runDir),
    createdAt: new Date().toISOString(),
    directionId: direction.id,
    directionName: direction.name,
    topic: material.topic,
    languages: [material.rules.language],
    outputDir: runDir,
    hasVoiceover: request.voiceover,
    renderStatus: 'completed',
    mode: 'auto',
    artifacts,
    youtubePackage
  };

  await saveRunRecord(runDir, run);
  return run;
}

export async function runAutoVideoPipeline(request: AutoVideoRequest): Promise<AutoVideoResult> {
  const resolvedDirectionId = resolveAutoDirection(request.direction);
  const direction = getDirectionById(resolvedDirectionId);

  console.log(`[auto-video] resolving direction ${request.direction} -> ${direction.id}`);
  const topics = await generateTopicCandidates(direction, request.language);
  const topic = topics.topics[0]?.topic;
  if (!topic) {
    throw new Error('Auto video generation failed: topic generation returned no topics.');
  }

  console.log(`[auto-video] topic generated: ${topic}`);
  const runDir = await createRunFolder(direction.id, topic);

  try {
    const generatedMaterial = await generateAutoMaterial({
      direction,
      topic,
      language: request.language,
      durationSec: Math.min(30, request.durationSec)
    });

    let { material, estimatedDurationSec } = await validateAutoMaterial(generatedMaterial);
    const effectiveDurationSec = Math.min(30, Math.max(12, Math.ceil(estimatedDurationSec)));
    console.log(`[auto-video] material validated: ~${estimatedDurationSec}s`);

    const poster = buildPosterPayload(material);
    let script = buildAutoScript(direction, material, effectiveDurationSec);
    const bundle = await buildMultilingualScript([script]);
    bundle.hasVoiceover = request.voiceover;

    let { bundle: designBundle, design } = createDesign(direction, bundle, { forceVoiceOnlyCta: true });
    const musicFile = await ensureBackgroundMusic(direction.category, runDir);
    let voiceArtifacts = request.voiceover ? await createVoiceovers(runDir, designBundle) : [];

    if (request.voiceover && voiceArtifacts[0]) {
      const wavDurationSec = await getWavDurationSec(path.join(runDir, voiceArtifacts[0].fileName));
      if (wavDurationSec && wavDurationSec > 30) {
        material = {
          ...material,
          voiceover: {
            ...material.voiceover,
            text: shortenVoiceoverText(material.voiceover.text, material.voiceover.cta, 52)
          }
        };
        script = buildAutoScript(direction, material, 30);
        const rebuiltBundle = await buildMultilingualScript([script]);
        rebuiltBundle.hasVoiceover = request.voiceover;
        const rebuiltDesign = createDesign(direction, rebuiltBundle, { forceVoiceOnlyCta: true });
        voiceArtifacts = await createVoiceovers(runDir, rebuiltDesign.bundle);
        designBundle = rebuiltDesign.bundle;
        design = rebuiltDesign.design;
        estimatedDurationSec = 30;
      }
    }

    const renderInput = {
      directionId: direction.id,
      topic: material.topic,
      script: designBundle.languages[0],
      design,
      musicFile,
      hasVoiceover: request.voiceover
    };

    const renders = await renderVideoRun({
      runDir,
      bundleData: designBundle,
      design,
      musicFile,
      autoContext: {
        material,
        language: request.language,
        requestedDurationSec: Math.min(30, request.durationSec)
      }
    });

    const renderedFile = renders[request.language];
    if (!renderedFile) {
      throw new Error('Auto video generation failed: render output was not created.');
    }

    const primaryVideoName = 'video.mp4';
    await fs.copyFile(renderedFile, path.join(runDir, primaryVideoName));

    const youtubePackage = {
      ...createYouTubePackage(designBundle),
      title: material.youtube.title,
      description: material.youtube.description,
      tags: material.youtube.tags,
      fileName: 'youtube-metadata.json'
    };

    const artifacts = {
      material: 'material.json',
      poster: 'poster.json',
      metadata: 'youtube-metadata.json',
      manifest: 'run-manifest.json',
      voiceover: 'voiceover.json',
      renderInput: 'render-input.json',
      video: primaryVideoName,
      design: 'design.json',
      render: 'render.json'
    };

    const manifest: AutoVideoManifest = {
      mode: 'auto',
      runId: path.basename(runDir),
      createdAt: new Date().toISOString(),
      request,
      resolvedDirectionId: direction.id,
      resolvedDirectionName: direction.name,
      topic: material.topic,
      language: request.language,
      durationSec: designBundle.languages[0].durationSeconds,
      hasVoiceover: request.voiceover,
      videoPath: path.join(runDir, primaryVideoName),
      artifacts
    };

    await saveStageArtifact(runDir, 'material.json', material);
    await saveStageArtifact(runDir, 'poster.json', poster);
    await saveStageArtifact(runDir, 'voiceover.json', {
      language: request.language,
      text: material.voiceover.text,
      cta: material.voiceover.cta,
      artifacts: voiceArtifacts
    });
    await saveStageArtifact(runDir, 'render-input.json', renderInput);
    await saveStageArtifact(runDir, 'youtube-metadata.json', youtubePackage);
    await saveStageArtifact(runDir, 'design.json', design);
    await saveStageArtifact(runDir, 'render.json', renders);
    await saveStageArtifact(runDir, 'run-manifest.json', manifest);

    const run = await createAutoRunRecord({
      runDir,
      direction,
      material,
      request,
      artifacts,
      youtubePackage
    });

    await appendTopicHistory(direction.id, material.topic);
    await appendHermesDecision({
      directionId: direction.id,
      topic: material.topic,
      runDir,
      outcome: 'auto-render-completed'
    });

    return {
      runId: run.id,
      status: 'completed',
      videoPath: path.posix.join('output', 'runs', run.id, primaryVideoName),
      artifacts: {
        material: artifacts.material,
        poster: artifacts.poster,
        metadata: artifacts.metadata,
        manifest: artifacts.manifest,
        voiceover: artifacts.voiceover,
        renderInput: artifacts.renderInput
      },
      summary: {
        topic: material.topic,
        poster: material.poster,
        voiceover: material.voiceover,
        onScreenText: material.onScreenText
      }
    };
  } catch (error) {
    const failedRun: RunRecord = {
      id: path.basename(runDir),
      createdAt: new Date().toISOString(),
      directionId: direction.id,
      directionName: direction.name,
      topic,
      languages: [request.language],
      outputDir: runDir,
      hasVoiceover: request.voiceover,
      renderStatus: 'failed',
      mode: 'auto',
      errorMessage: error instanceof Error ? error.message : 'Auto video pipeline failed.',
      artifacts: {},
      youtubePackage: {
        title: topic,
        description: '',
        tags: [],
        fileName: 'youtube-metadata.json'
      }
    };
    await saveRunRecord(runDir, failedRun);
    throw error;
  }
}
