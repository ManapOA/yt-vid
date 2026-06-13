import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  HorrorSeriesResult,
  HorrorStoryRequest,
  MultiScriptPackage,
  RunRecord,
  ScriptPackage
} from '../../shared/types';
import { appendHermesDecision } from '../hermes/decisions';
import { createRunFolder, saveRunRecord, saveStageArtifact } from '../storage/runs';
import { ensureBackgroundMusic } from './music';
import { createVoiceovers } from './voiceover';
import { exportHorrorSeries } from './horror-series-exporter';
import { generateHorrorStory, splitHorrorStoryIntoParts } from './horror-story-engine';
import { renderHorrorSeries } from './horror-render';

function scriptForPart(part: ReturnType<typeof splitHorrorStoryIntoParts>[number], request: HorrorStoryRequest): ScriptPackage {
  return {
    language: request.language,
    direction: 'horror-story',
    topic: part.title,
    durationSeconds: part.durationSec,
    hook: part.onScreenText[0] || part.title,
    body: part.onScreenText.slice(1),
    cta: part.cta,
    voiceoverText: part.voiceoverText,
    onScreenText: part.onScreenText,
    title: part.title,
    description: part.text,
    tags: ['horror', 'story']
  };
}

export async function runHorrorSeriesPipeline(request: HorrorStoryRequest): Promise<HorrorSeriesResult> {
  const story = await generateHorrorStory(request);
  const parts = splitHorrorStoryIntoParts(story, request.language);
  const runDir = await createRunFolder('horror-story', story.title);
  const createdAt = new Date().toISOString();

  try {
    const musicFile = await ensureBackgroundMusic('horror', runDir);
    const renderEntries: Array<{
      part: (typeof parts)[number];
      partDir: string;
      voiceFile: string | null;
    }> = [];

    for (const part of parts) {
      const partDir = path.join(runDir, `part-${String(part.index).padStart(2, '0')}`);
      await fs.mkdir(partDir, { recursive: true });
      const script = scriptForPart(part, request);
      let voiceFile: string | null = null;

      if (request.voiceover) {
        const bundle: MultiScriptPackage = {
          baseLanguage: request.language,
          directionId: 'horror-story',
          topic: story.title,
          languages: [script],
          hasVoiceover: true
        };
        const voiceArtifacts = await createVoiceovers(partDir, bundle);
        part.durationSec = bundle.languages[0].durationSeconds;
        voiceFile = voiceArtifacts[0] ? path.join(partDir, voiceArtifacts[0].fileName) : null;
      }

      await saveStageArtifact(partDir, 'part.json', part);
      renderEntries.push({ part, partDir, voiceFile });
    }

    const renders = await renderHorrorSeries({
      parts: renderEntries,
      musicFile,
      visualization: request.visualization
    });
    const exported = await exportHorrorSeries({
      story,
      parts: renders,
      language: request.language,
      createdAt
    });

    await saveStageArtifact(runDir, 'story.json', story);
    await saveStageArtifact(runDir, 'parts.json', renders.map((entry) => entry.part));
    await saveStageArtifact(runDir, 'series-manifest.json', {
      mode: 'horror',
      request,
      createdAt,
      exportDir: exported.absoluteExportDir,
      parts: exported.parts
    });

    const firstPart = exported.parts[0];
    const run: RunRecord = {
      id: path.basename(runDir),
      createdAt,
      directionId: 'horror-story',
      directionName: 'Horror Stories',
      topic: story.title,
      languages: [request.language],
      outputDir: runDir,
      exportDir: exported.exportDir,
      absoluteExportDir: exported.absoluteExportDir,
      exportVideoPath: firstPart?.exportVideoPath,
      hasVoiceover: request.voiceover,
      renderStatus: 'completed',
      mode: 'horror',
      artifacts: {
        story: 'story.json',
        parts: 'parts.json',
        manifest: 'series-manifest.json',
        video: 'part-01/video.mp4'
      },
      youtubePackage: {
        title: story.title,
        description: story.description,
        tags: story.tags,
        fileName: 'series.json'
      },
      seriesParts: exported.parts
    };
    await saveRunRecord(runDir, run);
    await appendHermesDecision({
      directionId: 'horror-story',
      topic: story.title,
      runDir,
      outcome: 'horror-series-render-completed',
      partCount: parts.length
    });

    return {
      runId: run.id,
      status: 'completed',
      title: story.title,
      exportDir: exported.exportDir,
      absoluteExportDir: exported.absoluteExportDir,
      parts: exported.parts
    };
  } catch (error) {
    const failedRun: RunRecord = {
      id: path.basename(runDir),
      createdAt,
      directionId: 'horror-story',
      directionName: 'Horror Stories',
      topic: story.title,
      languages: [request.language],
      outputDir: runDir,
      hasVoiceover: request.voiceover,
      renderStatus: 'failed',
      mode: 'horror',
      errorMessage: error instanceof Error ? error.message : 'Horror story series failed.',
      artifacts: {},
      youtubePackage: {
        title: story.title,
        description: story.description,
        tags: story.tags,
        fileName: 'series.json'
      }
    };
    await saveRunRecord(runDir, failedRun);
    throw error;
  }
}
