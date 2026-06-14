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
import type { HorrorStoryPart } from '../shared/types';
import { VideoFontFaces, type VideoFontProps, videoFontFamily } from './VideoFonts';

function cleanDisplayText(value: string) {
  return String(value || '')
    .replace(/\\r\\n|\\n|\\r|\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
      : Math.max(42, Math.min(proportionalFrames, remainingFrames - (remainingScenes - 1) * 42));
    const timing = { startFrame: cursor, duration };
    cursor += duration;
    return timing;
  });
}

function fitTextSize(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 18 || text.length > 125) return 58;
  if (words > 12 || text.length > 88) return 68;
  if (words > 8 || text.length > 62) return 78;
  return 92;
}

function storyTitle(title: string) {
  return title.replace(/\s+-\s+(?:Part|Часть|Бөлім|Teil|Parte)\s+\d+\/\d+$/i, '');
}

export function HorrorStoryVideo({
  part,
  audioFile,
  musicFile,
  musicVolume = 0.08,
  visualization = true,
  backgroundMedia,
  backgroundMediaKind = 'image',
  fontLatin,
  fontLatinExt,
  fontCyrillic,
  fontCyrillicExt
}: {
  part: HorrorStoryPart;
  audioFile: string | null;
  musicFile?: string | null;
  musicVolume?: number;
  visualization?: boolean;
  backgroundMedia?: string | null;
  backgroundMediaKind?: 'image';
} & VideoFontProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const displayLines = part.onScreenText.map(cleanDisplayText).filter(Boolean).slice(0, 4);
  const timings = getSceneTimings(displayLines, durationInFrames);
  const footageScale = interpolate(frame, [0, durationInFrames], [1.08, 1.2], {
    easing: Easing.inOut(Easing.cubic)
  });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0.03, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: '#020303',
        color: '#f7f2e9',
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

      {visualization && backgroundMedia ? (
        <Img
          src={backgroundMedia}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${footageScale}) translateY(${interpolate(frame, [0, durationInFrames], [-0.6, 0.6])}%)`,
            filter: 'grayscale(0.3) saturate(0.58) contrast(1.2) brightness(0.5)'
          }}
        />
      ) : (
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #06100f, #110806)' }} />
      )}

      <AbsoluteFill
        style={{
          background: [
            'linear-gradient(180deg, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.18) 54%, rgba(0,0,0,0.9) 100%)',
            'linear-gradient(90deg, rgba(0,0,0,0.56), transparent 72%)',
            'radial-gradient(ellipse at 52% 108%, rgba(179,65,26,0.26), transparent 48%)'
          ].join(',')
        }}
      />

      <AbsoluteFill style={{ padding: '104px 164px 232px 68px' }}>
        <div
          style={{
            maxWidth: 790,
            color: 'rgba(247,242,233,0.84)',
            fontSize: 31,
            lineHeight: 0.96,
            fontWeight: 700,
            letterSpacing: -0.8,
            textTransform: 'uppercase',
            textShadow: '0 10px 34px rgba(0,0,0,0.94)'
          }}
        >
          {storyTitle(part.title)}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          {displayLines.map((line, index) => (
            <HorrorPhrase
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
            bottom: 216,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: `${progress * 100}%`, height: '100%', background: '#efa46e' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function HorrorPhrase({
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

  const enter = spring({ fps, frame: localFrame, config: { damping: 23, stiffness: 135 } });
  const exit = interpolate(localFrame, [Math.max(18, duration - 14), duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const opacity = interpolate(exit, [0, 1], [interpolate(enter, [0, 1], [0.22, 1]), 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        paddingBottom: 190,
        opacity,
        transform: `translateY(${interpolate(enter, [0, 1], [28, 0]) - exit * 12}px)`
      }}
    >
      <div
        style={{
          maxWidth: 840,
          fontSize: fitTextSize(text),
          lineHeight: 0.91,
          fontWeight: 500,
          letterSpacing: -2.1,
          textTransform: 'uppercase',
          textWrap: 'balance',
          textShadow: '0 14px 42px rgba(0,0,0,0.96)'
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
