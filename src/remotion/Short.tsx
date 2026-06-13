import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { DesignPackage, ScriptPackage } from '../shared/types';

function fitTitleSize(text: string) {
  if (text.length > 110) return 58;
  if (text.length > 84) return 68;
  if (text.length > 56) return 78;
  return 92;
}

function fitSubtitleSize(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words >= 22 || text.length > 150) return 28;
  if (words >= 17 || text.length > 115) return 31;
  if (words >= 13 || text.length > 85) return 34;
  return 38;
}

function getSceneTimings(lines: string[], durationInFrames: number) {
  const weights = lines.map((line) => Math.max(5, line.split(/\s+/).filter(Boolean).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;

  return weights.map((weight, index) => {
    const remainingFrames = durationInFrames - cursor;
    const remainingScenes = weights.length - index;
    const proportionalFrames = Math.round((durationInFrames * weight) / totalWeight);
    const duration = index === weights.length - 1
      ? remainingFrames
      : Math.max(30, Math.min(proportionalFrames, remainingFrames - (remainingScenes - 1) * 30));
    const timing = { startFrame: cursor, duration };
    cursor += duration;
    return timing;
  });
}

export function YtVidShort({
  script,
  design,
  audioFile,
  musicFile,
  musicVolume = 0.1
}: {
  script: ScriptPackage;
  design: DesignPackage;
  audioFile: string | null;
  musicFile?: string | null;
  musicVolume?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const titleSize = fitTitleSize(script.title);
  const visualLines = script.onScreenText.filter((line) => line.trim());
  const sceneTimings = getSceneTimings(visualLines, durationInFrames);
  const glow = interpolate(frame, [0, durationInFrames * 0.4, durationInFrames], [0.14, 0.26, 0.18], {
    easing: Easing.out(Easing.cubic)
  });
  const titleSpring = spring({ fps, frame, config: { damping: 18, stiffness: 150 } });
  const titleTranslate = interpolate(titleSpring, [0, 1], [44, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const progress = interpolate(frame, [0, durationInFrames - 1], [0.06, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${design.gradient[0]} 0%, ${design.gradient[1]} 52%, ${design.gradient[2]} 100%)`,
        color: 'white',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}
    >
      {audioFile ? <Audio src={audioFile} volume={1} /> : null}
      {musicFile ? <Audio src={musicFile} volume={musicVolume} /> : null}

      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 65% 18%, rgba(255,255,255,${glow}), transparent 28%)`
        }}
      />

      <AbsoluteFill style={{ padding: '132px 64px 190px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: titleSize,
              lineHeight: 0.94,
              fontWeight: 800,
              maxWidth: 900,
              width: '100%',
              textAlign: 'center',
              textWrap: 'balance',
              opacity: titleOpacity,
              transform: `translateY(${titleTranslate}px)`,
              textShadow: '0 16px 44px rgba(0,0,0,0.32)'
            }}
          >
            {script.title}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            marginTop: 54,
            height: 650,
            overflow: 'hidden'
          }}
        >
          {visualLines.map((line, index) => (
            <SceneSubtitle
              fps={fps}
              frame={frame}
              key={`${line}-${index}`}
              startFrame={sceneTimings[index]?.startFrame || 0}
              text={line}
              windowSize={sceneTimings[index]?.duration || durationInFrames}
            />
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 18 }}>
          <div
            style={{
              height: 6,
              width: '100%',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.9)'
              }}
            />
          </div>

          {design.ctaPresentation.showOnScreenCta && design.ctaPresentation.onScreenCtaText ? (
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                opacity: 0.96,
                maxWidth: 860
              }}
            >
              {design.ctaPresentation.onScreenCtaText}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SceneSubtitle({
  text,
  frame,
  fps,
  startFrame,
  windowSize
}: {
  text: string;
  frame: number;
  fps: number;
  startFrame: number;
  windowSize: number;
}) {
  const localFrame = frame - startFrame;
  const enter = spring({ fps, frame: localFrame, config: { damping: 20, stiffness: 170 } });
  const exitStart = Math.max(12, windowSize - 16);
  const exitProgress = interpolate(localFrame, [exitStart, windowSize], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const enterOpacity = interpolate(enter, [0, 1], [0, 1]);
  const opacity = interpolate(exitProgress, [0, 1], [enterOpacity, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const translateYIn = interpolate(enter, [0, 1], [24, 0]);
  const translateYOut = interpolate(exitProgress, [0, 1], [0, -12]);
  const letterSpacing = interpolate(enter, [0, 1], [1.8, 0.2]);

  if (localFrame < -18 || localFrame > windowSize) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
        padding: '18px 0'
      }}
    >
      <div
        style={{
          maxWidth: 900,
          width: '100%',
          fontSize: fitSubtitleSize(text),
          lineHeight: 1.12,
          fontWeight: 700,
          letterSpacing,
          textAlign: 'center',
          textWrap: 'balance',
          color: 'rgba(255,255,255,0.98)',
          textShadow: '0 10px 30px rgba(0,0,0,0.42)',
          transform: `translateY(${translateYIn + translateYOut}px)`
        }}
      >
        {text}
      </div>
    </div>
  );
}
