import React from 'react';
import { Composition } from 'remotion';
import { YtVidShort } from './Short';
import { HorrorStoryVideo } from './HorrorStory';

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="YtVidShort"
      component={YtVidShort}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={600}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(Math.min(30, Math.max(3, Number(props.script?.durationSeconds || 8))) * 30)
      })}
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
        audioFile: null,
        musicFile: null,
        musicVolume: 0.1
      }}
    />
    <Composition
      id="HorrorStory"
      component={HorrorStoryVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1500}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(Math.max(5, Number(props.part?.durationSec || 45)) * 30)
      })}
      defaultProps={{
        part: {
          index: 1,
          total: 2,
          title: 'The Listener Beyond the Firelight - Part 1/2',
          text: 'The fire was almost gone when someone sat beyond the light.',
          cta: 'Subscribe for the next part.',
          voiceoverText: 'The fire was almost gone when someone sat beyond the light. Subscribe for the next part.',
          onScreenText: ['The fire was almost gone when someone sat beyond the light.'],
          visualPrompt: 'dying campfire',
          durationSec: 45
        },
        audioFile: null,
        musicFile: null,
        musicVolume: 0.08,
        visualization: true
      }}
    />
    </>
  );
};
