import path from 'node:path';
import { config } from '../config';
import { updateJsonFile } from '../utils';

export async function appendHermesDecision(entry: Record<string, unknown>) {
  const filePath = path.join(config.dataDir, 'hermes', 'decisions.json');
  await updateJsonFile<Record<string, unknown>[]>(filePath, [], (items) => [
    {
      ...entry,
      createdAt: new Date().toISOString()
    },
    ...items
  ].slice(0, 500));
}

export async function appendHermesFix(entry: Record<string, unknown>) {
  const filePath = path.join(config.dataDir, 'hermes', 'fixes.json');
  await updateJsonFile<Record<string, unknown>[]>(filePath, [], (items) => [
    {
      ...entry,
      createdAt: new Date().toISOString()
    },
    ...items
  ].slice(0, 500));
}
