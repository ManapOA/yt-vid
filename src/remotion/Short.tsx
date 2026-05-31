import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { DesignPackage, ScriptPackage } from '../shared/types';

function fitTitleSize(text: string) {
  if (text.length > 110) return 58;
  if (text.length > 84) return 68;
  if (text.length > 56) return 78;
  return 92;
}

function getSceneWindow(durationInFrames: number, count: number) {
  const safeCount = Math.max(1, count);
  return Math.max(30, Math.floor(durationInFrames / safeCount));
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
  const visualLines = script.onScreenText.slice(0, 3);
  const sceneWindow = getSceneWindow(durationInFrames, Math.max(1, visualLines.length));
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

      <AbsoluteFill style={{ padding: '68px 64px 248px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, letterSpacing: 3, opacity: 0.84 }}>
          <span>{script.durationSeconds}s</span>
          <span>{script.language.toUpperCase()}</span>
        </div>

        <div style={{ marginTop: 56 }}>
          <div
            style={{
              fontSize: titleSize,
              lineHeight: 0.94,
              fontWeight: 800,
              maxWidth: 900,
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
            height: 500,
            overflow: 'hidden'
          }}
        >
          {visualLines.map((line, index) => (
            <SceneSubtitle
              fps={fps}
              frame={frame}
              key={`${line}-${index}`}
              sceneIndex={index}
              text={line}
              windowSize={sceneWindow}
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

          <div
            style={{
              display: 'grid',
              gap: 8,
              alignItems: 'flex-start'
            }}
          >
            {visualLines.map((item, index) => (
              <AnimatedCaptionLine frame={frame} fps={fps} index={index} key={`${item}-${index}`} text={item} />
            ))}
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
  sceneIndex,
  windowSize
}: {
  text: string;
  frame: number;
  fps: number;
  sceneIndex: number;
  windowSize: number;
}) {
  const localFrame = frame - sceneIndex * windowSize;
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
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        pointerEvents: 'none',
        opacity,
        paddingBottom: 26
      }}
    >
      <div
        style={{
          maxWidth: 900,
          fontSize: 38,
          lineHeight: 1.08,
          fontWeight: 700,
          letterSpacing,
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

function AnimatedCaptionLine({
  text,
  frame,
  fps,
  index
}: {
  text: string;
  frame: number;
  fps: number;
  index: number;
}) {
  const localFrame = frame - index * 4;
  const enter = spring({ fps, frame: localFrame, config: { damping: 20, stiffness: 170 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [18, 0]);
  const scaleX = interpolate(enter, [0, 1], [0.92, 1]);

  return (
    <span
      style={{
        fontSize: 18,
        lineHeight: 1.15,
        maxWidth: 620,
        paddingLeft: 14,
        borderLeft: '2px solid rgba(255,255,255,0.46)',
        opacity,
        transform: `translateY(${translateY}px) scaleX(${scaleX})`,
        transformOrigin: 'left center',
        color: 'rgba(255,255,255,0.92)'
      }}
    >
      {text}
    </span>
  );
}
