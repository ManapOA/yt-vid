import { describe, expect, it } from 'vitest';
import { resolveCtaPresentation } from '../src/server/pipeline/cta-policy';

describe('CTA policy', () => {
  it('does not render CTA on screen when voiceover is enabled', () => {
    const result = resolveCtaPresentation({
      hasVoiceover: true,
      cta: 'Save this if it feels real',
      voiceoverText: 'A short script about emotional distance.'
    });

    expect(result.showOnScreenCta).toBe(false);
    expect(result.onScreenCtaText).toBeNull();
    expect(result.voiceoverText.toLowerCase()).toContain('save this if it feels real');
  });
});
