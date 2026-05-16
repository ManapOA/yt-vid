# yt-vid

`yt-vid` is a new standalone project that combines the production video pipeline patterns from `youtube-shorts-factory` with the dashboard/orchestration direction-first UX from `video-agent`.

## Pipeline

1. User selects one of 5 video directions.
2. System generates fresh topic candidates with Gemini/OpenRouter fallback logic.
3. Topic history is checked and duplicates are filtered.
4. User chooses a topic or enters a custom topic.
5. Script is generated.
6. Script is expanded to selected languages.
7. User edits hook, body, CTA, title, description, tags, and on-screen text.
8. Design package is built.
9. Cartesia voiceover artifacts are created when voiceover is enabled.
10. Hermes regression checks run before render.
11. Remotion renders the final MP4 package.
12. A YouTube package is saved with metadata.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

## Env Variables

- `PORT`
- `APP_BASE_URL`
- `LLM_PROVIDER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `CARTESIA_API_KEY`
- `CARTESIA_MODEL`
- `CARTESIA_VERSION`
- `CARTESIA_VOICE_ID_EN`
- `CARTESIA_VOICE_ID_RU`
- `CARTESIA_VOICE_ID_DE`
- `CARTESIA_VOICE_ID_ES`
- `CARTESIA_VOICE_ID_IT`
- `CARTESIA_OUTPUT_CONTAINER`
- `CARTESIA_OUTPUT_ENCODING`
- `CARTESIA_SAMPLE_RATE`
- `CARTESIA_BIT_RATE`
- `OPEN_DESIGN_ENDPOINT`
- `DEFAULT_LANGUAGES`
- `DEFAULT_DIRECTION`
- `DEFAULT_DURATION_SECONDS`
- `MUSIC_VOLUME`
- `VOICEOVER_ENABLED`

## Hermes Memory System

Hermes files live in `data/hermes/`:

- `rules.json`
- `fixes.json`
- `known-bugs.json`
- `decisions.json`

Runtime modules live in `src/server/hermes/`:

- `memory.ts`
- `rules.ts`
- `decisions.ts`
- `regression-checks.ts`

Hermes stores rules, fix notes, decisions, and known bugs. Before render, Hermes runs regression checks and writes `hermes-checks.json` into the run folder. Any `high` or `critical` rule violation blocks render.

## CTA Rule

Centralized CTA policy lives in `src/server/pipeline/cta-policy.ts`.

- If `hasVoiceover === true`, CTA is appended into `voiceoverText` when needed and is not rendered as an on-screen CTA block.
- If `hasVoiceover === false`, CTA may render visually.

This behavior is covered by tests.

## Project Structure

```text
src/
  app/
  components/
  remotion/
  server/
    pipeline/
    hermes/
    providers/
    storage/
  shared/
data/
  hermes/
output/
  runs/
```

## API

- `GET /api/bootstrap`
- `GET /api/runs`
- `POST /api/topics/generate`
- `POST /api/script/generate`
- `POST /api/script/humanize`
- `POST /api/voiceover/create`
- `POST /api/video/render`
- `POST /api/agent/create-video`
- `GET /api/hermes/memory`
- `POST /api/hermes/fix-note`
- `POST /api/hermes/check-run`

## Windows Helpers

- `start-yt-vid.bat`
- `stop-yt-vid.bat`
- `scripts/create-desktop-shortcut.ps1`

## TODO Roadmap

- Real multilingual translation quality pass via provider prompts per language.
- Real background music selection and mix controls.
- Richer topic history analytics and novelty scoring.
- Open Design remote service integration instead of local theme mapping.
- Better run inspection UI with artifact previews and downloadable metadata.
