import type { AutoDirectionId, Direction, LanguageOption } from './types';

export const PROJECT_NAME = 'yt-vid';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
  { code: 'kk', label: 'Kazakh' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' }
];

export const DIRECTIONS: Direction[] = [
  {
    id: 'self-awareness',
    name: 'Self Awareness',
    summary: 'Entertaining self-reflection hooks with psychological tension.',
    audience: 'Viewers who like emotional pattern recognition.',
    style: 'aurora-glass',
    color: '#f46d43',
    category: 'psychology',
    autoCategory: 'psychology',
    topicSeeds: [
      'why some people joke when they are overwhelmed',
      'the habit that shows someone still cares',
      'why silence feels louder when someone matters'
    ]
  },
  {
    id: 'relationship-decoder',
    name: 'Relationship Decoder',
    summary: 'Behavior reads, trust, emotional distance, and mixed signals.',
    audience: 'Short-form relationship analysis viewers.',
    style: 'ember-signal',
    color: '#ff8c61',
    category: 'relationships',
    autoCategory: 'relationships',
    topicSeeds: [
      'why some people pull away right after getting close',
      'the quiet way someone tests if they can trust you',
      'when pride gets in the way of saying i miss you'
    ]
  },
  {
    id: 'zodiac-energy',
    name: 'Zodiac Energy',
    summary: 'Astrology-flavored identity hooks with strong retention.',
    audience: 'Zodiac and astrology entertainment viewers.',
    style: 'cosmic-grid',
    color: '#73c2fb',
    category: 'astrology',
    autoCategory: 'zodiac',
    topicSeeds: [
      'zodiac signs that act fine but remember everything',
      'why some signs go silent instead of arguing',
      'which signs read a tone change instantly'
    ]
  },
  {
    id: 'mindset-patterns',
    name: 'Mindset Patterns',
    summary: 'Ambition, self-control, overthinking, and identity framing.',
    audience: 'Personal growth and introspection viewers.',
    style: 'sage-frame',
    color: '#85b995',
    category: 'mindset',
    autoCategory: 'mindset',
    topicSeeds: [
      'why overthinking gets louder when success gets close',
      'the quiet ambition some people never announce',
      'why disciplined people still feel emotionally messy'
    ]
  },
  {
    id: 'numerology-vibes',
    name: 'Numerology Vibes',
    summary: 'Pattern-based numerology storytelling without visual clutter.',
    audience: 'Spiritual entertainment and numerology viewers.',
    style: 'prism-noir',
    color: '#b8a1ff',
    category: 'numerology',
    autoCategory: 'numerology',
    topicSeeds: [
      'why repeating numbers feel louder during a life shift',
      'the kind of person who waits for signs before a big move',
      'why some life path numbers feel calm outside but intense inside'
    ]
  }
];

export const AUTO_DIRECTIONS: Array<{
  id: AutoDirectionId;
  label: string;
  directionId?: string;
}> = [
  { id: 'psychology', label: 'Psychology', directionId: 'self-awareness' },
  { id: 'relationships', label: 'Relationships', directionId: 'relationship-decoder' },
  { id: 'zodiac', label: 'Zodiac', directionId: 'zodiac-energy' },
  { id: 'mindset', label: 'Mindset', directionId: 'mindset-patterns' },
  { id: 'numerology', label: 'Numerology', directionId: 'numerology-vibes' },
  { id: 'random', label: 'Random' }
];

export const CTA_FALLBACK = {
  en: 'Save this if it felt a little too accurate.',
  ru: 'Сохрани это видео, если узнал себя.',
  kk: 'Егер өзіңді танысаң, бұл видеоны сақтап қой.',
  de: 'Speichere das, wenn es sich etwas zu treffend angefühlt hat.',
  es: 'Guarda este video si te ha parecido demasiado preciso.',
  it: 'Salva questo video se ti è sembrato fin troppo preciso.'
};
