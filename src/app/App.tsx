import { useEffect, useMemo, useState } from 'react';
import { PreviewPhone } from '../components/PreviewPhone';
import { AUTO_DIRECTIONS, DIRECTIONS, LANGUAGES } from '../shared/constants';
import type {
  AutoDirectionId,
  AutoVideoResult,
  CreateVideoPayload,
  DesignPackage,
  LanguageCode,
  RunRecord,
  ScriptPackage,
  TextGenerationSettings,
  TextProviderId,
  TopicCandidate
} from '../shared/types';

type ScriptDraft = {
  hook: string;
  body: string;
  cta: string;
  title: string;
  description: string;
  tags: string;
  onScreenText: string;
};

const emptyDraft: ScriptDraft = {
  hook: '',
  body: '',
  cta: '',
  title: '',
  description: '',
  tags: '',
  onScreenText: ''
};

const textSettingsStorageKey = 'yt-vid:text-settings';

function readStoredTextSettings(): TextGenerationSettings {
  if (typeof window === 'undefined') return { provider: 'openrouter' };
  try {
    const stored = JSON.parse(window.localStorage.getItem(textSettingsStorageKey) || '{}') as Partial<TextGenerationSettings>;
    return {
      provider: stored.provider === 'gemini' ? 'gemini' : 'openrouter',
      apiKey: stored.apiKey || ''
    };
  } catch {
    return { provider: 'openrouter', apiKey: '' };
  }
}

function resolveDirectionIdFromAuto(direction: AutoDirectionId) {
  return AUTO_DIRECTIONS.find((item) => item.id === direction)?.directionId || null;
}

