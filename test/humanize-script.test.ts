import { describe, expect, it } from 'vitest';
import { humanizeScript } from '../src/server/pipeline/humanize';

describe('humanizeScript', () => {
  it('removes direct topic repetition and meta phrasing from spoken text', () => {
    const result = humanizeScript({
      language: 'ru',
      direction: 'zodiac-energy',
      topic: 'zodiac signs that act fine but remember everything',
      durationSeconds: 20,
      hook: 'Иногда тема "знаки зодиака, которые делают вид, что все нормально, но помнят все" цепляет сильнее.',
      body: [
        'Фразы короткие, ритм быстрый, а смысл держится на одном точном наблюдении.',
        'Некоторые делают вид, что все нормально, но помнят каждую деталь.'
      ],
      cta: 'Сохрани это видео, если узнал себя.',
      voiceoverText: '',
      onScreenText: [],
      title: 'Знаки зодиака, которые делают вид, что все нормально, но помнят все',
      description: 'desc',
      tags: ['shorts']
    });

    expect(result.voiceoverText.toLowerCase()).not.toContain('иногда тема');
    expect(result.voiceoverText.toLowerCase()).not.toContain('фразы короткие');
    expect(result.voiceoverText.toLowerCase()).toContain('сохрани');
  });
});
