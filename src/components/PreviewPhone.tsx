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
      <div className="previewTitle">{script.title}</div>
      <div className="previewCaptions">
        {script.onScreenText.map((line, index) => (
          <div className={index === 0 ? 'caption active' : 'caption'} key={`${line}-${index}`}>
            {line}
          </div>
        ))}
      </div>
      {design.ctaPresentation.showOnScreenCta && design.ctaPresentation.onScreenCtaText ? (
        <div className="previewCta">{design.ctaPresentation.onScreenCtaText}</div>
      ) : (
        <div className="previewRule">CTA is spoken in voiceover, so no on-screen CTA block.</div>
      )}
    </div>
  );
}
