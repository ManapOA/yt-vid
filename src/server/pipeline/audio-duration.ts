import fs from 'node:fs/promises';

export function getWavDurationSecFromBuffer(buffer: Buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  const byteRate = buffer.readUInt32LE(28);
  if (!byteRate) return null;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkId === 'data') {
      const dataSize = chunkSize === 0xffffffff ? buffer.length - dataOffset : chunkSize;
      if (dataSize <= 0) return null;
      return Number((dataSize / byteRate).toFixed(2));
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

export async function getWavDurationSec(filePath: string | null) {
  if (!filePath) return null;
  const buffer = await fs.readFile(filePath);
  return getWavDurationSecFromBuffer(buffer);
}
