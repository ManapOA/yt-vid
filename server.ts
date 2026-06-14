import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config } from './src/server/config';
import { DIRECTIONS, LANGUAGES, PROJECT_NAME } from './src/shared/constants';
import { getHermesMemory } from './src/server/hermes/memory';
import { appendHermesFix } from './src/server/hermes/decisions';
import { generateTopicsForDirection } from './src/server/pipeline';
import { getRun, listRuns } from './src/server/storage/runs';
import { autoVideoRequestSchema, horrorStoryRequestSchema } from './src/shared/schemas';
import { runAutoVideoPipeline } from './src/server/pipeline/auto-video-engine';
import { runHorrorSeriesPipeline } from './src/server/pipeline/horror-series-pipeline';

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      watch: {
        ignored: ['**/output/**', '**/data/**', '**/.tools/**', '**/dist/**']
      }
    },
    appType: 'custom'
  });

  app.use('/output', express.static(path.join(config.root, 'output')));
  app.use('/Video', express.static(path.join(config.root, 'Video')));
  app.use('/exports', express.static(config.videoExportDir));
  app.use(vite.middlewares);

  app.get('/api/bootstrap', async (_req, res) => {
    res.json({
      project: {
        name: PROJECT_NAME,
        url: config.appBaseUrl
      },
      directions: DIRECTIONS,
      languages: LANGUAGES,
      textSettings: {
        provider: config.llmProvider === 'gemini' ? 'gemini' : config.llmProvider === 'openrouter' ? 'openrouter' : 'cerebras',
        cerebrasModel: config.cerebras.model,
        openrouterModel: config.openrouter.model,
        geminiModel: config.gemini.model
      }
    });
  });

  app.get('/api/runs', async (_req, res) => {
    res.json({ runs: await listRuns() });
  });

  app.get('/api/runs/:runId', async (req, res) => {
    const run = await getRun(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.json({ run });
  });

  app.post('/api/topics/generate', async (req, res) => {
    try {
      const payload = await generateTopicsForDirection(req.body.directionId, req.body.language || 'en', req.body.textSettings);
      res.json(payload);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Topic generation failed' });
    }
  });

  app.post('/api/script/generate', async (_req, res) => {
    res.status(410).json({ error: 'Deprecated. Use POST /api/runs/auto for automatic Shorts generation.' });
  });

  app.post('/api/script/humanize', async (_req, res) => {
    res.status(410).json({ error: 'Deprecated. Manual script editing has been removed from this app.' });
  });

  app.post('/api/voiceover/create', async (req, res) => {
    res.json({ ok: true, note: 'Voiceover is created during full pipeline runs.' });
  });

  app.post('/api/video/render', async (_req, res) => {
    res.status(410).json({ error: 'Deprecated. Use POST /api/runs/auto to render a complete video package.' });
  });

  app.post('/api/agent/create-video', async (_req, res) => {
    res.status(410).json({ error: 'Deprecated. Use POST /api/runs/auto for the production auto-generation flow.' });
  });

  app.post('/api/runs/auto', async (req, res) => {
    try {
      const payload = autoVideoRequestSchema.parse(req.body);
      const result = await runAutoVideoPipeline(payload);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Auto video pipeline failed' });
    }
  });

  app.post('/api/runs/horror', async (req, res) => {
    try {
      const payload = horrorStoryRequestSchema.parse(req.body);
      const result = await runHorrorSeriesPipeline(payload);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Horror story generation failed' });
    }
  });

  app.get('/api/hermes/memory', async (_req, res) => {
    res.json(await getHermesMemory());
  });

  app.post('/api/hermes/fix-note', async (req, res) => {
    await appendHermesFix(req.body);
    res.json({ ok: true });
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
  app.listen(config.port, config.host, () => {
    console.log(`${PROJECT_NAME} running at ${config.appBaseUrl}`);
  });
});
