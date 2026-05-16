import type { MultiScriptPackage, ScriptPackage } from '../../shared/types';

export async function buildMultilingualScript(scripts: ScriptPackage[]): Promise<MultiScriptPackage> {
  const base = scripts[0];
  return {
    baseLanguage: base.language,
    directionId: base.direction,
    topic: base.topic,
    languages: scripts,
    hasVoiceover: false
  };
}
