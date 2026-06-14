import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readJsonFile, resolvePathInside, updateJsonFile } from '../src/server/utils';

const createdDirs: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('server utilities', () => {
  it('rejects paths that escape their base directory', () => {
    const base = path.join(os.tmpdir(), 'yt-vid-runs');

    expect(resolvePathInside(base, 'run_2026-01-01')).toBe(path.join(base, 'run_2026-01-01'));
    expect(resolvePathInside(base, '..')).toBeNull();
    expect(resolvePathInside(base, path.join('..', 'secrets'))).toBeNull();
    expect(resolvePathInside(base, path.resolve(base, '..', 'outside'))).toBeNull();
  });

  it('serializes concurrent JSON updates without dropping entries', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-vid-json-'));
    createdDirs.push(dir);
    const filePath = path.join(dir, 'items.json');

    await Promise.all(Array.from({ length: 20 }, (_, index) => (
      updateJsonFile<number[]>(filePath, [], (items) => [index, ...items])
    )));

    const items = await readJsonFile<number[]>(filePath, []);
    expect(items).toHaveLength(20);
    expect(new Set(items).size).toBe(20);
  });
});
