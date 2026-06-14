# Background library

The renderer uses static vertical images only.

- `shorts/<theme>` contains five image choices for every Shorts direction.
- `horror/<location>` contains five image choices for common horror locations.

Every collection contains five independently generated scenes rather than
cropped or color-shifted copies. The images were generated for this project
with OpenAI image generation and contain no embedded captions, logos, or
watermarks. The renderer chooses one image from the matching collection for
each generated video.
