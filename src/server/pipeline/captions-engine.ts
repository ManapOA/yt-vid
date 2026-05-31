import type { AutoMaterial } from '../../shared/types';

export function buildOnScreenTextPayload(material: AutoMaterial) {
  return material.onScreenText
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}
