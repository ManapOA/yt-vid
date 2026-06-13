import { DIRECTIONS } from '../../shared/constants';
import type { LanguageCode, TextGenerationSettings } from '../../shared/types';
import { generateTopicCandidates } from './topic-engine';
export { runAutoVideoPipeline } from './auto-video-engine';

export async function generateTopicsForDirection(directionId: string, language: LanguageCode, textSettings?: TextGenerationSettings) {
  const direction = DIRECTIONS.find((item) => item.id === directionId);
  if (!direction) throw new Error('Unknown direction');
  return generateTopicCandidates(direction, language, textSettings);
}
