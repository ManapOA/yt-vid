import { horrorStoryDraftSchema } from '../../shared/schemas';
import type {
  HorrorStoryDraft,
  HorrorStoryPart,
  HorrorStoryRequest,
  HorrorStyle,
  LanguageCode
} from '../../shared/types';
import { generateStructuredWithLlm } from '../providers/llm';

const TARGET_BODY_WORDS_PER_PART = 70;
const MAX_SERIES_PARTS = 4;
const MIN_STORY_WORDS = 120;
const MAX_STORY_WORDS = 300;

const styleDescriptions: Record<HorrorStyle, string> = {
  campfire: 'an intimate campfire tale that sounds believable when told aloud at night',
  'urban-legend': 'a modern urban legend with a familiar place, a warning, and an unsettling reveal',
  paranormal: 'a supernatural encounter with restrained details and escalating dread',
  psychological: 'a psychological horror story where ordinary details slowly become disturbing'
};

const ctaByLanguage: Record<LanguageCode, { next: string; final: string }> = {
  en: {
    next: 'The next part begins with what answered from the dark.',
    final: 'Subscribe for another story after dark.'
  },
  ru: {
    next: 'В следующей части станет ясно, кто ответил из темноты.',
    final: 'Подпишись на новую историю после заката.'
  },
  kk: {
    next: 'Келесі бөлімде қараңғылықтан кім жауап бергені белгілі болады.',
    final: 'Тағы бір қорқынышты оқиға үшін жазыл.'
  },
  de: {
    next: 'Im nächsten Teil zeigt sich, wer aus der Dunkelheit antwortete.',
    final: 'Abonniere für eine weitere Geschichte nach Einbruch der Dunkelheit.'
  },
  es: {
    next: 'La siguiente parte revela quién respondió desde la oscuridad.',
    final: 'Suscríbete para otra historia después del anochecer.'
  },
  it: {
    next: 'La prossima parte rivela chi ha risposto dal buio.',
    final: 'Iscriviti per un altra storia dopo il tramonto.'
  }
};

const partLabelByLanguage: Record<LanguageCode, string> = {
  en: 'Part',
  ru: 'Часть',
  kk: 'Бөлім',
  de: 'Teil',
  es: 'Parte',
  it: 'Parte'
};

function countWords(value: string) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function desiredPartCount(totalWords: number) {
  if (totalWords <= 85) return 1;
  return Math.min(MAX_SERIES_PARTS, Math.max(2, Math.round(totalWords / TARGET_BODY_WORDS_PER_PART)));
}

function groupSentences(sentences: string[]) {
  const totalWords = sentences.reduce((sum, sentence) => sum + countWords(sentence), 0);
  const targetParts = desiredPartCount(totalWords);
  const groups: string[][] = [];
  let current: string[] = [];
  let currentWords = 0;
  let remainingWords = totalWords;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    const remainingGroups = targetParts - groups.length;
    const targetWords = Math.ceil(remainingWords / Math.max(1, remainingGroups));

    if (current.length > 0 && groups.length < targetParts - 1 && currentWords + sentenceWords > targetWords) {
      groups.push(current);
      remainingWords -= currentWords;
      current = [];
      currentWords = 0;
    }

    current.push(sentence);
    currentWords += sentenceWords;
  }

  if (current.length > 0) groups.push(current);
  return groups;
}

function captionBeat(sentence: string) {
  const clean = normalizeHorrorText(sentence);
  const clause = clean.split(/[,;:—-]/)[0]?.trim() || clean;
  const tokens = clause.split(/\s+/).filter(Boolean);
  if (tokens.length <= 10) return clause;
  return `${tokens.slice(0, 9).join(' ')}…`;
}

function buildHorrorCaptions(group: string[]) {
  const candidates = group.map(captionBeat).filter(Boolean);
  if (candidates.length <= 4) return candidates;
  return [
    candidates[0],
    candidates[Math.floor(candidates.length / 2)],
    candidates.at(-1)!
  ];
}

