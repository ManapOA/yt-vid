import { config } from '../config';
import type { TextGenerationSettings } from '../../shared/types';

export function resolveTextSettings(settings?: Partial<TextGenerationSettings> | null) {
  const provider = settings?.provider === 'cerebras' || settings?.provider === 'gemini' || settings?.provider === 'openrouter'
    ? settings.provider
    : config.llmProvider === 'gemini' ? 'gemini' : config.llmProvider === 'openrouter' ? 'openrouter' : 'cerebras';

  return {
    provider,
    cerebras: {
      ...config.cerebras,
      apiKey: provider === 'cerebras' && settings?.apiKey?.trim() ? settings.apiKey.trim() : config.cerebras.apiKey,
      model: provider === 'cerebras' && settings?.model?.trim() ? settings.model.trim() : config.cerebras.model
    },
    openrouter: {
      ...config.openrouter,
      apiKey: provider === 'openrouter' && settings?.apiKey?.trim() ? settings.apiKey.trim() : config.openrouter.apiKey,
      model: provider === 'openrouter' && settings?.model?.trim() ? settings.model.trim() : config.openrouter.model
    },
    gemini: {
      ...config.gemini,
      apiKey: provider === 'gemini' && settings?.apiKey?.trim() ? settings.apiKey.trim() : config.gemini.apiKey,
      model: provider === 'gemini' && settings?.model?.trim() ? settings.model.trim() : config.gemini.model
    }
  };
}
