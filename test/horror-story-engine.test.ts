import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateHorrorStory,
  normalizeHorrorText,
  splitHorrorStoryIntoParts
} from '../src/server/pipeline/horror-story-engine';
import { generateStructuredWithLlm } from '../src/server/providers/llm';
import type { HorrorStoryDraft } from '../src/shared/types';

vi.mock('../src/server/providers/llm', () => ({
  generateStructuredWithLlm: vi.fn(async ({ fallback }) => fallback)
}));

const generateStructuredMock = vi.mocked(generateStructuredWithLlm);

describe('horror story series', () => {
  beforeEach(() => {
    generateStructuredMock.mockClear();
    generateStructuredMock.mockImplementation(async ({ fallback }) => fallback);
  });

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
    expect(parts.length).toBeLessThanOrEqual(4);
    expect(parts.every((part) => part.durationSec <= 60)).toBe(true);
    expect(parts.every((part) => part.onScreenText.length <= 4)).toBe(true);
    expect(parts.every((part) => part.onScreenText.every((line) => line.split(/\s+/).length <= 10))).toBe(true);
    expect(parts[0].cta).toContain('next part');
    expect(parts.at(-1)?.cta).toContain('Subscribe');
  });
  it('removes escaped paragraph markers returned by the model', () => {
    const story = {
      title: 'Escaped story',
      story: `First paragraph ends here.\\n\\nSecond paragraph starts here. ${'A quiet detail follows. '.repeat(8)}`,
      description: 'A test horror story.',
      tags: ['horror'],
      visualMotifs: ['fog', 'forest', 'light']
    };

    const parts = splitHorrorStoryIntoParts(story, 'en');

    expect(normalizeHorrorText(story.story)).not.toContain('\\n');
    expect(parts.flatMap((part) => part.onScreenText).join(' ')).not.toContain('\\n');
    expect(parts.map((part) => part.voiceoverText).join(' ')).not.toContain('\\n');
  });

  it('replaces an overlong model draft before it reaches rendering', async () => {
    const overlong: HorrorStoryDraft = {
      title: 'The Endless Road',
      story: Array.from(
        { length: 45 },
        (_, index) => `Sentence ${index + 1} keeps adding another detail while the road grows darker and the warning becomes harder to ignore.`
      ).join(' '),
      description: 'An intentionally overlong test story.',
      tags: ['horror'],
      visualMotifs: ['empty road', 'rear-view mirror', 'red light']
    };
    generateStructuredMock
      .mockResolvedValueOnce(overlong)
      .mockImplementationOnce(async ({ fallback }) => fallback);

    const story = await generateHorrorStory({
      language: 'en',
      style: 'urban-legend',
      voiceover: true,
      visualization: true
    });
    const words = story.story.split(/\s+/).length;

    expect(generateStructuredMock).toHaveBeenCalledTimes(2);
    expect(words).toBeGreaterThanOrEqual(120);
    expect(words).toBeLessThanOrEqual(300);
    expect(splitHorrorStoryIntoParts(story, 'en').length).toBeLessThanOrEqual(4);
  });
});
