import type { AutoMaterial } from '../../shared/types';

export function buildPosterPayload(material: AutoMaterial) {
  return {
    title: material.poster.title,
    facts: material.poster.facts.slice(0, 3)
  };
}
