import { config } from '../config';
import { CTA_FALLBACK } from '../../shared/constants';
import { generateWithGemini } from '../providers/gemini';
import { generateWithOpenRouter, openRouterSchemas } from '../providers/openrouter';
import type { Direction, LanguageCode, ScriptPackage } from '../../shared/types';

const localTopicTranslations: Partial<Record<LanguageCode, Record<string, string>>> = {
  ru: {
    'why some people joke when they are overwhelmed': 'почему некоторые люди шутят, когда им слишком тяжело',
    'the habit that shows someone still cares': 'привычка, которая показывает, что человеку все еще не все равно',
    'why silence feels louder when someone matters': 'почему тишина ощущается громче, когда человек важен',
    'why some people pull away right after getting close': 'почему некоторые люди отдаляются сразу после сближения',
    'the quiet way someone tests if they can trust you': 'тихий способ, которым человек проверяет, можно ли тебе доверять',
    'when pride gets in the way of saying i miss you': 'когда гордость мешает сказать «я скучаю»',
    'zodiac signs that act fine but remember everything': 'знаки зодиака, которые делают вид, что все нормально, но помнят все',
    'why some signs go silent instead of arguing': 'почему некоторые знаки молчат вместо спора',
    'which signs read a tone change instantly': 'какие знаки мгновенно считывают смену тона',
    'why overthinking gets louder when success gets close': 'почему тревожные мысли становятся громче, когда успех уже близко',
    'the quiet ambition some people never announce': 'тихая амбиция, о которой некоторые люди никогда не говорят',
    'why disciplined people still feel emotionally messy': 'почему даже дисциплинированные люди внутри чувствуют хаос',
    'why repeating numbers feel louder during a life shift': 'почему повторяющиеся числа ощущаются громче в период жизненных перемен',
    'the kind of person who waits for signs before a big move': 'тип человека, который ждет знаков перед большим шагом',
    'why some life path numbers feel calm outside but intense inside': 'почему некоторые числа жизненного пути снаружи спокойны, а внутри очень интенсивны'
  },
  de: {
    'why some people joke when they are overwhelmed': 'warum manche menschen scherzen, wenn sie überfordert sind',
    'the habit that shows someone still cares': 'die angewohnheit, die zeigt, dass jemand sich immer noch kümmert',
    'why silence feels louder when someone matters': 'warum stille lauter wirkt, wenn jemand wichtig ist',
    'why some people pull away right after getting close': 'warum manche menschen sich direkt nach echter nähe zurückziehen',
    'the quiet way someone tests if they can trust you': 'die leise art, wie jemand prüft, ob er dir vertrauen kann',
    'when pride gets in the way of saying i miss you': 'wenn stolz im weg steht, um zu sagen ich vermisse dich',
    'zodiac signs that act fine but remember everything': 'sternzeichen, die so tun, als wäre alles okay, aber sich an alles erinnern',
    'why some signs go silent instead of arguing': 'warum manche sternzeichen still werden, statt zu streiten',
    'which signs read a tone change instantly': 'welche sternzeichen einen tonwechsel sofort bemerken',
    'why overthinking gets louder when success gets close': 'warum overthinking lauter wird, wenn erfolg näher rückt',
    'the quiet ambition some people never announce': 'der stille ehrgeiz, den manche menschen nie offen zeigen',
    'why disciplined people still feel emotionally messy': 'warum disziplinierte menschen sich innerlich trotzdem chaotisch fühlen',
    'why repeating numbers feel louder during a life shift': 'warum sich wiederholende zahlen in einer lebensveränderung lauter anfühlen',
    'the kind of person who waits for signs before a big move': 'der typ mensch, der vor einem großen schritt auf zeichen wartet',
    'why some life path numbers feel calm outside but intense inside': 'warum manche lebenszahlen außen ruhig und innen intensiv wirken'
  },
  es: {
    'why some people joke when they are overwhelmed': 'por qué algunas personas hacen bromas cuando están abrumadas',
    'the habit that shows someone still cares': 'el hábito que muestra que a alguien todavía le importas',
    'why silence feels louder when someone matters': 'por qué el silencio se siente más fuerte cuando alguien importa',
    'why some people pull away right after getting close': 'por qué algunas personas se alejan justo después de acercarse',
    'the quiet way someone tests if they can trust you': 'la forma silenciosa en que alguien prueba si puede confiar en ti',
    'when pride gets in the way of saying i miss you': 'cuando el orgullo se mete entre tú y decir te extraño',
    'zodiac signs that act fine but remember everything': 'signos del zodiaco que parecen estar bien pero recuerdan todo',
    'why some signs go silent instead of arguing': 'por qué algunos signos se quedan en silencio en vez de discutir',
    'which signs read a tone change instantly': 'qué signos detectan un cambio de tono al instante',
    'why overthinking gets louder when success gets close': 'por qué pensar demasiado se vuelve más fuerte cuando el éxito está cerca',
    'the quiet ambition some people never announce': 'la ambición silenciosa que algunas personas nunca anuncian',
    'why disciplined people still feel emotionally messy': 'por qué incluso las personas disciplinadas se sienten emocionalmente caóticas',
    'why repeating numbers feel louder during a life shift': 'por qué los números repetidos se sienten más fuertes durante un cambio de vida',
    'the kind of person who waits for signs before a big move': 'el tipo de persona que espera señales antes de un gran cambio',
    'why some life path numbers feel calm outside but intense inside': 'por qué algunos números de camino de vida parecen tranquilos por fuera pero intensos por dentro'
  },
  it: {
    'why some people joke when they are overwhelmed': 'perché alcune persone scherzano quando sono sopraffatte',
    'the habit that shows someone still cares': 'l’abitudine che fa capire che a qualcuno importa ancora',
    'why silence feels louder when someone matters': 'perché il silenzio sembra più forte quando una persona conta davvero',
    'why some people pull away right after getting close': 'perché alcune persone si allontanano subito dopo essersi avvicinate',
    'the quiet way someone tests if they can trust you': 'il modo silenzioso in cui qualcuno capisce se può fidarsi di te',
    'when pride gets in the way of saying i miss you': 'quando l’orgoglio si mette in mezzo al dire mi manchi',
    'zodiac signs that act fine but remember everything': 'segni zodiacali che fanno finta di stare bene ma ricordano tutto',
    'why some signs go silent instead of arguing': 'perché alcuni segni si chiudono nel silenzio invece di discutere',
    'which signs read a tone change instantly': 'quali segni colgono subito un cambio di tono',
    'why overthinking gets louder when success gets close': 'perché i pensieri diventano più forti quando il successo si avvicina',
    'the quiet ambition some people never announce': 'l’ambizione silenziosa che alcune persone non annunciano mai',
    'why disciplined people still feel emotionally messy': 'perché anche le persone disciplinate si sentono emotivamente in disordine',
    'why repeating numbers feel louder during a life shift': 'perché i numeri ripetuti sembrano più forti durante un cambiamento di vita',
    'the kind of person who waits for signs before a big move': 'il tipo di persona che aspetta segnali prima di fare un grande passo',
    'why some life path numbers feel calm outside but intense inside': 'perché alcuni numeri del percorso di vita sembrano calmi fuori ma intensi dentro'
  }
};

