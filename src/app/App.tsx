import { useEffect, useState } from 'react';
import { PreviewPhone } from '../components/PreviewPhone';
import { DIRECTIONS, LANGUAGES } from '../shared/constants';
import type { BootstrapPayload, DesignPackage, LanguageCode, RunRecord, ScriptPackage, TopicCandidate } from '../shared/types';

type ScriptDraft = {
  hook: string;
  body: string;
  cta: string;
  title: string;
  description: string;
  tags: string;
  onScreenText: string;
};

export function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [directionId, setDirectionId] = useState(DIRECTIONS[0].id);
  const [topicCandidates, setTopicCandidates] = useState<TopicCandidate[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [languages, setLanguages] = useState<LanguageCode[]>(['en', 'ru']);
  const [script, setScript] = useState<ScriptPackage | null>(null);
  const [design, setDesign] = useState<DesignPackage | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [hasVoiceover, setHasVoiceover] = useState(true);
  const [draft, setDraft] = useState<ScriptDraft>({
    hook: '',
    body: '',
    cta: '',
    title: '',
    description: '',
    tags: '',
    onScreenText: ''
  });
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    void bootstrapApp();
    void refreshRuns();
  }, []);

  async function bootstrapApp() {
    const res = await fetch('/api/bootstrap');
    const data = await res.json();
    setBootstrap(data);
  }

  async function refreshRuns() {
    const res = await fetch('/api/runs');
    const data = await res.json();
    setRuns(data.runs || []);
  }

  async function generateTopics() {
    setStatus('Generating fresh topics...');
    const res = await fetch('/api/topics/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directionId, language: languages[0] })
    });
    const data = await res.json();
    setTopicCandidates(data.topics || []);
    setSelectedTopic(data.topics?.[0]?.topic || '');
    setStatus('Topics ready');
  }

  async function generateScript() {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic) return;
    setStatus('Generating script...');
    const res = await fetch('/api/script/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directionId,
        topic,
        languages,
        durationSeconds: 20
      })
    });
    const data = await res.json();
    const nextScript = data.script as ScriptPackage;
    setScript(nextScript);
    setDesign(data.design as DesignPackage);
    setDraft({
      hook: nextScript.hook,
      body: nextScript.body.join('\n'),
      cta: nextScript.cta,
      title: nextScript.title,
      description: nextScript.description,
      tags: nextScript.tags.join(', '),
      onScreenText: nextScript.onScreenText.join('\n')
    });
    setStatus('Script ready for edits');
  }

  async function humanize() {
    if (!script) return;
    setStatus('Humanizing script...');
    const res = await fetch('/api/script/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(script)
    });
    const data = await res.json();
    setScript(data.script);
    setDesign(data.design);
    setStatus('Humanized');
  }

  async function renderVideo() {
    const topic = customTopic.trim() || selectedTopic || script?.topic || '';
    if (!topic) return;
    setStatus('Rendering full package...');
    const res = await fetch('/api/agent/create-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directionId,
        topic,
        languages,
        durationSeconds: 20,
        hasVoiceover
      })
    });
    const data = await res.json();
    setStatus(data.run ? 'Render completed' : data.error || 'Render failed');
    await refreshRuns();
  }

  function applyDraft() {
    if (!script) return;
    const nextScript: ScriptPackage = {
      ...script,
      hook: draft.hook,
      body: draft.body.split('\n').map((item) => item.trim()).filter(Boolean),
      cta: draft.cta,
      title: draft.title,
      description: draft.description,
      tags: draft.tags.split(',').map((item) => item.trim()).filter(Boolean),
      onScreenText: draft.onScreenText.split('\n').map((item) => item.trim()).filter(Boolean),
      voiceoverText: [draft.hook, ...draft.body.split('\n').map((item) => item.trim()).filter(Boolean), draft.cta].join(' ')
    };
    setScript(nextScript);
    void fetch('/api/video/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: nextScript,
        directionId,
        hasVoiceover
      })
    }).then((res) => res.json()).then((data) => setDesign(data.design));
  }

  return (
    <main className="pageShell">
      <section className="heroPanel">
        <div>
          <p className="eyebrow">yt-vid</p>
          <h1>Production pipeline from shorts-factory. UI and orchestration from video-agent.</h1>
          <p className="subcopy">
            Fresh topics, multilingual scripts, Cartesia voiceover, Remotion render, Hermes regression checks, and a direction-first editor.
          </p>
        </div>
        <div className="heroStatus">
          <strong>{status}</strong>
          <span>{bootstrap?.project.url || 'http://localhost:3000'}</span>
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="controlColumn">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">1. Direction</p>
                <h2>Choose the lane</h2>
              </div>
            </div>
            <div className="directionGrid">
              {DIRECTIONS.map((direction) => (
                <button
                  key={direction.id}
                  className={directionId === direction.id ? 'directionCard active' : 'directionCard'}
                  onClick={() => setDirectionId(direction.id)}
                  type="button"
                >
                  <strong>{direction.name}</strong>
                  <span>{direction.summary}</span>
                </button>
              ))}
            </div>
            <div className="toolbar">
              <button onClick={generateTopics} type="button">Generate topics</button>
              <label className="toggleRow">
                <input checked={hasVoiceover} onChange={(event) => setHasVoiceover(event.target.checked)} type="checkbox" />
                Voiceover
              </label>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">2. Topic</p>
            <h2>Fresh candidates</h2>
            <div className="topicList">
              {topicCandidates.map((candidate) => (
                <button
                  key={candidate.topic}
                  className={selectedTopic === candidate.topic ? 'topicCard active' : 'topicCard'}
                  onClick={() => {
                    setSelectedTopic(candidate.topic);
                    setCustomTopic('');
                  }}
                  type="button"
                >
                  <strong>{candidate.topic}</strong>
                  <span>{candidate.hook}</span>
                </button>
              ))}
            </div>
            <input
              className="textInput"
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              placeholder="Or type your own topic"
            />
            <div className="languagePills">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  className={languages.includes(language.code) ? 'pill active' : 'pill'}
                  onClick={() => {
                    setLanguages((current) => current.includes(language.code)
                      ? current.filter((item) => item !== language.code)
                      : [...current, language.code]);
                  }}
                  type="button"
                >
                  {language.label}
                </button>
              ))}
            </div>
            <div className="toolbar">
              <button onClick={generateScript} type="button">Generate script</button>
              <button onClick={humanize} type="button">Humanize</button>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">3. Editor</p>
            <h2>Adjust before render</h2>
            <div className="editorGrid">
              <textarea value={draft.hook} onChange={(event) => setDraft({ ...draft, hook: event.target.value })} placeholder="Hook" />
              <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Body" />
              <textarea value={draft.cta} onChange={(event) => setDraft({ ...draft, cta: event.target.value })} placeholder="CTA" />
              <textarea value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" />
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" />
              <textarea value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Tags comma separated" />
              <textarea value={draft.onScreenText} onChange={(event) => setDraft({ ...draft, onScreenText: event.target.value })} placeholder="On-screen text" />
            </div>
            <div className="toolbar">
              <button onClick={applyDraft} type="button">Apply edits</button>
              <button onClick={renderVideo} type="button">Create full video</button>
            </div>
          </div>
        </div>

        <div className="previewColumn">
          <div className="panel stickyPanel">
            <p className="eyebrow">Preview</p>
            <h2>Final look</h2>
            <PreviewPhone script={script} design={design} />
          </div>
          <div className="panel">
            <p className="eyebrow">Runs</p>
            <h2>Recent outputs</h2>
            <div className="runList">
              {runs.map((run) => (
                <div className="runItem" key={run.id}>
                  <strong>{run.topic}</strong>
                  <span>{run.directionName} · {run.languages.join(', ')}</span>
                  <code>{run.outputDir}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
