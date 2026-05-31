import { config } from '../config';
import { CTA_FALLBACK } from '../../shared/constants';
import { generateWithGemini } from '../providers/gemini';
import { generateWithOpenRouter, openRouterSchemas } from '../providers/openrouter';
import type { Direction, LanguageCode, ScriptPackage } from '../../shared/types';
import { formatVoiceoverForSpeech, makeSpeechFriendlyLine, removeDirectTopicMention } from './speech';

const localTopicTranslations: Partial<Record<LanguageCode, Record<string, string>>> = {
  ru: {
    'zodiac signs that act fine but remember everything': 'знаки зодиака, которые делают вид, что все нормально, но помнят все'
  },
  kk: {
    'zodiac signs that act fine but remember everything': 'бәрі дұрыс сияқты көрінетін, бірақ бәрін есте сақтайтын жұлдыз белгілері'
  }
};

const directionFallbackAngles: Record<string, Record<LanguageCode, string[]>> = {
  'self-awareness': {
    en: ['Silence often says more than words do.', 'When someone matters, even a pause can feel painfully loud.'],
    ru: ['Иногда тишина говорит сильнее слов.', 'Когда человек важен, даже пауза ощущается слишком громко.'],
    kk: ['Кейде үнсіздік сөзден де қатты әсер етеді.', 'Адам маңызды болса, кідірістің өзі ауыр сезіледі.'],
    de: ['Manchmal sagt Stille mehr als Worte.', 'Wenn jemand wichtig ist, wirkt selbst eine Pause zu laut.'],
    es: ['A veces el silencio dice mas que las palabras.', 'Cuando alguien importa, hasta una pausa pesa demasiado.'],
    it: ['A volte il silenzio dice piu delle parole.', 'Quando una persona conta, anche una pausa pesa troppo.']
  },
  'relationship-decoder': {
    en: ['Some people pull away right after closeness because vulnerability scares them.', 'Distance is sometimes protection, not indifference.'],
    ru: ['Некоторые отдаляются сразу после сближения, потому что близость их пугает.', 'Иногда дистанция — это не равнодушие, а защита.'],
    kk: ['Кейбір адамдар жақындасқаннан кейін алыстап кетеді, өйткені осалдық оларды қорқытады.', 'Кейде қашықтық немқұрайлылық емес, қорғаныс болады.'],
    de: ['Manche ziehen sich nach Nahe zuruck, weil Verletzlichkeit sie erschreckt.', 'Distanz ist oft Schutz und nicht Gleichgultigkeit.'],
    es: ['Algunas personas se alejan despues de acercarse porque la vulnerabilidad las asusta.', 'A veces la distancia es proteccion, no desinteres.'],
    it: ['Alcune persone si allontanano dopo la vicinanza perche la vulnerabilita le spaventa.', 'A volte la distanza e protezione, non indifferenza.']
  },
  'zodiac-energy': {
    en: ['Some signs stay quiet, but they keep every detail inside.', 'What looks calm on the outside can be intense underneath.'],
    ru: ['Некоторые знаки молчат, но внутри запоминают каждую деталь.', 'То, что снаружи выглядит спокойно, внутри может быть очень сильным.'],
    kk: ['Кейбір белгілер үндемейді, бірақ іштей бәрін сақтап қояды.', 'Сырттай тыныш көрінген нәрсе іштей өте күшті болуы мүмкін.'],
    de: ['Manche Zeichen schweigen, behalten aber jedes Detail in sich.', 'Was aussen ruhig wirkt, kann innen sehr intensiv sein.'],
    es: ['Algunos signos callan, pero por dentro guardan cada detalle.', 'Lo que parece calma por fuera puede ser intensidad por dentro.'],
    it: ['Alcuni segni restano in silenzio, ma dentro si tengono ogni dettaglio.', 'Cio che sembra calma fuori puo essere intensita dentro.']
  },
  'mindset-patterns': {
    en: ['Overthinking often gets louder right before a real change.', 'The closer the shift, the harder the mind tries to control it.'],
    ru: ['Тревожные мысли часто усиливаются прямо перед реальными переменами.', 'Чем ближе сдвиг, тем сильнее ум пытается все контролировать.'],
    kk: ['Мазасыз ойлар көбіне үлкен өзгерістің алдында күшейеді.', 'Өзгеріс жақындаған сайын ақыл бәрін бақылауға тырысады.'],
    de: ['Overthinking wird oft kurz vor echten Veranderungen lauter.', 'Je naher die Wende, desto starker will der Kopf alles kontrollieren.'],
    es: ['Pensar demasiado suele hacerse mas fuerte antes de un cambio real.', 'Cuanto mas cerca esta el giro, mas intenta la mente controlarlo todo.'],
    it: ['I pensieri pesanti diventano piu forti proprio prima di un vero cambiamento.', 'Piu il cambio si avvicina, piu la mente prova a controllare tutto.']
  },
  'numerology-vibes': {
    en: ['Repeating numbers often hit harder when life feels unstable.', 'People notice patterns most when they are already searching for meaning.'],
    ru: ['Повторяющиеся числа сильнее цепляют именно в нестабильный период.', 'Люди чаще замечают знаки, когда уже ищут смысл и опору.'],
    kk: ['Қайталанатын сандар көбіне тұрақсыз кезеңде қаттырақ әсер етеді.', 'Адам мағына іздеген кезде белгілерді көбірек байқай бастайды.'],
    de: ['Wiederkehrende Zahlen treffen oft dann starker, wenn das Leben instabil wirkt.', 'Menschen sehen Muster vor allem dann, wenn sie schon nach Sinn suchen.'],
    es: ['Los numeros repetidos pegan mas cuando la vida se siente inestable.', 'La gente nota patrones justo cuando ya esta buscando sentido.'],
    it: ['I numeri ripetuti colpiscono di piu quando la vita sembra instabile.', 'Le persone vedono piu segnali quando stanno gia cercando un senso.']
  }
};

