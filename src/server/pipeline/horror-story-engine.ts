import { horrorStoryDraftSchema } from '../../shared/schemas';
import type {
  HorrorStoryDraft,
  HorrorStoryPart,
  HorrorStoryRequest,
  HorrorStyle,
  LanguageCode
} from '../../shared/types';
import { generateStructuredWithLlm } from '../providers/llm';

const MAX_BODY_WORDS_PER_PART = 100;

const styleDescriptions: Record<HorrorStyle, string> = {
  campfire: 'an intimate campfire tale that sounds believable when told aloud at night',
  'urban-legend': 'a modern urban legend with a familiar place, a warning, and an unsettling reveal',
  paranormal: 'a supernatural encounter with restrained details and escalating dread',
  psychological: 'a psychological horror story where ordinary details slowly become disturbing'
};

const ctaByLanguage: Record<LanguageCode, { next: string; final: string }> = {
  en: {
    next: 'The next part is linked in the description. Subscribe so you do not miss it.',
    final: 'Thank you for listening. Subscribe for more stories told after dark.'
  },
  ru: {
    next: 'Ссылка на следующую часть в описании. Подпишись, чтобы не пропустить продолжение.',
    final: 'Спасибо за просмотр. Подпишись, если хочешь больше страшных историй.'
  },
  kk: {
    next: 'Келесі бөлімге сілтеме сипаттамада. Жалғасын өткізіп алмау үшін жазыл.',
    final: 'Көргеніңе рақмет. Тағы да қорқынышты оқиғалар үшін жазыл.'
  },
  de: {
    next: 'Der Link zum nächsten Teil steht in der Beschreibung. Abonniere, damit du ihn nicht verpasst.',
    final: 'Danke fürs Zuschauen. Abonniere für weitere Geschichten nach Einbruch der Dunkelheit.'
  },
  es: {
    next: 'El enlace a la siguiente parte está en la descripción. Suscríbete para no perderla.',
    final: 'Gracias por escuchar. Suscríbete para más historias contadas en la oscuridad.'
  },
  it: {
    next: 'Il link alla parte successiva è nella descrizione. Iscriviti per non perderla.',
    final: 'Grazie per aver ascoltato. Iscriviti per altre storie raccontate nel buio.'
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

export function splitIntoSentences(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
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

export async function generateHorrorStory(request: HorrorStoryRequest) {
  const fallback = fallbackStory(request.language);
  const prompt = [
    `Write an original horror story in language code ${request.language}.`,
    `Style: ${styleDescriptions[request.style]}.`,
    'The story must sound natural when told aloud during an evening gathering around a fire.',
    'Write one complete, coherent story before it is divided into videos.',
    'Aim for 350 to 650 words, but let the narrative determine its natural length.',
    'Use escalating tension, concrete sensory details, and a memorable ending.',
    'Do not include calls to action, part numbers, production notes, or markdown.',
    'Avoid graphic gore and avoid copying known fictional characters or existing stories.',
    'Return JSON with title, story, description, tags, and 3-10 short visualMotifs.'
  ].join('\n');

  return generateStructuredWithLlm({
    prompt,
    fallback,
    schema: horrorStoryDraftSchema
  });
}

export function splitHorrorStoryIntoParts(story: HorrorStoryDraft, language: LanguageCode): HorrorStoryPart[] {
  const sentences = splitIntoSentences(story.story);
  const groups: string[][] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    if (current.length > 0 && currentWords + sentenceWords > MAX_BODY_WORDS_PER_PART) {
      groups.push(current);
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += sentenceWords;
  }

  if (current.length > 0) groups.push(current);
  if (groups.length === 0) groups.push([story.story.trim()]);

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
      onScreenText: group,
      visualPrompt: story.visualMotifs[index % story.visualMotifs.length] || story.title,
      durationSec: Math.min(60, Math.max(8, Number((countWords(voiceoverText) / 2.2).toFixed(2))))
    };
  });
}
