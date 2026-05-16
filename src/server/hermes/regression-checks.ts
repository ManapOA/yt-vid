import path from 'node:path';
import { getHermesRules } from './rules';
import { writeJsonFile } from '../utils';
import type { DesignPackage, HermesViolation } from '../../shared/types';

export async function runRegressionChecks({
  runDir,
  design
}: {
  runDir: string;
  design: DesignPackage;
}) {
  const rules = await getHermesRules();
  const violations: HermesViolation[] = [];

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