const localizedFallbacks: Record<LanguageCode, {
  hook: (topic: string) => string;
  body: string[];
  description: (topic: string, direction: string) => string;
}> = {
  en: {
    hook: (topic) => `Sometimes "${topic}" hits harder than it looks at first.`,
    body: [
      'It starts like a small observation, then turns into something instantly recognizable.',
      'Short lines, quick pacing, and one emotional detail keep the Short moving.'
    ],
    description: (topic, direction) => `${topic}. Built for ${direction}.`
  },
  ru: {
    hook: (topic) => `Иногда тема "${topic}" цепляет сильнее, чем кажется сначала.`,
    body: [
      'Сначала это выглядит как мелочь, но именно такие детали зритель узнает в себе.',
      'Фразы короткие, ритм быстрый, а смысл держится на одном точном наблюдении.'
    ],
    description: (topic, direction) => `${topic}. Собрано для направления ${direction}.`
  },
  de: {
    hook: (topic) => `Manchmal trifft "${topic}" stärker, als es zuerst wirkt.`,
    body: [
      'Es beginnt wie eine kleine Beobachtung und fühlt sich dann sofort vertraut an.',
      'Kurze Sätze, schnelles Tempo und ein emotionales Detail halten den Short zusammen.'
    ],
    description: (topic, direction) => `${topic}. Erstellt für ${direction}.`
  },
  es: {
    hook: (topic) => `A veces "${topic}" pega más fuerte de lo que parece al principio.`,
    body: [
      'Empieza como una observación pequeña y de pronto se siente demasiado reconocible.',
      'Frases cortas, ritmo rápido y un detalle emocional sostienen el Short.'
    ],
    description: (topic, direction) => `${topic}. Hecho para ${direction}.`
  },
  it: {
    hook: (topic) => `A volte "${topic}" colpisce più forte di quanto sembri all'inizio.`,
    body: [
      'Parte come una piccola osservazione e poi diventa subito fin troppo riconoscibile.',
      'Frasi corte, ritmo veloce e un dettaglio emotivo tengono insieme lo Short.'
    ],
    description: (topic, direction) => `${topic}. Creato per ${direction}.`
  }
};

function repairMojibake(value: string) {
  const text = String(value || '');
  return /Ãƒ.|Ã.|Ã‘./.test(text)
    ? Buffer.from(text, 'latin1').toString('utf8')
    : text;
}

