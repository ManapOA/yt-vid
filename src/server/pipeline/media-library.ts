import path from 'node:path';
import type { HorrorStoryPart } from '../../shared/types';
import { config } from '../config';

export type BackgroundMedia = {
  kind: 'image';
  path: string;
};

type ShortTheme = 'mindset' | 'numerology' | 'psychology' | 'relationships' | 'zodiac';
type HorrorTheme = 'corridor' | 'forest' | 'house' | 'parking' | 'road';

const shortCollections: Record<ShortTheme, string[]> = {
  psychology: [
    'psychology-01.png',
    'psychology-02.png',
    'psychology-03.png',
    'psychology-04.png',
    'psychology-05.png'
  ],
  relationships: [
    'relationships-01.png',
    'relationships-02.png',
    'relationships-03.png',
    'relationships-04.png',
    'relationships-05.png'
  ],
  zodiac: [
    'zodiac-01.png',
    'zodiac-02.png',
    'zodiac-03.png',
    'zodiac-04.png',
    'zodiac-05.png'
  ],
  mindset: [
    'mindset-01.png',
    'mindset-02.png',
    'mindset-03.png',
    'mindset-04.png',
    'mindset-05.png'
  ],
  numerology: [
    'numerology-01.png',
    'numerology-02.png',
    'numerology-03.png',
    'numerology-04.png',
    'numerology-05.png'
  ]
};

const horrorCollections: Record<HorrorTheme, string[]> = {
  parking: ['parking-01.png', 'parking-02.png', 'parking-03.png', 'parking-04.png', 'parking-05.png'],
  forest: ['forest-01.png', 'forest-02.png', 'forest-03.png', 'forest-04.png', 'forest-05.png'],
  corridor: ['corridor-01.png', 'corridor-02.png', 'corridor-03.png', 'corridor-04.png', 'corridor-05.png'],
  house: ['house-01.png', 'house-02.png', 'house-03.png', 'house-04.png', 'house-05.png'],
  road: ['road-01.png', 'road-02.png', 'road-03.png', 'road-04.png', 'road-05.png']
};

const horrorPatterns: Array<{ theme: HorrorTheme; pattern: RegExp }> = [
  {
    theme: 'parking',
    pattern: /parking|garage|car park|parcheggio|autorimessa|garaje|aparcamiento|estacionamiento|parkplatz|parkhaus|tiefgarage|парков|гараж|тұрақ/i
  },
  {
    theme: 'forest',
    pattern: /forest|woods|trees|wald|bosque|foresta|лес|дерев|орман|ағаш|campfire|костер|костёр|fuoco/i
  },
  {
    theme: 'corridor',
    pattern: /corridor|hallway|stairwell|elevator|hospital|hotel|коридор|лестниц|лифт|больниц|pasillo|ascensor|flur|treppenhaus/i
  },
  {
    theme: 'house',
    pattern: /house|home|room|bedroom|basement|attic|дом|комнат|подвал|чердак|casa|habitación|haus|zimmer|keller|soffitta/i
  },
  {
    theme: 'road',
    pattern: /road|highway|street|tunnel|bridge|дорог|трасс|улиц|тоннел|puente|carretera|straße|autobahn|brücke/i
  }
];

function pick<T>(items: T[], random: () => number) {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function resolveImage(folder: string, file: string): BackgroundMedia {
  return {
    kind: 'image',
    path: path.join(config.root, 'assets', 'backgrounds', folder, file)
  };
}

function shortTheme(directionId: string): ShortTheme {
  if (directionId === 'relationship-decoder') return 'relationships';
  if (directionId === 'zodiac-energy') return 'zodiac';
  if (directionId === 'mindset-patterns') return 'mindset';
  if (directionId === 'numerology-vibes') return 'numerology';
  return 'psychology';
}

export function selectAutoBackground(
  directionId: string,
  _topic: string,
  random: () => number = Math.random
): BackgroundMedia {
  const theme = shortTheme(directionId);
  return resolveImage(`shorts/${theme}`, pick(shortCollections[theme], random));
}

export function selectHorrorBackground(
  part: HorrorStoryPart,
  random: () => number = Math.random
): BackgroundMedia {
  const searchable = `${part.title} ${part.text} ${part.visualPrompt}`;
  const theme = horrorPatterns.find(({ pattern }) => pattern.test(searchable))?.theme || 'forest';
  return resolveImage(`horror/${theme}`, pick(horrorCollections[theme], random));
}
