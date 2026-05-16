export type LanguageCode = 'en' | 'ru' | 'de' | 'es' | 'it';

export type RuleSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Direction = {
  id: string;
  name: string;
  summary: string;
  audience: string;
  style: string;
  color: string;
  category: string;
  topicSeeds: string[];
};

export type LanguageOption = {
  code: LanguageCode;
  label: string;
};

export type TopicCandidate = {
  topic: string;
  hook: string;
  angle: string;
  audience: string;
  noveltyScore: number;
  risk: 'low' | 'medium' | 'high';
};

export type TopicGenerationResult = {
  direction: string;
  language: LanguageCode;
  topics: TopicCandidate[];
};

export type ScriptPackage = {
  language: LanguageCode;
  direction: string;
  topic: string;
  durationSeconds: number;
  hook: string;
  body: string[];
  cta: string;
  voiceoverText: string;
  onScreenText: string[];
  title: string;
  description: string;
  tags: string[];
};

export type MultiScriptPackage = {
  baseLanguage: LanguageCode;
  directionId: string;
  topic: string;
  languages: ScriptPackage[];
  hasVoiceover: boolean;
};

export type CtaPresentation = {
  hasVoiceover: boolean;
  cta: string;
  voiceoverText: string;
  showOnScreenCta: boolean;
  onScreenCtaText: string | null;
};

export type DesignPackage = {
  directionId: string;
  theme: string;
  gradient: [string, string, string];
  captions: string[];
  ctaPresentation: CtaPresentation;
  scenes: Array<{
    id: string;
    text: string;
    accent: boolean;
  }>;
};

export type VoiceArtifact = {
  language: LanguageCode;
  fileName: string;
  relativePath: string;
  bytes: number;
};

export type YouTubePackage = {
  title: string;
  description: string;
  tags: string[];
  fileName: string;
};

export type HermesRule = {
  id: string;
  severity: RuleSeverity;
  rule: string;
  reason: string;
  check: string;
};

export type HermesViolation = {
  ruleId: string;
  severity: RuleSeverity;
  message: string;
};

export type RunRecord = {
  id: string;
  createdAt: string;
  directionId: string;
  directionName: string;
  topic: string;
  languages: LanguageCode[];
  outputDir: string;
  hasVoiceover: boolean;
  renderStatus: 'pending' | 'completed' | 'blocked';
  artifacts: Record<string, string>;
  youtubePackage: YouTubePackage;
};

export type BootstrapPayload = {
  project: {
    name: string;
    url: string;
  };
  directions: Direction[];
  languages: LanguageOption[];
  rules: HermesRule[];
};
