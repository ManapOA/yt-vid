import fs from 'node:fs/promises';
import path from 'node:path';

export function slugify(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function sentence(value: string) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text : `${text}.`;
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
