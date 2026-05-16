import type { CtaPresentation } from '../../shared/types';
import { sentence } from '../utils';

function voiceoverContainsCta(voiceoverText: string, cta: string) {
  const voice = voiceoverText.toLowerCase();
  const target = cta.toLowerCase();
  return voice.includes(target);
}

export function resolveCtaPresentation({
  hasVoiceover,
  cta,
  voiceoverText
}: {
  hasVoiceover: boolean;
  cta: string;
  voiceoverText: string;
}): CtaPresentation {
  const cleanCta = sentence(cta);
  const cleanVoiceover = sentence(voiceoverText);
  const finalVoiceover = hasVoiceover && !voiceoverContainsCta(cleanVoiceover, cleanCta)
    ? `${cleanVoiceover} ${cleanCta}`.trim()
    : cleanVoiceover;

  return {
    hasVoiceover,
    cta: cleanCta,
    voiceoverText: finalVoiceover,
    showOnScreenCta: !hasVoiceover,
    onScreenCtaText: hasVoiceover ? null : cleanCta
  };
}
