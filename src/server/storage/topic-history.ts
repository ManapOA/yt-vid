import path from 'node:path';
import { config } from '../config';
import { readJsonFile, updateJsonFile } from '../utils';

const topicHistoryPath = path.join(config.dataDir, 'topic-history.json');

type TopicHistoryEntry = {
  directionId: string;
  topic: string;
  createdAt: string;
};

function normalizeTopic(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getTopicHistory() {
  return readJsonFile<TopicHistoryEntry[]>(topicHistoryPath, []);
}

export async function hasTopicBeenUsed(directionId: string, topic: string) {
  const normalized = normalizeTopic(topic);
  const history = await getTopicHistory();
  return history.some((entry) => entry.directionId === directionId && normalizeTopic(entry.topic) === normalized);
}

export async function filterDuplicateTopics(directionId: string, topics: string[]) {
  const history = await getTopicHistory();
  const used = new Set(
    history
      .filter((entry) => entry.directionId === directionId)
      .map((entry) => normalizeTopic(entry.topic))
  );

  return topics.filter((topic) => !used.has(normalizeTopic(topic)));
}

export async function appendTopicHistory(directionId: string, topic: string) {
  await updateJsonFile<TopicHistoryEntry[]>(topicHistoryPath, [], (history) => [
    {
      directionId,
      topic,
      createdAt: new Date().toISOString()
    },
    ...history
  ].slice(0, 500));
}
