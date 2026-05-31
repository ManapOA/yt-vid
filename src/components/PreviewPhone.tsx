import type { DesignPackage, ScriptPackage } from '../shared/types';

export function PreviewPhone({ script, design }: { script: ScriptPackage | null; design: DesignPackage | null }) {
  if (!script || !design) {
    return <div className="previewEmpty">Generate a script to see the final video look.</div>;
  }

  return (
    <div
      className="previewPhone"
      style={{
        background: `linear-gradient(160deg, ${design.gradient[0]} 0%, ${design.gradient[1]} 52%, ${design.gradient[2]} 100%)`
      }}
    >
      <div className="previewMeta">
        <span>{script.durationSeconds}s</span>
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
