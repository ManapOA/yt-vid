import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { synthesizeCartesiaVoice } from '../providers/cartesia';
import type { MultiScriptPackage, VoiceArtifact } from '../../shared/types';

export async function createVoiceovers(runDir: string, bundle: MultiScriptPackage) {
  const artifacts: VoiceArtifact[] = [];

  for (const script of bundle.languages) {
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
      transcript: script.voiceoverText
    });
    const fileName = `voice-${script.language}.${config.cartesia.outputContainer === 'mp3' ? 'mp3' : 'wav'}`;
    const absolutePath = path.join(runDir, fileName);
    await fs.writeFile(absolutePath, bytes);
    artifacts.push({
      language: script.language,
      fileName,
      relativePath: fileName,
      bytes: bytes.byteLength
    });
  }

  bundle.hasVoiceover = artifacts.length > 0;
  return artifacts;
}
