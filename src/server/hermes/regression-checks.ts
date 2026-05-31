import path from 'node:path';
import { getHermesRules } from './rules';
import { writeJsonFile } from '../utils';
import type { DesignPackage, HermesViolation } from '../../shared/types';

export async function runRegressionChecks({
  runDir,
  design,
  autoContext
}: {
  runDir: string;
  design: DesignPackage;
  autoContext?: {
    material: {
      voiceover: { text: string; cta: string };
      poster: { title: string; facts: string[] };
      onScreenText: string[];
      rules: { maxDurationSec: number; language: string };
    };
    language: string;
    requestedDurationSec: number;
  };
}) {
  const rules = await getHermesRules();
  const violations: HermesViolation[] = [];
  const normalizedVoiceover = autoContext?.material.voiceover.text.toLowerCase() || '';
  const normalizedCta = autoContext?.material.voiceover.cta.toLowerCase() || '';

  for (const rule of rules) {
    if (rule.id === 'cta-no-onscreen-when-voiceover') {
      const broken = design.ctaPresentation.hasVoiceover && design.ctaPresentation.showOnScreenCta;
      if (broken) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_voiceover_has_cta' && autoContext) {
      const broken = !normalizedVoiceover.includes(normalizedCta) || !normalizedVoiceover.trim().endsWith(normalizedCta.trim());
      if (broken) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_cta_not_on_screen' && autoContext) {
      const surfaces = [...autoContext.material.onScreenText, autoContext.material.poster.title, ...autoContext.material.poster.facts]
        .join(' ')
        .toLowerCase();
      if (normalizedCta && surfaces.includes(normalizedCta)) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_duration_max_30_sec' && autoContext) {
      if (autoContext.material.rules.maxDurationSec > 30 || autoContext.requestedDurationSec > 30) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_poster_has_title_and_facts' && autoContext) {
      const broken = !autoContext.material.poster.title.trim() || autoContext.material.poster.facts.length < 2 || autoContext.material.poster.facts.length > 3;
      if (broken) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_language_matches_selected' && autoContext) {
      const selected = autoContext.language;
      const actual = autoContext.material.rules.language;
      if (selected !== actual) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }

    if (rule.id === 'auto_video_voiceover_human_style' && autoContext) {
      const markers = ['therefore', 'moreover', 'in conclusion', 'furthermore'];
      const broken = markers.some((item) => normalizedVoiceover.includes(item));
      if (broken) {
        violations.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.check
        });
      }
    }
  }

  const checksPayload = {
    createdAt: new Date().toISOString(),
    passed: violations.length === 0,
    violations
  };

  await writeJsonFile(path.join(runDir, 'hermes-checks.json'), checksPayload);

  const blocking = violations.filter((item) => item.severity === 'high' || item.severity === 'critical');
  if (blocking.length > 0) {
    throw new Error(`Hermes blocked render: ${blocking.map((item) => item.ruleId).join(', ')}`);
  }

  return checksPayload;
}