const localizedFallbacks: Record<LanguageCode, {
  hook: string;
  body: string[];
  description: (direction: string) => string;
}> = {
  en: {
    hook: 'Some people look calm, but they remember every shift in energy.',
    body: [
      'They may say nothing in the moment, then replay one look or one phrase for hours.',
      'What feels like distance is often just a very sharp emotional memory.'
    ],
    description: (direction) => `Short spoken script for ${direction}.`
  },
  ru: {
    hook: 'Некоторые делают вид, что все нормально, но внутри запоминают каждую мелочь.',
    body: [
      'Они могут промолчать сразу, но потом долго прокручивают в голове один взгляд или одну фразу.',
      'Со стороны это кажется холодом, хотя на деле человек просто чувствует глубже, чем показывает.'
    ],
    description: (direction) => `Короткий разговорный текст для направления ${direction}.`
  },
  kk: {
    hook: 'Кейбір адамдар сырттай сабырлы көрінеді, бірақ іштей бәрін есте сақтайды.',
    body: [
      'Олар сол сәтте үндемей қалуы мүмкін, бірақ кейін бір сөзді қайта-қайта ойлайды.',
      'Сырттай суық көрінгенімен, шын мәнінде олар бәрін тереңірек сезеді.'
    ],
    description: (direction) => `${direction} бағытына арналған қысқа ауызекі мәтін.`
  },
  de: {
    hook: 'Manche wirken ruhig, merken sich aber jede kleine Veranderung.',
    body: [
      'Sie sagen erst mal nichts, denken aber spater lange uber einen Blick oder einen Ton nach.',
      'Was kalt wirkt, ist oft einfach ein sehr feines emotionales Gedachtnis.'
    ],
    description: (direction) => `Kurzer gesprochener Text fur ${direction}.`
  },
  es: {
    hook: 'Hay personas que parecen tranquilas, pero recuerdan cada pequeno detalle.',
    body: [
      'Tal vez no digan nada en el momento, pero despues repasan una mirada o una frase por horas.',
      'Lo que parece frialdad a veces es sensibilidad que no se muestra.'
    ],
    description: (direction) => `Texto corto y hablado para ${direction}.`
  },
  it: {
    hook: 'Alcune persone sembrano tranquille, ma dentro si ricordano tutto.',
    body: [
      'Magari non dicono nulla subito, pero poi ripensano per ore a uno sguardo o a una frase.',
      'Quella che sembra freddezza spesso e solo sensibilita trattenuta.'
    ],
    description: (direction) => `Testo breve e parlato per ${direction}.`
  }
};

function repairMojibake(value: string) {
  const text = String(value || '');
  return /ÃƒÆ’.|ÃƒÂ.|Ãƒâ€˜./.test(text)
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
    'in this video',
    'this topic'
  ].some((marker) => text.includes(marker));
}

