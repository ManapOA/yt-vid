import fs from 'node:fs/promises';
import path from 'node:path';

const cp1251ReverseMap = new Map<string, number>([
  ['Ђ', 0x80], ['Ѓ', 0x81], ['‚', 0x82], ['ѓ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86], ['‡', 0x87],
  ['€', 0x88], ['‰', 0x89], ['Љ', 0x8a], ['‹', 0x8b], ['Њ', 0x8c], ['Ќ', 0x8d], ['Ћ', 0x8e], ['Џ', 0x8f],
  ['ђ', 0x90], ['‘', 0x91], ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['™', 0x99], ['љ', 0x9a], ['›', 0x9b], ['њ', 0x9c], ['ќ', 0x9d], ['ћ', 0x9e], ['џ', 0x9f],
  ['Ў', 0xa1], ['ў', 0xa2], ['Ј', 0xa3], ['¤', 0xa4], ['Ґ', 0xa5], ['¦', 0xa6], ['§', 0xa7],
  ['Ё', 0xa8], ['©', 0xa9], ['Є', 0xaa], ['«', 0xab], ['¬', 0xac], ['®', 0xae], ['Ї', 0xaf],
  ['°', 0xb0], ['±', 0xb1], ['І', 0xb2], ['і', 0xb3], ['ґ', 0xb4], ['µ', 0xb5], ['¶', 0xb6], ['·', 0xb7],
  ['ё', 0xb8], ['№', 0xb9], ['є', 0xba], ['»', 0xbb], ['ј', 0xbc], ['Ѕ', 0xbd], ['ѕ', 0xbe], ['ї', 0xbf]
]);

for (let code = 0x0410; code <= 0x044f; code += 1) {
  cp1251ReverseMap.set(String.fromCharCode(code), code - 0x0410 + 0xc0);
}

function countCyrillic(value: string) {
  return (value.match(/[\u0400-\u04ff]/g) || []).length;
}

function looksLikeCyrillicMojibake(value: string) {
  return /(?:[РС][\u0400-\u04ff])|(?:вЂ)|(?:Р[°-я])|(?:С[°-я])/.test(value);
}

export function repairMojibake(value: string) {
  const text = String(value || '');
  if (!looksLikeCyrillicMojibake(text)) return text;

  const bytes: number[] = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (cp1251ReverseMap.has(char)) {
      bytes.push(cp1251ReverseMap.get(char)!);
    } else {
      return text;
    }
  }

  const repaired = Buffer.from(bytes).toString('utf8');
  return countCyrillic(repaired) >= countCyrillic(text) ? repaired : text;
}

export function repairMojibakeDeep<T>(value: T): T {
  if (typeof value === 'string') return repairMojibake(value) as T;
  if (Array.isArray(value)) return value.map((item) => repairMojibakeDeep(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairMojibakeDeep(item)])
    ) as T;
  }
  return value;
}

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
  await fs.writeFile(filePath, `${JSON.stringify(repairMojibakeDeep(value), null, 2)}\n`, 'utf8');
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
