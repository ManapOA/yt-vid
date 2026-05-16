import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config } from './src/server/config';
import { DIRECTIONS, LANGUAGES, PROJECT_NAME } from './src/shared/constants';
import { getHermesMemory } from './src/server/hermes/memory';
import { appendHermesFix } from './src/server/hermes/decisions';
import { runRegressionChecks } from './src/server/hermes/regression-checks';
import { getHermesRules } from './src/server/hermes/rules';
import { createDesign } from './src/server/pipeline/design';
import { runFullPipeline, generateTopicsForDirection } from './src/server/pipeline';
import { humanizeScript } from './src/server/pipeline/humanize';
import { generateScript } from './src/server/pipeline/script-engine';
import { buildMultilingualScript } from './src/server/pipeline/translation';
import { listRuns } from './src/server/storage/runs';

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  app.use(vite.middlewares);

  app.get('/api/bootstrap', async (_req, res) => {
    res.json({
      project: {
        name: PROJECT_NAME,
        url: config.appBaseUrl
      },
      directions: DIRECTIONS,
      languages: LANGUAGES,
      rules: await getHermesRules()
    });
  });

  app.get('/api/runs', async (_req, res) => {
    res.json({ runs: await listRuns() });
  });

  app.post('/api/topics/generate', async (req, res) => {
    try {
      const payload = await generateTopicsForDirection(req.body.directionId, req.body.language || 'en');
      res.json(payload);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Topic generation failed' });
    }
  });

  app.post('/api/script/generate', async (req, res) => {
    try {
      const direction = DIRECTIONS.find((item) => item.id === req.body.directionId);
      if (!direction) throw new Error('Unknown direction');
      const baseScript = await generateScript(direction, req.body.topic, req.body.languages?.[0] || 'en', Number(req.body.durationSeconds || config.defaultDurationSeconds));
      const multilingual = await buildMultilingualScript(baseScript, req.body.languages || ['en']);
      multilingual.hasVoiceover = req.body.hasVoiceover ?? true;
      const { bundle, design } = createDesign(direction, multilingual);
      res.json({
        script: bundle.languages[0],
        design
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Script generation failed' });
    }
  });

  app.post('/api/script/humanize', async (req, res) => {
    try {
      const nextScript = humanizeScript(req.body);
      const direction = DIRECTIONS.find((item) => item.id === nextScript.direction);
      if (!direction) throw new Error('Unknown direction');
      const multilingual = await buildMultilingualScript(nextScript, [nextScript.language]);
      multilingual.hasVoiceover = true;
      const { bundle, design } = createDesign(direction, multilingual);
      res.json({ script: bundle.languages[0], design });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Humanize failed' });
    }
  });

  app.post('/api/voiceover/create', async (req, res) => {
    res.json({ ok: true, note: 'Voiceover is created during full pipeline runs.' });
  });

  app.post('/api/video/render', async (req, res) => {
    try {
      const direction = DIRECTIONS.find((item) => item.id === req.body.directionId || item.id === req.body.script?.direction);
      if (!direction) throw new Error('Unknown direction');
      const multilingual = await buildMultilingualScript(req.body.script, [req.body.script.language]);
      multilingual.hasVoiceover = req.body.hasVoiceover ?? true;
      const { design } = createDesign(direction, multilingual);
      res.json({ design });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Preview render failed' });
    }
  });

  app.post('/api/agent/create-video', async (req, res) => {
    try {
      const run = await runFullPipeline({
        directionId: req.body.directionId,
        topic: req.body.topic,
        languages: req.body.languages || ['en'],
        durationSeconds: Number(req.body.durationSeconds || config.defaultDurationSeconds),
        hasVoiceover: req.body.hasVoiceover ?? config.voiceoverEnabled
      });
      res.json({ run });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Pipeline failed' });
    }
  });

  app.get('/api/hermes/memory', async (_req, res) => {
    res.json(await getHermesMemory());
  });

  app.post('/api/hermes/fix-note', async (req, res) => {
    await appendHermesFix(req.body);
    res.json({ ok: true });
  });

  app.post('/api/hermes/check-run', async (req, res) => {
    try {
      const tempDir = path.join(config.outputRoot, '_hermes_temp_check');
      await fs.mkdir(tempDir, { recursive: true });
      const result = await runRegressionChecks({
        runDir: tempDir,
        design: req.body.design
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Hermes check failed' });
    }
  });

  app.use('*', async (req, res, next) => {
    try {
      const html = await fs.readFile(path.join(config.root, 'index.html'), 'utf8');
      const transformed = await vite.transformIndexHtml(req.originalUrl, html);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
    } catch (error) {
      next(error);
    }
  });

  return app;
}

createApp().then((app) => {
  app.listen(config.port, () => {
    console.log(`${PROJECT_NAME} running at ${config.appBaseUrl}`);
  });
});
