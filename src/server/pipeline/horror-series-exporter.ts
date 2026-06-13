import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  HorrorSeriesPartResult,
  HorrorStoryDraft,
  HorrorStoryPart,
  LanguageCode
} from '../../shared/types';
import { config } from '../config';
import { writeJsonFile } from '../utils';
import { createSafeFolderName } from './video-exporter';

function exportUrl(filePath: string) {
  const relative = path.relative(config.videoExportDir, filePath);
  return `/exports/${relative.split(path.sep).map(encodeURIComponent).join('/')}`;
}

async function copyVerified(source: string, destination: string) {
  const sourceStats = await fs.stat(source);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`Rendered video is missing or empty: ${source}`);
  }

  const temporary = `${destination}.part`;
  await fs.copyFile(source, temporary);
  await fs.rename(temporary, destination);
  const destinationStats = await fs.stat(destination);
  if (destinationStats.size !== sourceStats.size) {
    throw new Error(`Horror series export verification failed: ${destination}`);
  }
}

function uploadText({
  story,
  part,
  language,
  nextFile
}: {
  story: HorrorStoryDraft;
  part: HorrorStoryPart;
  language: LanguageCode;
  nextFile: string | null;
}) {
  return [
    `Title: ${part.title}`,
    '',
    `Description: ${story.description}`,
    '',
    `Tags: ${story.tags.join(', ')}`,
    '',
    `Language: ${language}`,
    `Part: ${part.index}/${part.total}`,
    nextFile ? `Next part file: ${nextFile}` : 'Final part',
    ''
  ].join('\n');
}

export async function exportHorrorSeries({
  story,
  parts,
  language,
  createdAt
}: {
  story: HorrorStoryDraft;
  parts: Array<{ part: HorrorStoryPart; outputVideoPath: string }>;
  language: LanguageCode;
  createdAt: string;
}) {
  const exportDir = path.join(config.videoExportDir, createSafeFolderName(story.title, createdAt));
  await fs.mkdir(exportDir, { recursive: true });

  const results: HorrorSeriesPartResult[] = [];
  for (const entry of parts) {
    const baseName = `part-${String(entry.part.index).padStart(2, '0')}`;
    const exportedVideo = path.join(exportDir, `${baseName}.mp4`);
    const uploadPath = path.join(exportDir, `${baseName}-upload.txt`);
    const nextFile = entry.part.index < entry.part.total
      ? `part-${String(entry.part.index + 1).padStart(2, '0')}.mp4`
      : null;

    await copyVerified(entry.outputVideoPath, exportedVideo);
    await fs.writeFile(uploadPath, uploadText({ story, part: entry.part, language, nextFile }), 'utf8');

    results.push({
      index: entry.part.index,
      title: entry.part.title,
      durationSec: entry.part.durationSec,
      outputVideoPath: entry.outputVideoPath,
      exportVideoPath: exportedVideo,
      exportVideoUrl: exportUrl(exportedVideo)
    });
  }

  await writeJsonFile(path.join(exportDir, 'series.json'), {
    title: story.title,
    description: story.description,
    tags: story.tags,
    language,
    createdAt,
    parts: results.map((part) => ({
      index: part.index,
      title: part.title,
      durationSec: part.durationSec,
      videoFile: path.basename(part.exportVideoPath)
    }))
  });

  return {
    exportDir: path.relative(config.root, exportDir).split(path.sep).join('/'),
    absoluteExportDir: exportDir,
    parts: results
  };
}
