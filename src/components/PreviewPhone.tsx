import type { DesignPackage, ScriptPackage } from '../shared/types';

function estimateSpeechDurationSec(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(30, Math.ceil(words / 2.6)));
}

export function PreviewPhone({ script, design }: { script: ScriptPackage | null; design: DesignPackage | null }) {
  if (!script || !design) {
    return <div className="previewEmpty">Generate a script to see the final video look.</div>;
  }

  const previewDuration = estimateSpeechDurationSec(script.voiceoverText || [script.hook, ...script.body, script.cta].join(' '));

  return (
    <div
      className="previewPhone"
      style={{
        background: `linear-gradient(160deg, ${design.gradient[0]} 0%, ${design.gradient[1]} 52%, ${design.gradient[2]} 100%)`
      }}
    >
      <div className="previewMeta">
        <span>~{previewDuration}s</span>
        <span>{script.language.toUpperCase()}</span>
      </div>
      <div className="previewTitleWrap">
        <div className="previewTitle">{script.title}</div>
      </div>
      <div className="previewSubtitleStage">
        {script.onScreenText.slice(0, 3).map((line, index) => (
          <div className="previewSubtitleLine" key={`${line}-${index}`} style={{ animationDelay: `${index * 0.08}s` }}>
            {line}
          </div>
        ))}
      </div>
      {design.ctaPresentation.showOnScreenCta && design.ctaPresentation.onScreenCtaText ? (
        <div className="previewCta">{design.ctaPresentation.onScreenCtaText}</div>
      ) : (
        <div className="previewRule">Voice CTA only</div>
      )}
    </div>
  );
}
