import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import type { AutoMaterial, LanguageCode } from '../../shared/types';
import { repairMojibake, repairMojibakeDeep, writeJsonFile } from '../utils';

export type YoutubeExportMetadata = {
  title: string;
  description: string;
  tags: string[];
  topic: string;
  language: LanguageCode;
  createdAt: string;
  videoFile: 'video.mp4';
};

export type YoutubeExportPackage = {
  exportDir: string;
  exportVideoPath: string;
  uploadTextPath: string;
  metadataPath: string;
  absoluteExportDir: string;
};

function toRelativePath(filePath: string) {
  return path.relative(config.root, filePath).split(path.sep).join('/');
}

function formatDatePart(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'unknown-date_00-00';

  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}-${pad(date.getMinutes())}`
  ].join('_');
}

export function createSafeFolderName(topic: string, createdAt: string) {
  const safeTopic = String(topic || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'youtube_short';

  return `${safeTopic}_${formatDatePart(createdAt)}`;
}

export function createUploadTxt(metadata: YoutubeExportMetadata) {
  const safeMetadata = repairMojibakeDeep(metadata);
  return [
    'Название:',
    safeMetadata.title,
    '',
    'Описание:',
    safeMetadata.description,
    '',
    'Теги:',
    safeMetadata.tags.map(repairMojibake).join(', '),
    '',
    'Тема:',
    safeMetadata.topic,
    '',
    'Язык:',
    safeMetadata.language,
    '',
    'Дата:',
    safeMetadata.createdAt,
    ''
  ].join('\n');
}

export async function exportYoutubePackage({
  sourceVideoPath,
  material,
  language,
  createdAt
}: {
  sourceVideoPath: string;
  material: AutoMaterial;
  language: LanguageCode;
  createdAt: string;
}): Promise<YoutubeExportPackage> {
  const exportDir = path.join(config.videoExportDir, createSafeFolderName(repairMojibake(material.topic), createdAt));
  const exportVideoPath = path.join(exportDir, 'video.mp4');
  const uploadTextPath = path.join(exportDir, 'upload.txt');
  const metadataPath = path.join(exportDir, 'metadata.json');

  const metadata: YoutubeExportMetadata = repairMojibakeDeep({
    title: material.youtube.title,
    description: material.youtube.description,
    tags: material.youtube.tags,
    topic: material.topic,
    language,
    createdAt,
    videoFile: 'video.mp4'
  });

  const sourceStats = await fs.stat(sourceVideoPath);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`Rendered video is missing or empty: ${sourceVideoPath}`);
  }

  await fs.mkdir(exportDir, { recursive: true });
  const temporaryVideoPath = `${exportVideoPath}.part`;
  await fs.copyFile(sourceVideoPath, temporaryVideoPath);
  await fs.rename(temporaryVideoPath, exportVideoPath);

  const exportedStats = await fs.stat(exportVideoPath);
  if (!exportedStats.isFile() || exportedStats.size !== sourceStats.size) {
    throw new Error(`Local video export verification failed: ${exportVideoPath}`);
  }
  await fs.writeFile(uploadTextPath, createUploadTxt(metadata), 'utf8');
  await writeJsonFile(metadataPath, metadata);

  return {
    exportDir: toRelativePath(exportDir),
    exportVideoPath: toRelativePath(exportVideoPath),
    uploadTextPath: toRelativePath(uploadTextPath),
    metadataPath: toRelativePath(metadataPath),
    absoluteExportDir: exportDir
  };
}
