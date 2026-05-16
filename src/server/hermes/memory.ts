import path from 'node:path';
import { config } from '../config';
import { readJsonFile } from '../utils';

export async function getHermesMemory() {
  const [rules, fixes, knownBugs, decisions] = await Promise.all([
    readJsonFile(path.join(config.dataDir, 'hermes', 'rules.json'), []),
    readJsonFile(path.join(config.dataDir, 'hermes', 'fixes.json'), []),
    readJsonFile(path.join(config.dataDir, 'hermes', 'known-bugs.json'), []),
    readJsonFile(path.join(config.dataDir, 'hermes', 'decisions.json'), [])
  ]);

  return { rules, fixes, knownBugs, decisions };
}
