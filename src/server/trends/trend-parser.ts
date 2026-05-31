import type { TrendPattern } from './trend-store';
import { normalizeTrendPattern } from './trend-normalizer';

export function parseManualTrendPattern(input: Omit<TrendPattern, 'createdAt'> & { createdAt?: string }) {
  return normalizeTrendPattern({
    ...input,
    createdAt: input.createdAt || new Date().toISOString()
  });
}
