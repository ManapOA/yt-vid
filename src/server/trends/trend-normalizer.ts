import type { TrendPattern } from './trend-store';

export function normalizeTrendPattern(pattern: TrendPattern): TrendPattern {
  return {
    ...pattern,
    niche: pattern.niche.trim().toLowerCase(),
    language: pattern.language.trim().toLowerCase(),
    hookPattern: pattern.hookPattern.trim(),
    structure: pattern.structure.map((item) => item.trim()).filter(Boolean),
    tone: pattern.tone.trim()
  };
}
