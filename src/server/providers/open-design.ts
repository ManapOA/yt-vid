import type { Direction, DesignPackage } from '../../shared/types';

const themeMap: Record<string, DesignPackage['gradient']> = {
  'self-awareness': ['#22151b', '#694134', '#f46d43'],
  'relationship-decoder': ['#111827', '#6b2d5c', '#ff8c61'],
  'zodiac-energy': ['#0d1224', '#24507a', '#73c2fb'],
  'mindset-patterns': ['#12211b', '#35574a', '#85b995'],
  'numerology-vibes': ['#171227', '#58498f', '#b8a1ff']
};

export function buildOpenDesignPackage(direction: Direction, captions: string[], ctaPresentation: DesignPackage['ctaPresentation']): DesignPackage {
  return {
    directionId: direction.id,
    theme: direction.style,
    gradient: themeMap[direction.id] || ['#121212', '#333333', '#999999'],
    captions,
    ctaPresentation,
    scenes: captions.map((text, index) => ({
      id: `scene-${index + 1}`,
      text,
      accent: index === 0 || index === captions.length - 1
    }))
  };
}
