export type LanguageCode = 'en' | 'ru' | 'de' | 'es' | 'it' | 'kk';
export type TextProviderId = 'cerebras' | 'openrouter' | 'gemini';

export type TextGenerationSettings = {
  provider: TextProviderId;
  apiKey?: string;
  model?: string;
};

export type AutoDirectionId =
  | 'psychology'
  | 'relationships'
  | 'zodiac'
  | 'mindset'
  | 'numerology'
  | 'random';

export type VideoMode = 'shorts' | 'horror';
export type HorrorStyle = 'campfire' | 'urban-legend' | 'paranormal' | 'psychological';

export type RuleSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Direction = {
  id: string;
  name: string;
  summary: string;
  audience: string;
  style: string;
  color: string;
  category: string;
  autoCategory?: Exclude<AutoDirectionId, 'random'>;
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
  durationSec?: number;
};

export type YouTubePackage = {
  title: string;
  description: string;
  tags: string[];
  fileName: string;
};

export type AutoPoster = {
  title: string;
  facts: string[];
};

export type AutoVoiceover = {
  text: string;
  cta: string;
};

export type AutoMaterial = {
  topic: string;
  poster: AutoPoster;
  voiceover: AutoVoiceover;
  onScreenText: string[];
  youtube: {
    title: string;
    description: string;
    tags: string[];
  };
  rules: {
    maxDurationSec: number;
    ctaOnlyInVoice: boolean;
    language: LanguageCode;
  };
};

export type AutoVideoRequest = {
  direction: AutoDirectionId;
  language: LanguageCode;
  voiceover: boolean;
  durationSec: number;
};

export type HorrorStoryRequest = {
  language: LanguageCode;
  style: HorrorStyle;
  voiceover: boolean;
  visualization: boolean;
};

export type HorrorStoryDraft = {
  title: string;
  story: string;
  description: string;
  tags: string[];
  visualMotifs: string[];
};

export type HorrorStoryPart = {
  index: number;
  total: number;
  title: string;
  text: string;
  cta: string;
  voiceoverText: string;
  onScreenText: string[];
  visualPrompt: string;
  durationSec: number;
};

export type HorrorSeriesPartResult = {
  index: number;
  title: string;
  durationSec: number;
  outputVideoPath: string;
  exportVideoPath: string;
  exportVideoUrl: string;
};

export type HorrorSeriesResult = {
  runId: string;
  status: 'completed' | 'failed';
  title: string;
  exportDir: string;
  absoluteExportDir: string;
  parts: HorrorSeriesPartResult[];
};

export type AutoVideoResult = {
  runId: string;
  status: 'queued' | 'completed' | 'failed';
  videoPath: string;
  exportDir?: string;
  absoluteExportDir?: string;
  exportVideoPath?: string;
  uploadTextPath?: string;
  metadataPath?: string;
  artifacts: {
    material: string;
    poster: string;
    metadata: string;
    manifest: string;
    voiceover: string;
    renderInput: string;
  };
  summary: {
    topic: string;
    poster: AutoPoster;
    voiceover: AutoVoiceover;
    onScreenText: string[];
  };
};

export type AutoVideoManifest = {
  mode: 'auto';
  runId: string;
  createdAt: string;
  request: AutoVideoRequest;
  resolvedDirectionId: string;
  resolvedDirectionName: string;
  topic: string;
  language: LanguageCode;
  durationSec: number;
  hasVoiceover: boolean;
  videoPath: string;
  exportDir?: string;
  absoluteExportDir?: string;
  exportVideoPath?: string;
  uploadTextPath?: string;
  metadataPath?: string;
  artifacts: Record<string, string>;
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
  exportDir?: string;
  absoluteExportDir?: string;
  exportVideoPath?: string;
  uploadTextPath?: string;
  metadataPath?: string;
  hasVoiceover: boolean;
  renderStatus: 'pending' | 'completed' | 'blocked' | 'failed';
  mode?: 'manual' | 'auto' | 'horror';
  errorMessage?: string | null;
  artifacts: Record<string, string>;
  youtubePackage: YouTubePackage;
  seriesParts?: HorrorSeriesPartResult[];
};

export type BootstrapPayload = {
  project: {
    name: string;
    url: string;
  };
  directions: Direction[];
  languages: LanguageOption[];
  textSettings: {
    provider: TextProviderId;
    cerebrasModel: string;
    openrouterModel: string;
    geminiModel: string;
  };
  rules: HermesRule[];
};
