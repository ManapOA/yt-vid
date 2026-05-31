import { describe, expect, it } from 'vitest';
import { validateAutoMaterial } from '../src/server/pipeline/auto-video-validation';

describe('auto video validation', () => {
  it('keeps CTA only in the final voiceover segment', async () => {
    const result = await validateAutoMaterial({
      topic: 'Почему нас тянет к тем, кто нас игнорирует',
      poster: {
        title: 'Почему тянет к игнору?',
        facts: [
          'Редкое внимание цепляет сильнее обычного',
          'Тревога часто маскируется под интерес',
          'Незавершенность усиливает привязанность'
        ]
      },
      voiceover: {
        text: 'Иногда нас тянет не к человеку, а к ожиданию его внимания. Когда тепло приходит редко, мозг начинает ждать еще сильнее. Так тревога легко маскируется под чувства. Если узнал себя, сохрани это видео и пересмотри позже.',
        cta: 'Если узнал себя, сохрани это видео и пересмотри позже.'
      },
      onScreenText: [
        'Это не всегда любовь',
        'Иногда это тревожная привязанность',
        'Редкое внимание цепляет сильнее'
      ],
      youtube: {
        title: 'Почему тянет к игнору?',
        description: 'Короткое видео о психологии привязанности.',
        tags: ['психология', 'отношения', 'shorts']
      },
      rules: {
        maxDurationSec: 30,
        ctaOnlyInVoice: true,
        language: 'ru'
      }
    });

    expect(result.material.voiceover.text.endsWith(result.material.voiceover.cta)).toBe(true);
    expect(result.material.poster.facts).toHaveLength(3);
    expect(result.estimatedDurationSec).toBeLessThanOrEqual(30);
  });

  it('rejects CTA on screen', async () => {
    await expect(validateAutoMaterial({
      topic: 'Topic',
      poster: {
        title: 'Save this now',
        facts: ['Fact one', 'Fact two']
      },
      voiceover: {
        text: 'This is a short voiceover. Save this now.',
        cta: 'Save this now.'
      },
      onScreenText: ['Fact one', 'Save this now'],
      youtube: {
        title: 'Topic',
        description: 'Desc',
        tags: ['shorts']
      },
      rules: {
        maxDurationSec: 30,
        ctaOnlyInVoice: true,
        language: 'en'
      }
    })).rejects.toThrow(/CTA must not appear/);
  });
});
