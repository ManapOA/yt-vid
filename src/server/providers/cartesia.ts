import type { LanguageCode } from '../../shared/types';

function createSilentWav(seconds = 3, sampleRate = 44100) {
  const samples = seconds * sampleRate;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

export async function synthesizeCartesiaVoice({
  apiKey,
  model,
  version,
  voiceId,
  outputContainer,
  outputEncoding,
  sampleRate,
  bitRate,
  language,
  transcript
}: {
  apiKey: string;
  model: string;
  version: string;
  voiceId: string;
  outputContainer: string;
  outputEncoding: string;
  sampleRate: number;
  bitRate: number;
  language: LanguageCode;
  transcript: string;
}) {
  if (!apiKey || !voiceId) {
    return createSilentWav(Math.max(2, Math.ceil(transcript.split(/\s+/).length / 3)), sampleRate);
  }

  const response = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Cartesia-Version': version,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_id: model,
      transcript,
      language,
      voice: {
        mode: 'id',
        id: voiceId
      },
      output_format: outputContainer === 'mp3'
        ? { container: 'mp3', sample_rate: sampleRate, bit_rate: bitRate }
        : { container: 'wav', encoding: outputEncoding, sample_rate: sampleRate }
    })
  });

  if (!response.ok) {
    return createSilentWav(Math.max(2, Math.ceil(transcript.split(/\s+/).length / 3)), sampleRate);
  }

  return Buffer.from(await response.arrayBuffer());
}