export function normalizeHorrorText(value: string) {
  return String(value || '')
    .replace(/\\r\\n|\\n|\\r|\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIntoSentences(value: string) {
  return normalizeHorrorText(value)
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function fallbackStory(language: LanguageCode): HorrorStoryDraft {
  if (language === 'ru') {
    return {
      title: 'Тот, кто сидел за кругом света',
      story: [
        'Мы заметили его только после полуночи, когда костер стал ниже и лес вокруг будто придвинулся ближе.',
        'За последним рядом сосен сидел человек в старом плаще, но его лицо всегда оставалось за границей света.',
        'Никто не помнил, чтобы он приходил с нами, и все же на земле возле него стояла кружка из нашего лагеря.',
        'Каждый раз, когда кто-то поворачивался к палаткам, незнакомец оказывался на несколько шагов ближе.',
        'Мы решили не смотреть на него и продолжили рассказывать истории, словно ничего не происходит.',
        'Тогда из темноты раздался голос нашего друга Антона, который ушел за дровами почти час назад.',
        'Голос попросил не оборачиваться и сказал, что человек у костра умеет занимать место того, кто первым его заметит.',
        'В ту же секунду пустой стул рядом со мной тихо скрипнул, будто на него кто-то сел.',
        'Утром нас было столько же, сколько вечером, только никто не мог вспомнить имя человека в старом плаще.',
        'А на общей фотографии возле костра стоял Антон и держал руку на плече незнакомца, хотя Антон так и не вернулся.'
      ].join(' '),
      description: 'Атмосферная страшилка о ночном костре, незваном слушателе и друге, который не вернулся из леса.',
      tags: ['страшилка', 'история у костра', 'хоррор', 'мистика'],
      visualMotifs: ['ночной костер', 'черные сосны', 'силуэт в плаще', 'пустой стул', 'старая фотография']
    };
  }

  return {
    title: 'The Listener Beyond the Firelight',
    story: [
      'We noticed him after midnight, when the fire burned low and the forest seemed to move closer.',
      'A man in an old coat sat beyond the last row of trees, with his face always outside the light.',
      'Nobody remembered inviting him, yet one of our camping mugs rested beside his boots.',
      'Whenever someone looked toward the tents, the stranger appeared a few steps nearer.',
      'We agreed not to watch him and kept telling stories as though nothing had changed.',
      'Then our missing friend called from the darkness and warned us not to turn around.',
      'He said the listener could take the place of the first person who clearly saw his face.',
      'At that moment the empty chair beside me creaked as if someone had quietly sat down.',
      'By morning our group had the same number of people, but nobody could remember the stranger.',
      'In the photograph taken before sunrise, our missing friend stood beside him with a hand on his shoulder.'
    ].join(' '),
    description: 'A campfire horror story about an uninvited listener and a friend who never returned from the trees.',
    tags: ['horror story', 'campfire tale', 'urban legend', 'scary story'],
    visualMotifs: ['dying campfire', 'black pine forest', 'coat silhouette', 'empty chair', 'old photograph']
  };
}

function normalizeDraft(story: HorrorStoryDraft): HorrorStoryDraft {
  return {
    ...story,
    title: normalizeHorrorText(story.title),
    story: normalizeHorrorText(story.story),
    description: normalizeHorrorText(story.description),
    tags: story.tags.map(normalizeHorrorText).filter(Boolean),
    visualMotifs: story.visualMotifs.map(normalizeHorrorText).filter(Boolean)
  };
}

async function enforceHorrorStoryLength(
  story: HorrorStoryDraft,
  request: HorrorStoryRequest,
  fallback: HorrorStoryDraft
) {
  const normalized = normalizeDraft(story);
  const words = countWords(normalized.story);
  if (words >= MIN_STORY_WORDS && words <= MAX_STORY_WORDS) return normalized;

  const prompt = [
    `Rewrite this horror story in language code ${request.language}.`,
    `Keep it between ${MIN_STORY_WORDS} and ${MAX_STORY_WORDS} words.`,
    'Preserve one coherent plot, the central threat, and the final visual reveal.',
    'Open immediately with the anomaly or danger.',
    'Deliver a reveal or irreversible escalation every 55-80 words.',
    'Remove atmosphere-only setup, repetition, explanations, calls to action, and production notes.',
    'Keep sentences concise and natural when spoken aloud.',
    'Return the same JSON schema.',
    JSON.stringify(normalized)
  ].join('\n');

  const rewritten = await generateStructuredWithLlm({
    prompt,
    fallback,
    schema: horrorStoryDraftSchema
  });
  const result = normalizeDraft(rewritten);
  const rewrittenWords = countWords(result.story);
  if (rewrittenWords < MIN_STORY_WORDS || rewrittenWords > MAX_STORY_WORDS) {
    return normalizeDraft(fallback);
  }
  return result;
}

export async function generateHorrorStory(request: HorrorStoryRequest) {
  const fallback = fallbackStory(request.language);
  const prompt = [
    `Write an original horror story in language code ${request.language}.`,
    `Style: ${styleDescriptions[request.style]}.`,
    'The story must sound natural when told aloud during an evening gathering around a fire.',
    'Write one complete, coherent story designed for 2-4 short videos.',
    'Use 180-280 words total.',
    'The first sentence must contain the anomaly, warning, impossible detail, or immediate threat.',
    'Never begin with weather, friends gathering, or general atmosphere.',
    'Use escalating tension, concrete sensory details, and a memorable visual ending.',
    'Every 55-80 words must deliver a reveal or irreversible escalation.',
    'Prefer concrete threats, rules, objects, sounds, and actions over abstract mythology or poetic explanations.',
    'Keep sentences concise and natural when spoken aloud.',
    'Do not include calls to action, part numbers, production notes, or markdown.',
    'Avoid graphic gore and avoid copying known fictional characters or existing stories.',
    'Return JSON with title, story, description, tags, and 3-10 short visualMotifs.'
  ].join('\n');

  const story = await generateStructuredWithLlm({
    prompt,
    fallback,
    schema: horrorStoryDraftSchema
  });
  return enforceHorrorStoryLength(story, request, fallback);
}

export function splitHorrorStoryIntoParts(story: HorrorStoryDraft, language: LanguageCode): HorrorStoryPart[] {
  const normalizedStory = normalizeHorrorText(story.story);
  const sentences = splitIntoSentences(normalizedStory);
  const groups = groupSentences(sentences);
  if (groups.length === 0) groups.push([normalizedStory]);

  return groups.map((group, index) => {
    const isFinal = index === groups.length - 1;
    const cta = isFinal ? ctaByLanguage[language].final : ctaByLanguage[language].next;
    const text = group.join(' ');
    const voiceoverText = `${text} ${cta}`.trim();

    return {
      index: index + 1,
      total: groups.length,
      title: `${story.title} - ${partLabelByLanguage[language]} ${index + 1}/${groups.length}`,
      text,
      cta,
      voiceoverText,
      onScreenText: buildHorrorCaptions(group),
      visualPrompt: story.visualMotifs[index % story.visualMotifs.length] || story.title,
      durationSec: Math.min(60, Math.max(8, Number((countWords(voiceoverText) / 2.2).toFixed(2))))
    };
  });
}
