import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { synthesizeCartesiaVoice } from '../providers/cartesia';
import type { MultiScriptPackage, VoiceArtifact } from '../../shared/types';
import { formatVoiceoverForDisplay, formatVoiceoverForSpeech } from './speech';
import { getWavDurationSecFromBuffer, isWavBuffer } from './audio-duration';

export async function createVoiceovers(runDir: string, bundle: MultiScriptPackage) {
  const artifacts: VoiceArtifact[] = [];

  for (const script of bundle.languages) {
    const transcript = formatVoiceoverForSpeech(script.voiceoverText);
    const displayTranscript = formatVoiceoverForDisplay(script.voiceoverText);
    const bytes = await synthesizeCartesiaVoice({
      apiKey: config.cartesia.apiKey,
      model: config.cartesia.model,
      version: config.cartesia.version,
      voiceId: config.cartesia.voices[script.language],
      outputContainer: config.cartesia.outputContainer,
      outputEncoding: config.cartesia.outputEncoding,
      sampleRate: config.cartesia.sampleRate,
      bitRate: config.cartesia.bitRate,
      language: script.language,
      transcript
    });
    const isWav = isWavBuffer(bytes);
    const fileName = `voice-${script.language}.${isWav ? 'wav' : 'mp3'}`;
    const absolutePath = path.join(runDir, fileName);
    await fs.writeFile(absolutePath, bytes);
    const durationSec = isWav
      ? getWavDurationSecFromBuffer(bytes)
      : null;

    if (durationSec) {
      script.durationSeconds = Math.max(3, Number(durationSec.toFixed(2)));
    }
    script.voiceoverText = displayTranscript;
    artifacts.push({
      language: script.language,
      fileName,
      relativePath: fileName,
      bytes: bytes.byteLength,
      durationSec: durationSec || undefined
    });
  }

  bundle.hasVoiceover = artifacts.length > 0;
  return artifacts;
}
