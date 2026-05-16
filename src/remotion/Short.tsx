import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, interpolate } from 'remotion';
import type { DesignPackage, ScriptPackage } from '../shared/types';

export function YtVidShort({
  script,
  design,
  audioFile
}: {
  script: ScriptPackage;
  design: DesignPackage;
  audioFile: string | null;
}) {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 30, 90], [0.7, 1, 0.75], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${design.gradient[0]} 0%, ${design.gradient[1]} 52%, ${design.gradient[2]} 100%)`,
        color: 'white',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}
    >
      {audioFile ? <Audio src={audioFile} volume={1} /> : null}
      <AbsoluteFill style={{ padding: 72, justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24, letterSpacing: 3, opacity: 0.8 }}>{script.language.toUpperCase()}</div>
        <div style={{ display: 'grid', gap: 26, alignContent: 'center', minHeight: 1180 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 0.95,
              fontWeight: 800,
              textWrap: 'balance',
              textShadow: `0 0 ${Math.round(glow * 42)}px rgba(255,255,255,0.18)`
            }}
          >
            {script.title}
          </div>
          {design.scenes.slice(0, 3).map((scene, index) => (
            <Sequence key={scene.id} from={index * 30}>
              <div
                style={{
                  fontSize: 42,
                  lineHeight: 1.15,
                  opacity: scene.accent ? 1 : 0.82,
                  maxWidth: 820
                }}
              >
                {scene.text}
              </div>
            </Sequence>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            {script.onScreenText.slice(0, 4).map((item, index) => (
              <span
                key={`${item}-${index}`}
                style={{
                  padding: '12px 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  fontSize: 24
                }}
              >
                {item}
              </span>
            ))}
          </div>
          {design.ctaPresentation.showOnScreenCta && design.ctaPresentation.onScreenCtaText ? (
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                opacity: 0.95
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
