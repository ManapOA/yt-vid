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
  return Math.max(70, Math.floor(durationInFrames / safeCount));
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
  const sceneWindow = getSceneWindow(durationInFrames, Math.min(3, design.scenes.length));
  const glow = interpolate(frame, [0, durationInFrames * 0.4, durationInFrames], [0.14, 0.26, 0.18], {
    easing: Easing.out(Easing.cubic)
  });
  const titleSpring = spring({ fps, frame, config: { damping: 16, stiffness: 92 } });
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
            height: 570,
            overflow: 'hidden'
          }}
        >
          {design.scenes.slice(0, 3).map((scene, index) => (
            <SceneCard
              accent={scene.accent}
              fps={fps}
              frame={frame}
              key={scene.id}
              sceneIndex={index}
              text={scene.text}
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
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'flex-start'
            }}
          >
            {script.onScreenText.slice(0, 3).map((item, index) => (
              <AnimatedChip frame={frame} fps={fps} index={index} key={`${item}-${index}`} text={item} />
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

function SceneCard({
  text,
  frame,
  fps,
  accent,
  sceneIndex,
  windowSize
}: {
  text: string;
  frame: number;
  fps: number;
  accent: boolean;
  sceneIndex: number;
  windowSize: number;
}) {
  const localFrame = frame - sceneIndex * windowSize;
  const enter = spring({ fps, frame: localFrame, config: { damping: 18, stiffness: 120 } });
  const exitStart = Math.max(18, windowSize - 22);
  const exitProgress = interpolate(localFrame, [exitStart, windowSize], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const enterOpacity = interpolate(enter, [0, 1], [0, accent ? 1 : 0.9]);
  const opacity = interpolate(exitProgress, [0, 1], [enterOpacity, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const translateYIn = interpolate(enter, [0, 1], [28, 0]);
  const translateYOut = interpolate(exitProgress, [0, 1], [0, -16]);
  const scaleIn = interpolate(enter, [0, 1], [0.965, 1]);
  const scaleOut = interpolate(exitProgress, [0, 1], [1, 0.985]);

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
        opacity
      }}
    >
      <div
        style={{
          padding: '26px 28px',
          borderRadius: 30,
          width: '100%',
          maxWidth: 880,
          maxHeight: 500,
          overflow: 'hidden',
          fontSize: 34,
          lineHeight: 1.12,
          fontWeight: 600,
          background: accent ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.12)',
          color: accent ? '#231916' : 'white',
          transform: `translateY(${translateYIn + translateYOut}px) scale(${scaleIn * scaleOut})`,
          boxShadow: accent ? '0 18px 42px rgba(0,0,0,0.18)' : '0 12px 34px rgba(0,0,0,0.14)'
        }}
      >
        {text}
      </div>
    </div>
  );
}

function AnimatedChip({
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
  const localFrame = frame - index * 8;
  const enter = spring({ fps, frame: localFrame, config: { damping: 18, stiffness: 120 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [16, 0]);

  return (
    <span
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.08)',
        fontSize: 18,
        lineHeight: 1.15,
        maxWidth: 520,
        opacity,
        transform: `translateY(${translateY}px)`
      }}
    >
      {text}
    </span>
  );
}
