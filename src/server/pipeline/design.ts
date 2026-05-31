import type { Direction, MultiScriptPackage } from '../../shared/types';
import { buildOpenDesignPackage } from '../providers/open-design';
import { resolveCtaPresentation } from './cta-policy';

export function createDesign(direction: Direction, bundle: MultiScriptPackage, options?: { forceVoiceOnlyCta?: boolean }) {
  const primary = bundle.languages[0];
  const baseCtaPresentation = resolveCtaPresentation({
    hasVoiceover: bundle.hasVoiceover,
    cta: primary.cta,
    voiceoverText: primary.voiceoverText
  });
  const ctaPresentation = options?.forceVoiceOnlyCta
    ? {
      ...baseCtaPresentation,
      showOnScreenCta: false,
      onScreenCtaText: null
    }
    : baseCtaPresentation;

  const updatedLanguages = bundle.languages.map((script) => ({
    ...script,
    voiceoverText: ctaPresentation.voiceoverText,
    onScreenText: ctaPresentation.showOnScreenCta
      ? [...script.onScreenText, ctaPresentation.onScreenCtaText || '']
      : script.onScreenText
  }));

  const design = buildOpenDesignPackage(
    direction,
    updatedLanguages[0].onScreenText,
    ctaPresentation
  );

  return {
    bundle: {
      ...bundle,
      languages: updatedLanguages
    },
    design
  };
}
