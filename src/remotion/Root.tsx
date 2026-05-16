import React from 'react';
import { Composition } from 'remotion';
import { YtVidShort } from './Short';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="YtVidShort"
      component={YtVidShort}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={600}
      defaultProps={{
        script: {
          language: 'en',
          direction: 'self-awareness',
          topic: 'preview topic',
          durationSeconds: 20,
          hook: 'Preview hook.',
          body: ['Preview body line one.', 'Preview body line two.'],
          cta: 'Save this if it feels real.',
          voiceoverText: 'Preview hook. Preview body line one. Preview body line two. Save this if it feels real.',
          onScreenText: ['Preview hook.', 'Preview body line one.', 'Preview body line two.'],
          title: 'Preview Topic',
          description: 'Preview description',
          tags: ['shorts']
        },
        design: {
          directionId: 'self-awareness',
          theme: 'aurora-glass',
          gradient: ['#22151b', '#694134', '#f46d43'],
          captions: ['Preview hook.', 'Preview body line one.', 'Preview body line two.'],
          ctaPresentation: {
            hasVoiceover: true,
            cta: 'Save this if it feels real.',
            voiceoverText: 'Preview voiceover',
            showOnScreenCta: false,
            onScreenCtaText: null
          },
          scenes: [
            { id: 'scene-1', text: 'Preview hook.', accent: true },
            { id: 'scene-2', text: 'Preview body line one.', accent: false },
            { id: 'scene-3', text: 'Preview body line two.', accent: true }
          ]
        },
        audioFile: null
      }}
    />
  );
};
