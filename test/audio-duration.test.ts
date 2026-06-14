import { describe, expect, it } from 'vitest';
import { getWavDurationSecFromBuffer, isWavBuffer } from '../src/server/pipeline/audio-duration';

function createWavWithDataChunkSize(seconds: number, dataChunkSize: number) {
  const sampleRate = 44100;
  const byteRate = sampleRate * 2;
  const dataSize = seconds * byteRate;
  const listSize = 26;
  const buffer = Buffer.alloc(12 + 8 + 16 + 8 + listSize + 8 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write('LIST', 36);
  buffer.writeUInt32LE(listSize, 40);

  const dataOffset = 36 + 8 + listSize;
  buffer.write('data', dataOffset);
  buffer.writeUInt32LE(dataChunkSize, dataOffset + 4);

  return buffer;
}

describe('getWavDurationSecFromBuffer', () => {
  it('uses the actual remaining bytes when a streamed WAV has an open-ended data chunk', () => {
    const buffer = createWavWithDataChunkSize(15, 0xffffffff);

    expect(isWavBuffer(buffer)).toBe(true);
    expect(getWavDurationSecFromBuffer(buffer)).toBe(15);
  });

  it('does not identify arbitrary bytes as WAV audio', () => {
    expect(isWavBuffer(Buffer.from('not audio'))).toBe(false);
  });
});