async function translateTopic(topic: string, language: LanguageCode) {
  if (language === 'en') return topic;
  const exactLocalTranslation = localTopicTranslations[language]?.[topic.trim().toLowerCase()];
  if (exactLocalTranslation) return exactLocalTranslation;

  const prompt = [
    `Translate this short-form video topic into ${language}.`,
    'Keep it natural and concise.',
    'Return only the translated topic, no JSON, no explanation.',
    `Topic: ${topic}`
  ].join('\n');

  try {
    if (config.llmProvider === 'gemini' && config.gemini.apiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });
      if (response.ok) {
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text || '').join('').trim();
        if (text) return repairMojibake(text.replace(/^["']|["']$/g, ''));
      }
    }

    if (config.openrouter.apiKey) {
      const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openrouter.siteUrl,
          'X-Title': config.openrouter.appName
        },
        body: JSON.stringify({
          model: config.openrouter.model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'Return only the translated topic text.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (response.ok) {
        const payload = await response.json();
        const text = payload?.choices?.[0]?.message?.content?.trim();
        if (text) return repairMojibake(text.replace(/^["']|["']$/g, ''));
      }
    }
  } catch {
    return topic;
  }

  return topic;
}

function looksTooEnglish(value: string, language: LanguageCode) {
  if (language === 'en') return false;
  const text = String(value || '').toLowerCase();
  return [
    'sometimes',
    'it starts like',
    'short lines',
    'built for',
    'save this',
    'hits harder'
  ].some((marker) => text.includes(marker));
}

function isMostlyAscii(value: string) {
  return /^[\x00-\x7F\s"'!?.,:;()/\-]+$/.test(value.trim());
}

function normalizeLocalizedScript(
  script: ScriptPackage,
  direction: Direction,
  topic: string,
  localizedTopic: string,
  language: LanguageCode
): ScriptPackage {
  const localizedTitle = localizedTopic[0]?.toUpperCase() + localizedTopic.slice(1);
  const repaired: ScriptPackage = {
    ...script,
    language,
    direction: direction.id,
    topic,
    hook: repairMojibake(script.hook),
    body: script.body.map(repairMojibake),
    cta: repairMojibake(script.cta),
    voiceoverText: repairMojibake(script.voiceoverText),
    onScreenText: script.onScreenText.map(repairMojibake),
    title: repairMojibake(script.title),
    description: repairMojibake(script.description)
  };

  if (
    looksTooEnglish(repaired.hook, language)
    || looksTooEnglish(repaired.body.join(' '), language)
    || looksTooEnglish(repaired.description, language)
  ) {
    const fallback = localizedFallbacks[language];
    const cta = CTA_FALLBACK[language];
    return {
      ...repaired,
      hook: fallback.hook(localizedTopic),
      body: fallback.body,
      cta,
      voiceoverText: [fallback.hook(localizedTopic), ...fallback.body, cta].join(' '),
      onScreenText: [fallback.hook(localizedTopic), ...fallback.body],
      title: localizedTitle,
      description: fallback.description(topic, direction.name)
    };
  }

  const titleLooksEnglish = looksTooEnglish(repaired.title, language)
    || repaired.title.trim().toLowerCase() === topic.trim().toLowerCase()
    || (language !== 'en' && isMostlyAscii(repaired.title));

  return {
    ...repaired,
    title: titleLooksEnglish ? localizedTitle : repaired.title
  };
}

function fallbackScript(
  direction: Direction,
  topic: string,
  localizedTopic: string,
  language: LanguageCode,
  durationSeconds: number
): ScriptPackage {
  const fallback = localizedFallbacks[language];
  const cta = CTA_FALLBACK[language];
  const hook = fallback.hook(localizedTopic);
  const body = fallback.body;

  return {
    language,
    direction: direction.id,
    topic,
    durationSeconds,
    hook,
    body,
    cta,
    voiceoverText: `${hook} ${body.join(' ')} ${cta}`,
    onScreenText: [hook, ...body],
    title: localizedTopic[0].toUpperCase() + localizedTopic.slice(1),
    description: fallback.description(topic, direction.name),
    tags: ['shorts', direction.category, language, 'yt-vid']
  };
}

export async function generateScript(direction: Direction, topic: string, language: LanguageCode, durationSeconds: number) {
  const localizedTopic = await translateTopic(topic, language);
  const fallback = fallbackScript(direction, topic, localizedTopic, language, durationSeconds);
  const prompt = [
    'Create a native short-form script for a YouTube Short.',
    `Direction: ${direction.name}`,
    `Original topic: ${topic}`,
    `Localized topic to use in the script: ${localizedTopic}`,
    `Language: ${language}`,
    `Duration seconds: ${durationSeconds}`,
    `Everything except the "direction" id must be written in ${language}.`,
    'Do not answer in English unless language=en.',
    'Style: natural, short phrases, entertainment + self-reflection, no AI-generic tone.',
    'Return {"language","direction","topic","durationSeconds","hook","body","cta","voiceoverText","onScreenText","title","description","tags"}.'
  ].join('\n');

  const generated = await (config.llmProvider === 'gemini'
    ? generateWithGemini({
      prompt,
      fallback,
      schema: openRouterSchemas.script,
      model: config.gemini.model,
      apiKey: config.gemini.apiKey
    })
    : generateWithOpenRouter({
      prompt,
      fallback,
      schema: openRouterSchemas.script,
      model: config.openrouter.model,
      apiKey: config.openrouter.apiKey,
      baseUrl: config.openrouter.baseUrl,
      siteUrl: config.openrouter.siteUrl,
      appName: config.openrouter.appName
    }));

  return normalizeLocalizedScript(generated, direction, topic, localizedTopic, language);
}
