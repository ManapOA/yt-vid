import type { TrendPattern } from './trend-store';

export function scoreTrendPattern(pattern: TrendPattern) {
  const structureScore = Math.min(1, pattern.structure.length / 4);
  const toneScore = pattern.tone ? 0.4 : 0;
  const hookScore = pattern.hookPattern.length > 12 ? 0.6 : 0.3;
  return Math.min(1, structureScore + toneScore + hookScore);
}
