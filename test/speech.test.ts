import { describe, expect, it } from 'vitest';
import { formatVoiceoverForDisplay, formatVoiceoverForSpeech } from '../src/server/pipeline/speech';

describe('speech formatting', () => {
  it('makes common Russian voiceover text easier for TTS without changing display text into phonetics', () => {
    const text = 'Кто-то шепнул: "Еще рано". Т.е. ответ был не так прост.';

    expect(formatVoiceoverForSpeech(text)).toContain('Кто то');
    expect(formatVoiceoverForSpeech(text)).toContain('Ещё');
    expect(formatVoiceoverForSpeech(text)).toContain('то есть');

    expect(formatVoiceoverForDisplay(text)).toContain('Кто-то');
    expect(formatVoiceoverForDisplay(text)).toContain('Ещё');
  });
});
