import path from 'node:path';
import { config } from '../config';
import { readJsonFile, writeJsonFile } from '../utils';

export type TrendPattern = {
  id: string;
  source: 'manual' | 'url' | 'import';
  niche: string;
  language: string;
  hookPattern: string;
  structure: string[];
  tone: string;
  createdAt: string;
};

const trendStorePath = path.join(config.dataDir, 'trends', 'patterns.json');

export async function listTrendPatterns() {
  return readJsonFile<TrendPattern[]>(trendStorePath, []);
}

export async function saveTrendPattern(pattern: TrendPattern) {
  const current = await listTrendPatterns();
  const next = [...current.filter((item) => item.id !== pattern.id), pattern];
  await writeJsonFile(trendStorePath, next);
  return pattern;
}
