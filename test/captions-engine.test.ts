import { describe, expect, it } from 'vitest';
import { buildOnScreenTextPayload, removeTrailingCta } from '../src/server/pipeline/captions-engine';
import type { AutoMaterial } from '../src/shared/types';

const material: AutoMaterial = {
  topic: 'Focus',
  poster: {
    title: 'Why focus disappears',
    facts: ['Fact one', 'Fact two']
  },
  voiceover: {
    text: 'First complete sentence. Second complete sentence has several useful words. Save this for later.',
    cta: 'Save this for later.'
  },
  onScreenText: ['Generated summary one', 'Generated summary two'],
  youtube: {
    title: 'Focus',
    description: 'Focus description',
    tags: ['focus']
  },
  rules: {
    maxDurationSec: 30,
    ctaOnlyInVoice: true,
    language: 'en'
  }
};

describe('captions engine', () => {
  it('uses the complete voiceover body and excludes the CTA', () => {
    const captions = buildOnScreenTextPayload(material);
    const renderedText = captions.join(' ');

    expect(renderedText).toBe('First complete sentence. Second complete sentence has several useful words.');
    expect(renderedText).not.toContain(material.voiceover.cta);
    expect(renderedText).not.toContain('Generated summary');
  });

  it('removes a trailing CTA despite punctuation and whitespace differences', () => {
    expect(removeTrailingCta('Body text.   SAVE this for later!', 'Save this for later.')).toBe('Body text.');
  });

  it('keeps a long sentence whole on one screen', () => {
    const longSentence = 'This complete sentence contains enough words that it previously would have been split and left one word on the next screen.';
    const captions = buildOnScreenTextPayload({
      ...material,
      voiceover: {
        text: `${longSentence} ${material.voiceover.cta}`,
        cta: material.voiceover.cta
      }
    });

    expect(captions).toEqual([longSentence]);
  });
});
