# yt-vid

`yt-vid` is a local YouTube Shorts factory built with TypeScript, Express, React, and Remotion. The product flow is now automatic: choose a theme, choose a language, toggle voiceover, and generate a complete Shorts package.

## Workflow

1. Open `http://localhost:3000`.
2. Select `Theme`.
3. Select `Language`.
4. Toggle `Voiceover`.
5. Click `Generate video`.
6. The server generates the trend topic, script material, voiceover, poster facts, on-screen text, YouTube metadata, and final video.

Technical run archives are kept in `output/runs/<runId>/`. User-ready YouTube packages are exported to:

```text
Video/Youtube/<safe-topic>_<YYYY-MM-DD>_<HH-mm>/
```

Each exported package contains:

```text
video.mp4
upload.txt
metadata.json
```

`upload.txt` contains only upload-ready title, description, tags, topic, language, and creation date.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Models

Runtime content generation defaults to Cerebras Inference. Cerebras is used for topic discovery, short-form material, YouTube metadata, and any legacy script generation path. Voiceover still uses Cartesia, and final video rendering still uses Remotion.

```env
LLM_PROVIDER=cerebras
CONTENT_MODEL=gpt-oss-120b
CEREBRAS_API_KEY=
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
CODE_MODEL=qwen/qwen3-coder
VIDEO_EXPORT_DIR=Video/Youtube
```

Recommended Cerebras models:

- `gpt-oss-120b`: default production model for smarter, stable video topics and scripts.
- `zai-glm-4.7`: optional preview model for experiments; not recommended as the default production setting.

`CODE_MODEL` is reserved for future code-agent tasks and is not used by the video runtime pipeline. `OPENROUTER_MODEL` remains supported as a backward-compatible fallback, but new configuration should prefer Cerebras through `CONTENT_MODEL`.

## API

- `GET /api/bootstrap`
- `GET /api/runs`
- `GET /api/runs/:runId`
- `POST /api/runs/auto`
- `POST /api/topics/generate`
- `POST /api/voiceover/create`
- `GET /api/hermes/memory`
- `POST /api/hermes/fix-note`
- `POST /api/hermes/check-run`

Deprecated manual endpoints return `410`:

- `POST /api/script/generate`
- `POST /api/script/humanize`
- `POST /api/video/render`
- `POST /api/agent/create-video`

## Guarantees

- Auto videos target 30 seconds or less.
- CTA stays in voiceover only when voiceover is enabled.
- CTA is blocked from poster facts and on-screen text.
- `output/runs` remains the technical archive.
- `Video/Youtube` is the user-facing export folder.

## Verification

```bash
npm run typecheck
npm test
```
