import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import type { RunRecord } from '../../shared/types';
import { readJsonFile, slugify, timestampSlug, writeJsonFile } from '../utils';

export async function createRunFolder(directionId: string, topic: string) {
  const folder = path.join(config.outputRoot, `run_${timestampSlug()}_${slugify(directionId)}_${slugify(topic).slice(0, 64)}`);
  await fs.mkdir(folder, { recursive: true });
  return folder;
}

export async function saveStageArtifact(runDir: string, fileName: string, data: unknown) {
  const filePath = path.join(runDir, fileName);
  await writeJsonFile(filePath, data);
  return filePath;
}

export async function saveRunRecord(runDir: string, run: RunRecord) {
  await writeJsonFile(path.join(runDir, 'run.json'), run);
}

export async function getRun(runId: string) {
  return readJsonFile<RunRecord | null>(path.join(config.outputRoot, runId, 'run.json'), null);
}

export async function listRuns() {
  try {
    const entries = await fs.readdir(config.outputRoot, { withFileTypes: true });
    const runs = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const runFile = path.join(config.outputRoot, entry.name, 'run.json');
      return readJsonFile<RunRecord | null>(runFile, null);
    }));
    return runs.filter(Boolean).sort((a, b) => b!.createdAt.localeCompare(a!.createdAt)) as RunRecord[];
  } catch {
    return [];
  }
}