function isMostlyAscii(value: string) {
  return /^[\x00-\x7F\s"'!?.,:;()/\-]+$/.test(value.trim());
}

function titleFromHook(hook: string) {
  return String(hook || '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDirectionalLines(direction: Direction, language: LanguageCode) {
  return directionFallbackAngles[direction.id]?.[language]
    || directionFallbackAngles[direction.id]?.en
    || localizedFallbacks[language].body;
}

function getTopicSpecificLines(topic: string, language: LanguageCode) {
  const normalized = topic.toLowerCase();
  const lines: Array<{ match: string[]; text: Record<LanguageCode, string[]> }> = [
    {
      match: ['joke', 'overwhelmed'],
      text: {
        en: ['Some people start joking right when they are barely holding it together.', 'Humor can be the fastest way to hide panic before anyone notices.'],
        ru: ['Некоторые начинают шутить именно в тот момент, когда внутри уже слишком тяжело.', 'Юмор часто становится самым быстрым способом спрятать тревогу, пока ее никто не заметил.'],
        kk: ['Кейбір адамдар іште бәрі ауырлап кеткенде дәл сол сәтте қалжыңдай бастайды.', 'Әзіл кейде мазасыздықты жасырудың ең жылдам тәсіліне айналады.'],
        de: ['Manche fangen genau dann an zu scherzen, wenn innen schon alles zu viel wird.', 'Humor ist oft der schnellste Weg, innere Unruhe zu verstecken.'],
        es: ['Algunas personas empiezan a bromear justo cuando por dentro ya no pueden mas.', 'El humor suele ser la forma mas rapida de esconder la ansiedad.'],
        it: ['Alcune persone iniziano a scherzare proprio quando dentro stanno cedendo.', 'L umorismo spesso e il modo piu veloce per nascondere l ansia.']
      }
    },
    {
      match: ['silence', 'matters'],
      text: {
        en: ['Silence gets louder when the person matters more than we want to admit.', 'A pause can hurt because the mind fills it with meaning.'],
        ru: ['Тишина становится громче, когда человек значит больше, чем хочется признать.', 'Пауза ранит сильнее, потому что мозг сам заполняет ее смыслом.'],
        kk: ['Адам шынымен маңызды болса, үнсіздік бұрынғыдан да қатты сезіледі.', 'Кідіріс ауыр тиеді, өйткені оның орнын ой өздігінен толтырады.'],
        de: ['Stille wird lauter, wenn die Person wichtiger ist, als man zugeben will.', 'Eine Pause schmerzt mehr, weil der Kopf sie selbst mit Bedeutung fullt.'],
        es: ['El silencio pesa mas cuando esa persona importa mas de lo que admitimos.', 'Una pausa duele porque la mente la llena de significado.'],
        it: ['Il silenzio pesa di piu quando quella persona conta piu di quanto vogliamo ammettere.', 'Una pausa fa male perche la mente la riempie di significato.']
      }
    },
    {
      match: ['pull away', 'close'],
      text: {
        en: ['Some people pull away right after closeness because real intimacy scares them.', 'Distance can look cold, even when it starts from fear rather than indifference.'],
        ru: ['Некоторые отдаляются сразу после сближения, потому что настоящая близость их пугает.', 'Со стороны это выглядит холодно, хотя внутри там чаще страх, а не равнодушие.'],
        kk: ['Кейбір адамдар жақындасқаннан кейін алыстап кетеді, өйткені шынайы жақындық оларды қорқытады.', 'Сырттай бұл суықтық сияқты көрінеді, бірақ ішінде көбіне қорқыныш жатады.'],
        de: ['Manche ziehen sich nach Nahe zuruck, weil echte Intimitat ihnen Angst macht.', 'Von aussen wirkt das kalt, obwohl dahinter oft Angst und nicht Gleichgultigkeit steckt.'],
        es: ['Algunas personas se alejan justo despues de acercarse porque la intimidad real las asusta.', 'Por fuera parece frialdad, pero muchas veces es miedo y no desinteres.'],
        it: ['Alcune persone si allontanano subito dopo la vicinanza perche la vera intimita le spaventa.', 'Da fuori sembra freddezza, ma spesso sotto c e paura e non indifferenza.']
      }
    },
    {
      match: ['silent', 'arguing'],
      text: {
        en: ['Some signs go quiet instead of arguing because they shut down before they explode.', 'Silence is not always calm. Sometimes it is pressure with no safe exit.'],
        ru: ['Некоторые знаки замолкают вместо спора, потому что закрываются раньше, чем сорвутся.', 'Молчание — это не всегда спокойствие. Иногда это просто напряжение без безопасного выхода.'],
        kk: ['Кейбір белгілер дауласпай, үнсіз қалады, өйткені жарылардың алдында ішке жабылып кетеді.', 'Үнсіздік әрдайым тыныштық емес. Кейде ол — шығатын жолы жоқ қысым.'],
        de: ['Manche Zeichen werden still statt zu streiten, weil sie sich verschliessen, bevor sie explodieren.', 'Stille ist nicht immer Ruhe. Manchmal ist sie Druck ohne sicheren Ausgang.'],
        es: ['Algunos signos se callan en vez de discutir porque se cierran antes de explotar.', 'El silencio no siempre es calma. A veces es presion sin salida segura.'],
        it: ['Alcuni segni tacciono invece di discutere perche si chiudono prima di esplodere.', 'Il silenzio non e sempre calma. A volte e solo pressione senza sfogo.']
      }
    }
  ];

  for (const item of lines) {
    if (item.match.every((token) => normalized.includes(token))) {
      return item.text[language] || item.text.en;
    }
  }

  return null;
}

function buildTopicFallbackLines(topic: string, localizedTopic: string, language: LanguageCode, direction: Direction) {
  const subject = localizedTopic || topic;
  const shortSubject = subject
    .replace(/^why\s+/i, '')
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const variants: Record<LanguageCode, string[][]> = {
    en: [
      [`It starts with ${shortSubject}, but the real clue is the reaction after it.`, 'The moment feels small, then your mind keeps replaying it because something did not match.', 'That mismatch is usually where the truth leaks out.'],
      [`Most people notice ${shortSubject} too late.`, 'At first it looks normal, almost random, like nothing worth naming.', 'Then the pattern repeats and suddenly the whole mood makes sense.'],
      [`There is a quiet reason ${shortSubject} feels so personal.`, 'It touches the part of you that was already trying to read the room.', 'That is why a small shift can feel bigger than the actual words.']
    ],
    ru: [
      [`Сначала это выглядит как ${shortSubject}, но важнее реакция после.`, 'Момент кажется маленьким, а потом мозг снова и снова возвращается к нему.', 'Обычно именно в этом несовпадении и видно настоящее отношение.'],
      [`Многие слишком поздно замечают ${shortSubject}.`, 'Сначала это выглядит обычно, почти случайно, будто не о чем думать.', 'Но когда pattern повторяется, настроение сразу становится понятнее.'],
      [`Есть тихая причина, почему ${shortSubject} цепляет так лично.`, 'Это попадает туда, где ты уже пытался считать настроение человека.', 'Поэтому маленький сдвиг иногда ощущается громче, чем слова.']
    ],
    kk: [
      [`Басында бұл ${shortSubject} сияқты көрінеді, бірақ ең маңыздысы кейінгі реакция.`, 'Кішкентай сәт сияқты, бірақ ой қайта-қайта соған оралады.', 'Көбіне шын белгі дәл сол сәйкессіз жерде көрінеді.'],
      [`Көп адам ${shortSubject} дегенді кеш байқайды.`, 'Алғашында бұл жай нәрсе сияқты көрінеді.', 'Бірақ қайталанса, бүкіл көңіл-күй түсінікті бола бастайды.'],
      [`${shortSubject} неге қатты әсер ететінінің тыныш себебі бар.`, 'Ол сен адамның көңілін оқуға тырысқан жерге тиеді.', 'Сондықтан кішкентай өзгеріс сөзден де қатты сезіледі.']
    ],
    de: [
      [`Es beginnt mit ${shortSubject}, aber der eigentliche Hinweis ist die Reaktion danach.`, 'Der Moment wirkt klein, dann spielt der Kopf ihn immer wieder ab.', 'Genau in diesem Widerspruch zeigt sich oft die Wahrheit.'],
      [`Viele bemerken ${shortSubject} zu spat.`, 'Am Anfang wirkt es normal, fast zufallig.', 'Wenn sich das Muster wiederholt, ergibt die Stimmung plotzlich Sinn.'],
      [`Es gibt einen stillen Grund, warum ${shortSubject} so personlich wirkt.`, 'Es trifft den Teil in dir, der den Raum schon lesen wollte.', 'Darum kann eine kleine Verschiebung lauter wirken als Worte.']
    ],
    es: [
      [`Empieza con ${shortSubject}, pero la pista real esta en la reaccion despues.`, 'El momento parece pequeno, luego la mente lo repite una y otra vez.', 'En esa contradiccion suele escaparse la verdad.'],
      [`Mucha gente nota ${shortSubject} demasiado tarde.`, 'Al principio parece normal, casi casual.', 'Cuando el patron se repite, todo el ambiente empieza a tener sentido.'],
      [`Hay una razon silenciosa por la que ${shortSubject} se siente tan personal.`, 'Toca la parte de ti que ya intentaba leer el ambiente.', 'Por eso un cambio pequeno puede sentirse mas fuerte que las palabras.']
    ],
    it: [
      [`Inizia con ${shortSubject}, ma il vero segnale e la reazione dopo.`, 'Il momento sembra piccolo, poi la mente continua a ripeterlo.', 'In quella contraddizione spesso esce la verita.'],
      [`Molti notano ${shortSubject} troppo tardi.`, 'All inizio sembra normale, quasi casuale.', 'Quando il pattern si ripete, l atmosfera diventa chiara.'],
      [`C e un motivo silenzioso per cui ${shortSubject} sembra cosi personale.`, 'Tocca la parte di te che stava gia leggendo la stanza.', 'Per questo un piccolo cambio puo pesare piu delle parole.']
    ]
  };
  const options = variants[language] || variants.en;
  const offset = Math.abs([...`${topic}-${direction.id}`].reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return options[offset % options.length];
}

function normalizeGeneratedScript(script: ScriptPackage, direction: Direction, topic: string, localizedTopic: string, language: LanguageCode) {
  const localizedTitle = localizedTopic[0]?.toUpperCase() + localizedTopic.slice(1);
  const repairedHook = repairMojibake(script.hook);
  const repairedBody = script.body.map(repairMojibake);
  const repairedCta = repairMojibake(script.cta);
  const repairedTitle = repairMojibake(script.title);
  const repairedDescription = repairMojibake(script.description);

  const hook = makeSpeechFriendlyLine(removeDirectTopicMention(repairedHook, topic, localizedTitle));
  const body = repairedBody
    .map((line) => makeSpeechFriendlyLine(removeDirectTopicMention(line, topic, localizedTitle)))
    .filter(Boolean)
    .slice(0, 2);
  const cta = makeSpeechFriendlyLine(repairedCta);
  const titleLooksEnglish = looksTooEnglish(repairedTitle, language)
    || repairedTitle.trim().toLowerCase() === topic.trim().toLowerCase()
    || (language !== 'en' && isMostlyAscii(repairedTitle));
  const fallbackTitle = titleFromHook(hook) || localizedTitle;

  return {
    ...script,
    language,
    direction: direction.id,
    topic,
    hook,
    body,
    cta,
    voiceoverText: formatVoiceoverForSpeech([hook, ...body, cta].join(' ')),
    onScreenText: [hook, ...body].slice(0, 3),
    title: titleLooksEnglish ? fallbackTitle : repairedTitle,
    description: repairedDescription
  };
}

function fallbackScript(direction: Direction, topic: string, localizedTopic: string, language: LanguageCode, durationSeconds: number): ScriptPackage {
  const fallback = localizedFallbacks[language];
  const directionalLines = getTopicSpecificLines(topic, language)
    || buildTopicFallbackLines(topic, localizedTopic, language, direction)
    || getDirectionalLines(direction, language);
  const cta = CTA_FALLBACK[language];
  const hookBase = directionalLines[0] || fallback.hook;
  const bodyBase = directionalLines.slice(1, 3);
  const hook = makeSpeechFriendlyLine(removeDirectTopicMention(hookBase, topic, localizedTopic));
  const body = bodyBase.length > 0
    ? bodyBase.map((line) => makeSpeechFriendlyLine(removeDirectTopicMention(line, topic, localizedTopic)))
    : fallback.body.map((line) => makeSpeechFriendlyLine(removeDirectTopicMention(line, topic, localizedTopic)));

  return {
    language,
    direction: direction.id,
    topic,
    durationSeconds,
    hook,
    body,
    cta,
    voiceoverText: formatVoiceoverForSpeech(`${hook} ${body.join(' ')} ${cta}`),
    onScreenText: [hook, ...body].slice(0, 3),
    title: titleFromHook(hook) || (localizedTopic[0]?.toUpperCase() + localizedTopic.slice(1)),
    description: fallback.description(direction.name),
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
    `Localized topic for title and metadata: ${localizedTopic}`,
    `Language: ${language}`,
    `Target duration seconds: ${durationSeconds}`,
    `Everything except the "direction" id must be written in ${language}.`,
    'Do not answer in English unless language=en.',
    'Write like a human speaking naturally on camera.',
    'Do not repeat the full topic or title in the hook or body.',
    'Start directly with the emotional observation, not with meta phrases.',
    'Never write self-referential lines like "this topic", "short lines", "fast rhythm", "in this video".',
    'Use 1 hook, 2 short body lines, and 1 CTA.',
    'The CTA should be short and sound natural out loud.',
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

  return normalizeGeneratedScript(generated, direction, topic, localizedTopic, language);
}
