import { useEffect, useMemo, useState } from 'react';
import { AUTO_DIRECTIONS, LANGUAGES } from '../shared/constants';
import type {
  AutoDirectionId,
  AutoVideoResult,
  HorrorSeriesResult,
  HorrorStyle,
  LanguageCode,
  RunRecord,
  VideoMode
} from '../shared/types';

function displayPath(run: RunRecord) {
  return run.absoluteExportDir || run.exportDir || run.outputDir;
}

function runVideoSrc(run: RunRecord) {
  if (run.artifacts.video) return `/output/runs/${run.id}/${run.artifacts.video}`;
  const language = run.languages[0] || 'en';
  return `/output/runs/${run.id}/short-${language}.mp4`;
}

function exportedFileUrl(run: RunRecord, filePath: string) {
  const folder = run.absoluteExportDir?.split(/[\\/]/).filter(Boolean).at(-1);
  const file = filePath.split(/[\\/]/).filter(Boolean).at(-1);
  if (!folder || !file) return null;
  return `/exports/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

const horrorStyles: Array<{ id: HorrorStyle; label: string }> = [
  { id: 'campfire', label: 'Campfire tale' },
  { id: 'urban-legend', label: 'Urban legend' },
  { id: 'paranormal', label: 'Paranormal' },
  { id: 'psychological', label: 'Psychological horror' }
];

export function App() {
  const [mode, setMode] = useState<VideoMode>('shorts');
  const [theme, setTheme] = useState<AutoDirectionId>('psychology');
  const [horrorStyle, setHorrorStyle] = useState<HorrorStyle>('campfire');
  const [language, setLanguage] = useState<LanguageCode>('ru');
  const [voiceover, setVoiceover] = useState(true);
  const [visualization, setVisualization] = useState(true);
  const [status, setStatus] = useState('Ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<AutoVideoResult | HorrorSeriesResult | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);

  const latestRun = useMemo(() => {
    if (lastResult) return runs.find((run) => run.id === lastResult.runId) || null;
    return runs[0] || null;
  }, [lastResult, runs]);

  useEffect(() => {
    void refreshRuns();
  }, []);

  async function refreshRuns() {
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch {
      setErrorMessage('Локальный сервер недоступен. Перезапустите приложение.');
      setStatus('Server offline');
    }
  }

  async function generateVideo() {
    setIsGenerating(true);
    setErrorMessage('');
    setStatus('Generating video package...');

    try {
      const endpoint = mode === 'horror' ? '/api/runs/horror' : '/api/runs/auto';
      const requestBody = mode === 'horror'
        ? {
          language,
          style: horrorStyle,
          voiceover,
          visualization
        }
        : {
          direction: theme,
          language,
          voiceover,
          durationSec: 30
        };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Auto video generation failed');
        setStatus('Generation failed');
        return;
      }

      setLastResult(data as AutoVideoResult | HorrorSeriesResult);
      setStatus('Completed');
      await refreshRuns();
    } catch (error) {
      setErrorMessage(
        error instanceof TypeError
          ? 'Локальный сервер недоступен. Перезапустите приложение.'
          : error instanceof Error
            ? error.message
            : 'Auto video generation failed'
      );
      setStatus('Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="pageShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">yt-vid</p>
          <h1>Video Factory</h1>
        </div>
        <div className="statusPill">{status}</div>
      </header>

      {errorMessage ? <section className="errorBanner">{errorMessage}</section> : null}

      <section className="controlPanel">
        <label className="fieldBlock">
          <span>Mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as VideoMode)}>
            <option value="shorts">Shorts</option>
            <option value="horror">Horror Stories</option>
          </select>
        </label>

        {mode === 'shorts' ? (
        <label className="fieldBlock">
          <span>Theme</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value as AutoDirectionId)}>
            {AUTO_DIRECTIONS.map((direction) => (
              <option key={direction.id} value={direction.id}>{direction.label}</option>
            ))}
          </select>
        </label>
        ) : (
          <label className="fieldBlock">
            <span>Story style</span>
            <select value={horrorStyle} onChange={(event) => setHorrorStyle(event.target.value as HorrorStyle)}>
              {horrorStyles.map((style) => (
                <option key={style.id} value={style.id}>{style.label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="fieldBlock">
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)}>
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="switchField">
          <span>Voiceover</span>
          <input checked={voiceover} onChange={(event) => setVoiceover(event.target.checked)} type="checkbox" />
        </label>

        {mode === 'horror' ? (
          <label className="switchField">
            <span>Visualization</span>
            <input checked={visualization} onChange={(event) => setVisualization(event.target.checked)} type="checkbox" />
          </label>
        ) : null}

        <button className="primaryButton" disabled={isGenerating} onClick={generateVideo} type="button">
          {isGenerating ? 'Generating...' : mode === 'horror' ? 'Generate story series' : 'Generate video'}
        </button>
      </section>

      <section className="contentGrid">
        <article className="resultPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Last result</p>
              <h2>
                {latestRun?.topic
                  || (lastResult && 'summary' in lastResult ? lastResult.summary.topic : lastResult?.title)
                  || 'No video yet'}
              </h2>
            </div>
            {latestRun?.renderStatus ? <span className="statusPill compact">{latestRun.renderStatus}</span> : null}
          </div>

          {latestRun ? (
            <div className="resultBody">
              <video className="resultVideo" controls preload="metadata" src={runVideoSrc(latestRun)} />
              <div className="metadataBlock">
                <strong>{latestRun.youtubePackage.title}</strong>
                <p>{latestRun.youtubePackage.description}</p>
                <code>{displayPath(latestRun)}</code>
              </div>
              <div className="artifactGrid">
                {latestRun.seriesParts?.map((part) => (
                  <a href={part.exportVideoUrl} key={part.index} target="_blank" rel="noreferrer">
                    Part {part.index}
                  </a>
                ))}
                {!latestRun.seriesParts && latestRun.exportVideoPath && exportedFileUrl(latestRun, latestRun.exportVideoPath) ? (
                  <a href={exportedFileUrl(latestRun, latestRun.exportVideoPath)!} target="_blank" rel="noreferrer">video.mp4</a>
                ) : null}
                {!latestRun.seriesParts && latestRun.uploadTextPath && exportedFileUrl(latestRun, latestRun.uploadTextPath) ? (
                  <a href={exportedFileUrl(latestRun, latestRun.uploadTextPath)!} target="_blank" rel="noreferrer">upload.txt</a>
                ) : null}
                {!latestRun.seriesParts && latestRun.metadataPath && exportedFileUrl(latestRun, latestRun.metadataPath) ? (
                  <a href={exportedFileUrl(latestRun, latestRun.metadataPath)!} target="_blank" rel="noreferrer">metadata.json</a>
                ) : null}
                {latestRun.artifacts.manifest ? (
                  <a href={`/output/runs/${latestRun.id}/${latestRun.artifacts.manifest}`} target="_blank" rel="noreferrer">manifest</a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="emptyState">Ready to create the first YouTube package.</div>
          )}
        </article>

      </section>
    </main>
  );
}
