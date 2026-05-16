import type { MultiScriptPackage, YouTubePackage } from '../../shared/types';

export function createYouTubePackage(bundle: MultiScriptPackage): YouTubePackage {
  const primary = bundle.languages[0];
  return {
    title: primary.title,
    description: primary.description,
    tags: primary.tags,
    fileName: 'youtube-package.json'
  };
}
