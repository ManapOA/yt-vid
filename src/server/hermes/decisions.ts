import path from 'node:path';
import { config } from '../config';
import { readJsonFile, writeJsonFile } from '../utils';

export async function appendHermesDecision(entry: Record<string, unknown>) {
  const filePath = path.join(config.dataDir, 'hermes', 'decisions.json');
  const items = await readJsonFile<Record<string, unknown>[]>(filePath, []);
  items.unshift({
    ...entry,
    createdAt: new Date().toISOString()
  });
  await writeJsonFile(filePath, items.slice(0, 500));
}

export async function appendHermesFix(entry: Record<string, unknown>) {
  const filePath = path.join(config.dataDir, 'hermes', 'fixes.json');
  const items = await readJsonFile<Record<string, unknown>[]>(filePath, []);
  items.unshift({
    ...entry,
    createdAt: new Date().toISOString()
  });
  await writeJsonFile(filePath, items.slice(0, 500));
}
