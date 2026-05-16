import React from 'react';
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { DesignPackage, ScriptPackage } from '../shared/types';

function fitTitleSize(text: string) {
  if (text.length > 90) return 62;
  if (text.length > 70) return 72;
  if (text.length > 48) return 82;
  return 94;
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
  const sceneFrames = Math.max(55, Math.floor(durationInFrames / Math.max(3, design.scenes.length)));
  const titleSize = fitTitleSize(script.title);
  const glow = interpolate(frame, [0, durationInFrames * 0.4, durationInFrames], [0.16, 0.28, 0.2], {
    easing: Easing.out(Easing.cubic)
  });
  const titleSpring = spring({ fps, frame, config: { damping: 14, stiffness: 90 } });
  const titleTranslate = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const progress = interpolate(frame, [0, durationInFrames - 1], [0.08, 1], { extrapolateRight: 'clamp' });

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

      <AbsoluteFill style={{ padding: '68px 68px 290px 68px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, letterSpacing: 3, opacity: 0.84 }}>
          <span>{script.durationSeconds}s</span>
          <span>{script.language.toUpperCase()}</span>
        </div>

        <div style={{ display: 'grid', gap: 28, alignContent: 'center', minHeight: 1040 }}>
          <div
            style={{
              fontSize: titleSize,
              lineHeight: 0.94,
              fontWeight: 800,
              maxWidth: 860,
              textWrap: 'balance',
              opacity: titleOpacity,
              transform: `translateY(${titleTranslate}px)`,
              textShadow: '0 16px 44px rgba(0,0,0,0.32)'
            }}
          >
            {script.title}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {design.scenes.slice(0, 3).map((scene, index) => (
              <Sequence key={scene.id} from={index * sceneFrames}>
                <SceneCard
                  accent={scene.accent}
                  fps={fps}
                  frame={frame - index * sceneFrames}
                  text={scene.text}
                />
              </Sequence>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
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
  accent
}: {
  text: string;
  frame: number;
  fps: number;
  accent: boolean;
}) {
  const enter = spring({ fps, frame, config: { damping: 16, stiffness: 110 } });
  const opacity = interpolate(enter, [0, 1], [0, accent ? 1 : 0.88]);
  const translateY = interpolate(enter, [0, 1], [34, 0]);
  const scale = interpolate(enter, [0, 1], [0.96, 1]);

  return (
    <div
      style={{
        padding: '20px 22px',
        borderRadius: 28,
        maxWidth: 840,
        fontSize: 34,
        lineHeight: 1.12,
        background: accent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.13)',
        color: accent ? '#231916' : 'white',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: accent ? '0 18px 42px rgba(0,0,0,0.18)' : 'none'
      }}
    >
      {text}
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
