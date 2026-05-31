import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runRegressionChecks } from '../src/server/hermes/regression-checks';

const createdDirs: string[] = [];

afterEach(async () => {
  await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('Hermes regression checks', () => {
  it('catches high severity rule violations', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-vid-hermes-'));
    createdDirs.push(dir);

    await expect(runRegressionChecks({
      runDir: dir,
      design: {
        directionId: 'self-awareness',
        theme: 'aurora-glass',
        gradient: ['#000', '#111', '#222'],
        captions: ['a'],
        ctaPresentation: {
          hasVoiceover: true,
          cta: 'Save this.',
          voiceoverText: 'Save this.',
          showOnScreenCta: true,
          onScreenCtaText: 'Save this.'
        },
        scenes: [{ id: 'scene-1', text: 'a', accent: true }]
      }
    })).rejects.toThrow(/Hermes blocked render/);

    const checks = JSON.parse(await fs.readFile(path.join(dir, 'hermes-checks.json'), 'utf8'));
    expect(checks.passed).toBe(false);
    expect(checks.violations[0].ruleId).toBe('cta-no-onscreen-when-voiceover');
  });

  it('blocks auto videos when CTA leaks on screen', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-vid-hermes-auto-'));
    createdDirs.push(dir);

    await expect(runRegressionChecks({
      runDir: dir,
      design: {
        directionId: 'self-awareness',
        theme: 'aurora-glass',
        gradient: ['#000', '#111', '#222'],
        captions: ['a'],
        ctaPresentation: {
          hasVoiceover: true,
          cta: 'Save this now.',
          voiceoverText: 'Short thought. Save this now.',
          showOnScreenCta: false,
          onScreenCtaText: null
        },
        scenes: [{ id: 'scene-1', text: 'a', accent: true }]
      },
      autoContext: {
        material: {
          voiceover: {
            text: 'Short thought. Save this now.',
            cta: 'Save this now.'
          },
          poster: {
            title: 'Save this now.',
            facts: ['Fact one', 'Fact two']
          },
          onScreenText: ['Fact one', 'Save this now.'],
          rules: {
            maxDurationSec: 30,
            language: 'en'
          }
        },
        language: 'en',
        requestedDurationSec: 30
      }
    })).rejects.toThrow(/auto_video_cta_not_on_screen/);
  });
});
