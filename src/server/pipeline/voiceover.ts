import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { synthesizeCartesiaVoice } from '../providers/cartesia';
import type { MultiScriptPackage, VoiceArtifact } from '../../shared/types';
import { formatVoiceoverForSpeech } from './speech';

function getWavDurationSec(buffer: Buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  const byteRate = buffer.readUInt32LE(28);
  if (!byteRate) return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      return Number((chunkSize / byteRate).toFixed(2));
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}

export async function createVoiceovers(runDir: string, bundle: MultiScriptPackage) {
  const artifacts: VoiceArtifact[] = [];

  for (const script of bundle.languages) {
    const transcript = formatVoiceoverForSpeech(script.voiceoverText);
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
    const fileName = `voice-${script.language}.${config.cartesia.outputContainer === 'mp3' ? 'mp3' : 'wav'}`;
    const absolutePath = path.join(runDir, fileName);
    await fs.writeFile(absolutePath, bytes);
    const durationSec = config.cartesia.outputContainer === 'wav'
      ? getWavDurationSec(bytes)
      : null;

    if (durationSec) {
      script.durationSeconds = Math.max(3, Number(durationSec.toFixed(2)));
    }
    script.voiceoverText = transcript;
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
