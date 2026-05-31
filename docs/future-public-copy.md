# Future Public Copy Notes

This file captures product decisions for the future public version of yt-vid.

## Local Version

For local personal use, keep the UI simple:

- Provider selector: OpenRouter / Gemini
- API key field
- Model is configured through `.env`
- Advanced model overrides stay hidden from the main screen

Recommended local OpenRouter presets to keep in `.env` or internal config:

- Content best: MoonshotAI Kimi K2.6
- Content fast: Qwen3 Next 80B A3B Instruct
- Code helper: Qwen3 Coder 480B A35B
- Auto/free: OpenRouter Free Models Router

## Future Public Version

Before creating a public copy, add an account/settings area where each user can manage:

- Text provider
- Model
- API key
- Optional fallback provider/model
- Usage status and last provider error

Do not store provider keys in project files or generated video artifacts. For a hosted product, keys should be encrypted at rest or kept client-side if the product is strictly BYOK.

## Suggested UI Shape

Main generation screen:

- Keep only high-frequency controls needed for generating videos.
- Do not expose raw model names unless the user opens settings.

Settings / personal account:

- Provider: OpenRouter, Gemini, future providers
- API key
- Model preset dropdown
- Advanced custom model input
- Test connection button
- Last error message from provider

## Implementation Notes

The current server already accepts `textSettings.model` as an optional override. The current local UI intentionally does not expose it. When the public settings page is added, reuse that field instead of changing the generation pipeline again.
