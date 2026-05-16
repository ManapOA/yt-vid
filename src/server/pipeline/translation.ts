import type { LanguageCode, MultiScriptPackage, ScriptPackage } from '../../shared/types';

const translations: Record<LanguageCode, { save: string; titlePrefix: string }> = {
  en: { save: 'Save this if it hit too close.', titlePrefix: '' },
  ru: { save: 'Сохрани, если это попало слишком точно.', titlePrefix: '' },
  de: { save: 'Speicher das, wenn es zu nah dran war.', titlePrefix: '' },
  es: { save: 'Guárdalo si te cayó demasiado exacto.', titlePrefix: '' },
  it: { save: 'Salvalo se ti è sembrato troppo preciso.', titlePrefix: '' }
};

export async function translateScriptPackage(base: ScriptPackage, language: LanguageCode): Promise<ScriptPackage> {
  if (base.language === language) return base;

  const translation = translations[language];
  return {
    ...base,
    language,
    cta: translation.save,
    voiceoverText: `${base.hook} ${base.body.join(' ')} ${translation.save}`,
    description: `${base.description} [${language.toUpperCase()}]`,
    tags: [...new Set([...base.tags, language])]
  };
}

export async function buildMultilingualScript(base: ScriptPackage, languages: LanguageCode[]): Promise<MultiScriptPackage> {
  const translated = await Promise.all(languages.map((language) => translateScriptPackage(base, language)));
  return {
    baseLanguage: base.language,
    directionId: base.direction,
    topic: base.topic,
    languages: translated,
    hasVoiceover: false
  };
}
