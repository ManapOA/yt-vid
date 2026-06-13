import { describe, expect, it } from 'vitest';
import { splitHorrorStoryIntoParts } from '../src/server/pipeline/horror-story-engine';

describe('horror story series', () => {
  it('splits only between complete sentences and adds continuation CTAs', () => {
    const sentence = (index: number) => `Sentence ${index} contains enough words to build suspense without being cut in the middle of the screen.`;
    const story = {
      title: 'The Last Fire',
      story: Array.from({ length: 18 }, (_, index) => sentence(index + 1)).join(' '),
      description: 'A test horror story.',
      tags: ['horror'],
      visualMotifs: ['fire', 'forest', 'shadow']
    };

    const parts = splitHorrorStoryIntoParts(story, 'en');

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.durationSec <= 60)).toBe(true);
    expect(parts.flatMap((part) => part.onScreenText)).toHaveLength(18);
    expect(parts[0].cta).toContain('next part');
    expect(parts.at(-1)?.cta).toContain('Thank you');
    expect(parts.every((part) => part.onScreenText.every((line) => /[.!?…]$/.test(line)))).toBe(true);
  });
});
