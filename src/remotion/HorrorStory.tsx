import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import type { HorrorStoryPart } from '../shared/types';

function getSentenceTimings(lines: string[], durationInFrames: number) {
  const contentEnd = Math.floor(durationInFrames * 0.84);
  const weights = lines.map((line) => Math.max(5, line.split(/\s+/).filter(Boolean).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;

  return weights.map((weight, index) => {
    const remainingFrames = contentEnd - cursor;
    const remainingScenes = weights.length - index;
    const proportionalFrames = Math.round((contentEnd * weight) / totalWeight);
    const duration = index === weights.length - 1
      ? remainingFrames
      : Math.max(30, Math.min(proportionalFrames, remainingFrames - (remainingScenes - 1) * 30));
    const timing = { startFrame: cursor, duration };
    cursor += duration;
    return timing;
  });
}

function fitSentenceSize(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 28 || text.length > 190) return 30;
  if (words > 22 || text.length > 145) return 34;
  if (words > 16 || text.length > 105) return 39;
  return 46;
}

export function HorrorStoryVideo({
  part,
  audioFile,
  musicFile,
  musicVolume = 0.08,
  visualization = true
}: {
  part: HorrorStoryPart;
  audioFile: string | null;
  musicFile?: string | null;
  musicVolume?: number;
  visualization?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const timings = getSentenceTimings(part.onScreenText, durationInFrames);
  const localizedPartLabel = /[\u0400-\u04ff]/.test(part.title) ? 'ЧАСТЬ' : 'PART';
  const slowDrift = interpolate(frame, [0, durationInFrames], [-20, 24], {
    easing: Easing.inOut(Easing.cubic)
  });
  const ctaStart = Math.floor(durationInFrames * 0.84);
  const ctaSpring = spring({ fps, frame: frame - ctaStart, config: { damping: 20, stiffness: 130 } });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: visualization
          ? 'linear-gradient(180deg, #030506 0%, #07100f 48%, #1a0d08 100%)'
          : 'linear-gradient(180deg, #070809 0%, #141619 100%)',
        color: '#f4eee4',
        fontFamily: 'Georgia, Segoe UI, serif'
      }}
    >
      {audioFile ? <Audio src={audioFile} volume={1} /> : null}
      {musicFile ? <Audio src={musicFile} volume={musicVolume} /> : null}

      {visualization ? (
        <>
          <AbsoluteFill
            style={{
              transform: `scale(1.08) translateY(${slowDrift}px)`,
              background: 'radial-gradient(circle at 50% 82%, rgba(255,112,38,0.28), transparent 34%)'
            }}
          />
          <Fog frame={frame} />
          <ForestSilhouette />
          <Campfire frame={frame} />
          <Embers frame={frame} durationInFrames={durationInFrames} />
        </>
      ) : null}

      <AbsoluteFill style={{ padding: '108px 72px 176px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e69b64', fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>
            {localizedPartLabel} {part.index}/{part.total}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 54,
              lineHeight: 1.04,
              fontWeight: 800,
              textShadow: '0 12px 36px rgba(0,0,0,0.86)'
            }}
          >
            {part.title.replace(/\s+-\s+(?:Part|Часть|Бөлім|Teil|Parte)\s+\d+\/\d+$/i, '')}
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, marginTop: 60 }}>
          {part.onScreenText.map((sentence, index) => (
            <StorySentence
              duration={timings[index]?.duration || durationInFrames}
              fps={fps}
              frame={frame}
              key={`${index}-${sentence}`}
              startFrame={timings[index]?.startFrame || 0}
              text={sentence}
            />
          ))}
        </div>

        <div
          style={{
            minHeight: 100,
            display: 'grid',
            placeItems: 'center',
            opacity: interpolate(ctaSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(ctaSpring, [0, 1], [18, 0])}px)`,
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: 28,
            lineHeight: 1.2,
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 8px 24px rgba(0,0,0,0.9)'
          }}
        >
          {frame >= ctaStart ? part.cta : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function StorySentence({
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
  if (localFrame < -15 || localFrame > duration) return null;

  const enter = spring({ fps, frame: localFrame, config: { damping: 22, stiffness: 130 } });
  const exit = interpolate(localFrame, [Math.max(12, duration - 16), duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        display: 'grid',
        placeItems: 'center',
        opacity: interpolate(exit, [0, 1], [interpolate(enter, [0, 1], [0, 1]), 0]),
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0]) - exit * 12}px)`
      }}
    >
      <div
        style={{
          maxWidth: 900,
          fontSize: fitSentenceSize(text),
          lineHeight: 1.18,
          fontWeight: 700,
          textAlign: 'center',
          textWrap: 'balance',
          textShadow: '0 10px 34px rgba(0,0,0,0.94)'
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

function Fog({ frame }: { frame: number }) {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: -240 + index * 300 + Math.sin((frame + index * 70) / 55) * 70,
            top: 520 + index * 210,
            width: 760,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(180,196,190,0.055)',
            filter: 'blur(45px)'
          }}
        />
      ))}
    </>
  );
}

function ForestSilhouette() {
  return (
    <div style={{ position: 'absolute', inset: '0 0 430px', opacity: 0.82 }}>
      {Array.from({ length: 12 }, (_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${index * 9 - 4}%`,
            bottom: 0,
            width: 0,
            height: 0,
            borderLeft: `${56 + (index % 3) * 10}px solid transparent`,
            borderRight: `${56 + (index % 3) * 10}px solid transparent`,
            borderBottom: `${430 + (index % 4) * 80}px solid #020504`
          }}
        />
      ))}
    </div>
  );
}

function Campfire({ frame }: { frame: number }) {
  const pulse = 1 + Math.sin(frame / 4) * 0.06;
  return (
    <div style={{ position: 'absolute', left: '50%', bottom: 110, transform: `translateX(-50%) scale(${pulse})` }}>
      <div
        style={{
          width: 230,
          height: 300,
          borderRadius: '48% 52% 54% 46% / 68% 65% 35% 32%',
          background: 'radial-gradient(circle at 50% 72%, #fff4af 0%, #ff9d28 30%, #d43c12 58%, transparent 70%)',
          filter: 'blur(2px)',
          transform: `rotate(${Math.sin(frame / 7) * 2}deg)`
        }}
      />
      <div style={{ width: 300, height: 28, marginTop: -36, borderRadius: 999, background: '#24120c', transform: 'rotate(7deg)' }} />
      <div style={{ width: 300, height: 28, marginTop: -28, borderRadius: 999, background: '#32160d', transform: 'rotate(-7deg)' }} />
    </div>
  );
}

function Embers({ frame, durationInFrames }: { frame: number; durationInFrames: number }) {
  return (
    <>
      {Array.from({ length: 22 }, (_, index) => {
        const cycle = (frame * (0.7 + (index % 5) * 0.12) + index * 83) % durationInFrames;
        const rise = interpolate(cycle, [0, durationInFrames], [0, 960]);
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${42 + ((index * 17) % 18)}%`,
              bottom: 300 + rise,
              width: 4 + (index % 3) * 2,
              height: 4 + (index % 3) * 2,
              borderRadius: '50%',
              background: index % 2 ? '#ffb34d' : '#f36a2d',
              boxShadow: '0 0 12px rgba(255,122,48,0.9)',
              opacity: interpolate(cycle, [0, durationInFrames * 0.75, durationInFrames], [0.9, 0.5, 0])
            }}
          />
        );
      })}
    </>
  );
}
