import type { ScriptPackage } from '../../shared/types';

function trimText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

function humanizeLine(value: string) {
  return trimText(value)
    .replace(/\btherefore\b/gi, 'so')
    .replace(/\bmoreover\b/gi, 'and')
    .replace(/\bin conclusion\b/gi, 'so here is the point');
}

export function humanizeScript(script: ScriptPackage): ScriptPackage {
  const body = script.body.map(humanizeLine).map((line) => line.length > 110 ? line.slice(0, 107).trimEnd() + '...' : line);
  const hook = humanizeLine(script.hook);
  const cta = humanizeLine(script.cta);
  const onScreenText = [hook, ...body];

  return {
    ...script,
    hook,
    body,
    cta,
    voiceoverText: [hook, ...body, cta].join(' '),
    onScreenText,
    title: trimText(script.title),
    description: trimText(script.description)
  };
}
