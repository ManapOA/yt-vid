import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { config } from '../src/server/config';
import { filterDuplicateTopics } from '../src/server/storage/topic-history';

const topicHistoryPath = path.join(config.dataDir, 'topic-history.json');
let original = '[]\n';

beforeEach(async () => {
  try {
    original = await fs.readFile(topicHistoryPath, 'utf8');
  } catch {
    original = '[]\n';
  }
});

afterEach(async () => {
  await fs.writeFile(topicHistoryPath, original, 'utf8');
});

describe('topic dedupe', () => {
  it('blocks repeated topics', async () => {
    await fs.writeFile(topicHistoryPath, JSON.stringify([
      { directionId: 'self-awareness', topic: 'why silence feels louder when someone matters', createdAt: '2026-01-01' }
    ], null, 2), 'utf8');

    const result = await filterDuplicateTopics('self-awareness', [
      'why silence feels louder when someone matters',
      'the habit that shows someone still cares'
    ]);

    expect(result).toEqual(['the habit that shows someone still cares']);
  });
});