export function App() {
  const [directionId, setDirectionId] = useState(DIRECTIONS[0].id);
  const [topicCandidates, setTopicCandidates] = useState<TopicCandidate[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [languages, setLanguages] = useState<LanguageCode[]>(['en']);
  const [scripts, setScripts] = useState<ScriptPackage[]>([]);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [drafts, setDrafts] = useState<Record<string, ScriptDraft>>({});
  const [design, setDesign] = useState<DesignPackage | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);
  const [selectedRunLanguage, setSelectedRunLanguage] = useState<LanguageCode>('en');
  const [hasVoiceover, setHasVoiceover] = useState(true);
  const [status, setStatus] = useState('Ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [autoDirection, setAutoDirection] = useState<AutoDirectionId>('psychology');
  const [autoLanguage, setAutoLanguage] = useState<LanguageCode>('ru');
  const [autoCount, setAutoCount] = useState(1);
  const [autoStatus, setAutoStatus] = useState('Idle');
  const [autoError, setAutoError] = useState('');
  const [autoResult, setAutoResult] = useState<AutoVideoResult | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [showTopicCandidates, setShowTopicCandidates] = useState(false);
  const [textSettings, setTextSettings] = useState<TextGenerationSettings>(() => readStoredTextSettings());

  useEffect(() => {
    void refreshRuns();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(textSettingsStorageKey, JSON.stringify(textSettings));
  }, [textSettings]);

  useEffect(() => {
    if (languages.length === 0) return;
    void generateTopics(true);
  }, [directionId, languages[0]]);

  useEffect(() => {
    resetCurrentScriptState('Ready');
  }, [directionId]);

  useEffect(() => {
    setLanguages((current) => {
      if (current[0] === autoLanguage && current.length === 1) return current;
      return [autoLanguage];
    });
    setActiveLanguage(autoLanguage);
  }, [autoLanguage]);

  const activeScript = useMemo(
    () => scripts.find((item) => item.language === activeLanguage) || scripts[0] || null,
    [activeLanguage, scripts]
  );
  const activeDraft = activeScript ? drafts[activeScript.language] || toDraft(activeScript) : emptyDraft;

  function requestTextSettings(): TextGenerationSettings {
    return {
      provider: textSettings.provider,
      apiKey: textSettings.apiKey?.trim() || undefined
    };
  }

  function resetCurrentScriptState(nextStatus = 'Ready') {
    setScripts([]);
    setDrafts({});
    setDesign(null);
    setErrorMessage('');
    setStatus(nextStatus);
  }

  async function refreshRuns() {
    const res = await fetch('/api/runs');
    const data = await res.json();
    const nextRuns = data.runs || [];
    setRuns(nextRuns);
    setSelectedRun((current) => {
      const nextSelected = current ? nextRuns.find((item: RunRecord) => item.id === current.id) || current : nextRuns[0] || null;
      if (nextSelected) {
        setSelectedRunLanguage(nextSelected.languages.includes(activeLanguage) ? activeLanguage : nextSelected.languages[0]);
      }
      return nextSelected;
    });
  }

  async function generateTopics(silent = false) {
    setIsGeneratingTopics(true);
    setErrorMessage('');
    setStatus('Generating fresh topics...');
    try {
      const res = await fetch('/api/topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directionId, language: languages[0], textSettings: requestTextSettings() })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to generate topics');
        setStatus('Topic generation failed');
        return;
      }
      const nextTopics = data.topics || [];
      setTopicCandidates(nextTopics);
      setSelectedTopic(nextTopics[0]?.topic || '');
      resetCurrentScriptState(silent ? 'Direction updated' : 'Topics ready');
      setShowTopicCandidates(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate topics');
      setStatus('Topic generation failed');
    } finally {
      setIsGeneratingTopics(false);
    }
  }

  async function generateScript() {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic) return;
    setIsGeneratingScripts(true);
    setErrorMessage('');
    setStatus('Generating script...');
    try {
      const res = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directionId,
          topic,
          languages,
          durationSeconds: 30,
          hasVoiceover,
          textSettings: requestTextSettings()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to generate scripts');
        setStatus('Script generation failed');
        return;
      }
      const nextScripts = (data.scripts || [data.script]) as ScriptPackage[];
      setScripts(nextScripts);
      setDesign(data.design as DesignPackage);
      setActiveLanguage(nextScripts.find((item) => item.language === activeLanguage)?.language || nextScripts[0]?.language || 'en');
      setDrafts(Object.fromEntries(nextScripts.map((item) => [item.language, toDraft(item)])));
      setStatus('Scripts ready for edits');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate scripts');
      setStatus('Script generation failed');
    } finally {
      setIsGeneratingScripts(false);
    }
  }

  async function humanize() {
    if (!activeScript) return;
    setIsHumanizing(true);
    setErrorMessage('');
    setStatus(`Humanizing ${activeScript.language.toUpperCase()} script...`);
    try {
      const res = await fetch('/api/script/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fromDraft(activeScript, activeDraft))
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to humanize script');
        setStatus('Humanize failed');
        return;
      }
      const updated = data.script as ScriptPackage;
      const nextScripts = scripts.map((item) => item.language === updated.language ? updated : item);
      setScripts(nextScripts);
      setDrafts((current) => ({ ...current, [updated.language]: toDraft(updated) }));
      setDesign(data.design as DesignPackage);
      setStatus('Humanized');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to humanize script');
      setStatus('Humanize failed');
    } finally {
      setIsHumanizing(false);
    }
  }

  async function renderVideo() {
    const topic = customTopic.trim() || selectedTopic || activeScript?.topic || '';
    if (!topic) return;
    setIsRendering(true);
    setErrorMessage('');
    setStatus('Rendering full package...');
    const editedScripts = scripts.map((item) => fromDraft(item, drafts[item.language] || toDraft(item)));
    const payload: CreateVideoPayload = {
      directionId,
      topic,
      languages,
      durationSeconds: 30,
      hasVoiceover,
      scripts: editedScripts,
      textSettings: requestTextSettings()
    };
    try {
      const res = await fetch('/api/agent/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Render failed');
        setStatus('Render failed');
        return;
      }
      setStatus('Render completed');
      await refreshRuns();
      if (data.run) {
        setSelectedRun(data.run);
        setSelectedRunLanguage(data.run.languages.includes(activeLanguage) ? activeLanguage : data.run.languages[0]);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Render failed');
      setStatus('Render failed');
    } finally {
      setIsRendering(false);
    }
  }

  async function generateAutoVideo() {
    setIsAutoGenerating(true);
    setAutoError('');
    setAutoStatus('Generating auto video...');
    try {
      const res = await fetch('/api/runs/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: autoDirection,
          language: autoLanguage,
          count: Math.min(1, Math.max(1, autoCount)),
          voiceover: hasVoiceover,
          durationSec: 30
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAutoError(data.error || 'Auto video generation failed');
        setAutoStatus('Auto generation failed');
        return;
      }
      setAutoResult(data as AutoVideoResult);
      setAutoStatus('Auto video completed');
      await refreshRuns();
    } catch (error) {
      setAutoError(error instanceof Error ? error.message : 'Auto video generation failed');
      setAutoStatus('Auto generation failed');
    } finally {
      setIsAutoGenerating(false);
    }
  }

  function applyDraft() {
    if (!activeScript) return;
    const updated = fromDraft(activeScript, activeDraft);
    const nextScripts = scripts.map((item) => item.language === updated.language ? updated : item);
    setScripts(nextScripts);
    void fetch('/api/video/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: updated,
        directionId,
        hasVoiceover
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setDesign(data.design as DesignPackage);
        setStatus(`Applied ${updated.language.toUpperCase()} edits`);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to apply edits');
        setStatus('Preview update failed');
      });
  }

  function updateDraftField(field: keyof ScriptDraft, value: string) {
    if (!activeScript) return;
    const next = { ...(drafts[activeScript.language] || toDraft(activeScript)), [field]: value };
    setDrafts((current) => ({ ...current, [activeScript.language]: next }));
  }

  function toggleLanguage(language: LanguageCode) {
    setLanguages((current) => current.includes(language)
      ? current.length === 1 ? current : current.filter((item) => item !== language)
      : [...current, language]
    );
    setActiveLanguage(language);
    resetCurrentScriptState(`Language set to ${language.toUpperCase()}`);
  }

  return (
    <main className="pageShell">
      <section className="heroPanel">
        <div className="heroCopy">
          <p className="eyebrow">yt-vid</p>
          <h1>Local Shorts factory</h1>
        </div>
      </section>

      {errorMessage ? <section className="errorBanner">{errorMessage}</section> : null}
      {autoError ? <section className="errorBanner">{autoError}</section> : null}

      <section className="panel workflowPanel">
        <div>
          <p className="eyebrow">Generate</p>
          <h2>Pick a lane and language</h2>
        </div>
        <div className="workflowStack">
          <div className="workflowControls">
            <label className="fieldBlock">
              <span className="eyebrow">Theme</span>
              <select
                className="textInput"
                value={directionId}
                onChange={(event) => {
                  const nextDirection = DIRECTIONS.find((direction) => direction.id === event.target.value);
                  setDirectionId(event.target.value);
                  if (nextDirection?.autoCategory) setAutoDirection(nextDirection.autoCategory);
                }}
              >
                {DIRECTIONS.map((direction) => (
                  <option key={direction.id} value={direction.id}>{direction.name}</option>
                ))}
              </select>
            </label>
            <label className="fieldBlock">
              <span className="eyebrow">Language</span>
              <select
                className="textInput"
                value={languages[0] || activeLanguage}
                onChange={(event) => {
                  const language = event.target.value as LanguageCode;
                  setLanguages([language]);
                  setActiveLanguage(language);
                  resetCurrentScriptState(`Language set to ${language.toUpperCase()}`);
                }}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
            </label>
            <label className="toggleField">
              <span className="eyebrow">Voice</span>
              <span className="toggleRow">
                <input checked={hasVoiceover} onChange={(event) => setHasVoiceover(event.target.checked)} type="checkbox" />
                Voiceover
              </span>
            </label>
            <button className="autoPrimaryButton" disabled={isGeneratingTopics} onClick={() => void generateTopics()} type="button">
              {isGeneratingTopics ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="providerControls">
            <label className="fieldBlock">
              <span className="eyebrow">Provider</span>
              <select
                className="textInput"
                value={textSettings.provider}
                onChange={(event) => setTextSettings((current) => ({
                  ...current,
                  provider: event.target.value as TextProviderId
                }))}
              >
                <option value="openrouter">OpenRouter</option>
                <option value="gemini">Gemini</option>
              </select>
            </label>
            <label className="fieldBlock providerKeyField">
              <span className="eyebrow">API key</span>
              <input
                className="textInput"
                onChange={(event) => setTextSettings((current) => ({ ...current, apiKey: event.target.value }))}
                placeholder={textSettings.provider === 'gemini' ? 'Gemini API key' : 'OpenRouter API key'}
                type="password"
                value={textSettings.apiKey || ''}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="controlColumn">
          <div className="panel">
            <p className="eyebrow">Topic</p>
            <div className="sectionHeaderRow">
              <h2>Fresh candidates</h2>
              <button
                className="ghostButton"
                onClick={() => setShowTopicCandidates((current) => !current)}
                type="button"
              >
                {showTopicCandidates ? 'Hide list' : `Show list (${topicCandidates.length})`}
              </button>
            </div>
            {selectedTopic ? (
              <button
                className="topicCard active selectedTopicCard"
                onClick={() => {
                  setShowTopicCandidates((current) => !current);
                  resetCurrentScriptState('Topic changed. Generate scripts again.');
                }}
                type="button"
              >
                <strong>{selectedTopic}</strong>
                <span>{topicCandidates.find((candidate) => candidate.topic === selectedTopic)?.hook || 'Selected topic'}</span>
              </button>
            ) : null}
            {showTopicCandidates ? (
              <div className="topicList collapsibleTopicList">
                {topicCandidates.map((candidate) => (
                  <button
                    key={candidate.topic}
                    className={selectedTopic === candidate.topic ? 'topicCard active' : 'topicCard'}
                    onClick={() => {
                      setSelectedTopic(candidate.topic);
                      setCustomTopic('');
                      setShowTopicCandidates(false);
                      resetCurrentScriptState('Topic changed. Generate scripts again.');
                    }}
                    type="button"
                  >
                    <strong>{candidate.topic}</strong>
                    <span>{candidate.hook}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <input
              className="textInput"
              value={customTopic}
              onChange={(event) => {
                setCustomTopic(event.target.value);
                resetCurrentScriptState(event.target.value.trim() ? 'Custom topic changed. Generate scripts again.' : 'Ready');
              }}
              placeholder="Or type your own topic"
            />
            <div className="languagePills">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  className={languages.includes(language.code) ? 'pill active' : 'pill'}
                  onClick={() => toggleLanguage(language.code)}
                  type="button"
                >
                  {language.label}
                </button>
              ))}
            </div>
            <p className="pillHint">Selected pills will be rendered. The active editor tab controls the preview and default result player.</p>
            <div className="toolbar">
              <button className="compactButton" disabled={isGeneratingScripts || !selectedTopic && !customTopic.trim()} onClick={generateScript} type="button">
                {isGeneratingScripts ? 'Generating...' : 'Generate scripts'}
              </button>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Editor</p>
            <h2>Adjust before render</h2>
            <div className="languageTabs">
              {scripts.map((item) => (
                <button
                  key={item.language}
                  className={activeLanguage === item.language ? 'langTab active' : 'langTab'}
                  onClick={() => setActiveLanguage(item.language)}
                  type="button"
                >
                  {item.language.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="editorGrid">
              <textarea value={activeDraft.hook} onChange={(event) => updateDraftField('hook', event.target.value)} placeholder="Hook" />
              <textarea value={activeDraft.body} onChange={(event) => updateDraftField('body', event.target.value)} placeholder="Body" />
              <textarea value={activeDraft.cta} onChange={(event) => updateDraftField('cta', event.target.value)} placeholder="CTA" />
              <textarea value={activeDraft.title} onChange={(event) => updateDraftField('title', event.target.value)} placeholder="Title" />
              <textarea value={activeDraft.description} onChange={(event) => updateDraftField('description', event.target.value)} placeholder="Description" />
              <textarea value={activeDraft.tags} onChange={(event) => updateDraftField('tags', event.target.value)} placeholder="Tags comma separated" />
              <textarea value={activeDraft.onScreenText} onChange={(event) => updateDraftField('onScreenText', event.target.value)} placeholder="On-screen text" />
            </div>
            <div className="toolbar">
              <button className="compactButton" disabled={scripts.length === 0 || isRendering} onClick={renderVideo} type="button">
                {isRendering ? 'Rendering...' : 'Create video'}
              </button>
            </div>
          </div>
        </div>

        <div className="previewColumn">
          <div className="panel stickyPanel">
            <p className="eyebrow">Preview</p>
            <div className="sectionHeaderRow">
              <h2>Final look</h2>
              <button className="compactButton previewRenderButton" disabled={scripts.length === 0 || isRendering} onClick={renderVideo} type="button">
                {isRendering ? 'Rendering...' : 'Create video'}
              </button>
            </div>
            <PreviewPhone script={activeScript} design={design} />
          </div>

          <div className="panel hiddenPanel">
            <p className="eyebrow">Runs</p>
            <h2>Recent outputs</h2>
            <div className="runList">
              {runs.map((run) => (
                <button
                  className={selectedRun?.id === run.id ? 'runItem active' : 'runItem'}
                  key={run.id}
                  onClick={() => {
                    setSelectedRun(run);
                    setSelectedRunLanguage(run.languages.includes(activeLanguage) ? activeLanguage : run.languages[0]);
                  }}
                  type="button"
                >
                  <strong>{run.topic}</strong>
                  <span>{run.directionName} · {run.languages.join(', ')}</span>
                  <code>{run.outputDir}</code>
                </button>
              ))}
            </div>

            {selectedRun ? (
              <div className="runDetails">
                <h3>{selectedRun.youtubePackage.title}</h3>
                <p>{selectedRun.youtubePackage.description}</p>
                <div className="runLanguageTabs">
                  {selectedRun.languages.map((language) => (
                    <button
                      className={selectedRunLanguage === language ? 'langTab active' : 'langTab'}
                      key={language}
                      onClick={() => setSelectedRunLanguage(language)}
                      type="button"
                    >
                      {language.toUpperCase()}
                    </button>
                  ))}
                </div>
                {selectedRunLanguage ? (
                  <video
                    className="runVideo"
                    controls
                    preload="metadata"
                    src={`/output/runs/${selectedRun.id}/short-${selectedRunLanguage}.mp4`}
                  />
                ) : null}
                <div className="artifactGrid">
                  {Object.entries(selectedRun.artifacts).map(([key, file]) => (
                    <a
                      className="artifactLink"
                      href={`/output/runs/${selectedRun.id}/${file}`}
                      key={key}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {key}
                    </a>
                  ))}
                  {selectedRun.languages.map((language) => (
                    <a
                      className="artifactLink video"
                      href={`/output/runs/${selectedRun.id}/short-${language}.mp4`}
                      key={language}
                      rel="noreferrer"
                      target="_blank"
                    >
                      video {language}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function toDraft(script: ScriptPackage): ScriptDraft {
  return {
    hook: script.hook,
    body: script.body.join('\n'),
    cta: script.cta,
    title: script.title,
    description: script.description,
    tags: script.tags.join(', '),
    onScreenText: script.onScreenText.join('\n')
  };
}

function fromDraft(script: ScriptPackage, draft: ScriptDraft): ScriptPackage {
  const body = draft.body.split('\n').map((item) => item.trim()).filter(Boolean);
  return {
    ...script,
    hook: draft.hook,
    body,
    cta: draft.cta,
    title: draft.title,
    description: draft.description,
    tags: draft.tags.split(',').map((item) => item.trim()).filter(Boolean),
    onScreenText: draft.onScreenText.split('\n').map((item) => item.trim()).filter(Boolean),
    voiceoverText: [draft.hook, ...body, draft.cta].join(' ')
  };
}
