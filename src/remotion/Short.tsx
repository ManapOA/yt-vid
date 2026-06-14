import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import type { DesignPackage, ScriptPackage } from '../shared/types';
import { VideoFontFaces, type VideoFontProps, videoFontFamily } from './VideoFonts';

function getSceneTimings(lines: string[], durationInFrames: number) {
  const weights = lines.map((line) => Math.max(5, line.split(/\s+/).filter(Boolean).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;

  return weights.map((weight, index) => {
    const remainingFrames = durationInFrames - cursor;
    const remainingScenes = weights.length - index;
    const proportionalFrames = Math.round((durationInFrames * weight) / totalWeight);
    const duration = index === lines.length - 1
      ? remainingFrames
      : Math.max(30, Math.min(proportionalFrames, remainingFrames - (remainingScenes - 1) * 30));
    const timing = { startFrame: cursor, duration };
    cursor += duration;
    return timing;
  });
}

function fitTextSize(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 12 || text.length > 88) return 66;
  if (words > 9 || text.length > 66) return 76;
  if (words > 6 || text.length > 46) return 88;
  return 104;
}

export function YtVidShort({
  script,
  design,
  audioFile,
  musicFile,
  musicVolume = 0.1,
  backgroundMedia,
  backgroundMediaKind = 'image',
  fontLatin,
  fontLatinExt,
  fontCyrillic,
  fontCyrillicExt
}: {
  script: ScriptPackage;
  design: DesignPackage;
  audioFile: string | null;
  musicFile?: string | null;
  musicVolume?: number;
  backgroundMedia?: string | null;
  backgroundMediaKind?: 'image';
} & VideoFontProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const visualLines = script.onScreenText.filter((line) => line.trim()).slice(0, 4);
  const timings = getSceneTimings(visualLines, durationInFrames);
  const footageScale = interpolate(frame, [0, durationInFrames], [1.08, 1.16], {
    easing: Easing.inOut(Easing.cubic)
  });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0.03, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: design.gradient[0],
        color: '#fff',
        fontFamily: videoFontFamily
      }}
    >
      <VideoFontFaces
        fontLatin={fontLatin}
        fontLatinExt={fontLatinExt}
        fontCyrillic={fontCyrillic}
        fontCyrillicExt={fontCyrillicExt}
      />
      {audioFile ? <Audio src={audioFile} volume={1} /> : null}
      {musicFile ? <Audio src={musicFile} volume={musicVolume} /> : null}

      {backgroundMedia ? (
        <Img
          src={backgroundMedia}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${footageScale}) translateX(${interpolate(frame, [0, durationInFrames], [-0.8, 0.8])}%)`,
            filter: 'saturate(0.76) contrast(1.08) brightness(0.76)'
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(155deg, ${design.gradient[0]}, ${design.gradient[1]} 58%, ${design.gradient[2]})`
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background: [
            'linear-gradient(180deg, rgba(3,5,12,0.58) 0%, rgba(3,5,12,0.1) 34%, rgba(3,5,12,0.18) 54%, rgba(3,5,12,0.86) 100%)',
            'linear-gradient(90deg, rgba(3,5,12,0.48), transparent 75%)'
          ].join(',')
        }}
      />

      <AbsoluteFill style={{ padding: '108px 164px 232px 68px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'rgba(255,255,255,0.78)',
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase'
          }}
        >
          <span style={{ width: 40, height: 4, background: '#fff' }} />
        </div>

        <div
          style={{
            marginTop: 22,
            maxWidth: 760,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 29,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: -0.4,
            textTransform: 'uppercase',
            textShadow: '0 8px 28px rgba(0,0,0,0.72)'
          }}
        >
          {script.title}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          {visualLines.map((line, index) => (
            <FullScreenPhrase
              duration={timings[index]?.duration || durationInFrames}
              fps={fps}
              frame={frame}
              key={`${line}-${index}`}
              startFrame={timings[index]?.startFrame || 0}
              text={line}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 68,
            right: 164,
            bottom: 218,
            height: 5,
            background: 'rgba(255,255,255,0.22)',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: `${progress * 100}%`, height: '100%', background: '#fff' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function FullScreenPhrase({
  text,
  frame,
  fps,
  startFrame,
  duration
}: {
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
  duration: number;
}) {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame >= duration) return null;

  const enter = spring({ fps, frame: localFrame, config: { damping: 22, stiffness: 145 } });
  const exit = interpolate(localFrame, [Math.max(14, duration - 12), duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const opacity = interpolate(exit, [0, 1], [interpolate(enter, [0, 1], [0.25, 1]), 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        paddingBottom: 180,
        opacity,
        transform: `translateY(${interpolate(enter, [0, 1], [30, 0]) - exit * 12}px)`
      }}
    >
      <div
        style={{
          maxWidth: 830,
          fontSize: fitTextSize(text),
          lineHeight: 0.91,
          fontWeight: 500,
          letterSpacing: -2.4,
          textTransform: 'uppercase',
          textWrap: 'balance',
          textShadow: '0 12px 38px rgba(0,0,0,0.88)'
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
