import type { ScriptPackage } from '../../shared/types';
import { formatVoiceoverForSpeech, makeSpeechFriendlyLine, removeDirectTopicMention } from './speech';

export function humanizeScript(script: ScriptPackage): ScriptPackage {
  const cleanedHook = makeSpeechFriendlyLine(removeDirectTopicMention(script.hook, script.topic, script.title));
  const body = script.body
    .map((line) => makeSpeechFriendlyLine(removeDirectTopicMention(line, script.topic, script.title)))
    .filter(Boolean)
    .map((line) => line.length > 110 ? line.slice(0, 107).trimEnd() + '...' : line);
  const hook = cleanedHook.length > 8 ? cleanedHook : makeSpeechFriendlyLine(script.title);
  const cta = makeSpeechFriendlyLine(script.cta);
  const onScreenText = [hook, ...body].slice(0, 3);
  const voiceoverText = formatVoiceoverForSpeech([hook, ...body, cta].join(' '));

  return {
    ...script,
    hook,
    body,
    cta,
    voiceoverText,
    onScreenText,
    title: String(script.title || '').replace(/\s+/g, ' ').trim(),
    description: String(script.description || '').replace(/\s+/g, ' ').trim()
  };
}
