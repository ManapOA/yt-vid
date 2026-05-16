import path from 'node:path';
import { config } from '../config';
import { readJsonFile } from '../utils';
import type { HermesRule } from '../../shared/types';

export async function getHermesRules() {
  return readJsonFile<HermesRule[]>(path.join(config.dataDir, 'hermes', 'rules.json'), []);
}
