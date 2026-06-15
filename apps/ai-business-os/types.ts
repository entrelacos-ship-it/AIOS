import React from 'react';

// Extend Window interface for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  
  // Course Creator Sub-views
  COURSE_CREATOR_DASHBOARD = 'COURSE_CREATOR_DASHBOARD',
  COURSE_CREATOR_PIPELINE = 'COURSE_CREATOR_PIPELINE',
  COURSE_CREATOR_FRAMEWORKS = 'COURSE_CREATOR_FRAMEWORKS',
  COURSE_CREATOR_BLUEPRINTS = 'COURSE_CREATOR_BLUEPRINTS',
  COURSE_CREATOR_PERSONAS = 'COURSE_CREATOR_PERSONAS',
  COURSE_CREATOR_DETAILS = 'COURSE_CREATOR_DETAILS',
  COURSE_CREATOR_EDITOR = 'COURSE_CREATOR_EDITOR',

  // PRD Studio Sub-views
  PRD_STUDIO_DASHBOARD = 'PRD_STUDIO_DASHBOARD',
  PRD_STUDIO_WIZARD = 'PRD_STUDIO_WIZARD', // Init (Legacy)
  PRD_STUDIO_BRIEF = 'PRD_STUDIO_BRIEF', // New: 2.5 Brief Builder
  PRD_STUDIO_ANALYSIS = 'PRD_STUDIO_ANALYSIS', // Benchmarking/SWOT
  PRD_STUDIO_RESEARCH = 'PRD_STUDIO_RESEARCH', // User/Pain Research
  PRD_STUDIO_KNOWLEDGE = 'PRD_STUDIO_KNOWLEDGE', // New: Knowledge Ingestion
  PRD_STUDIO_SPECS = 'PRD_STUDIO_SPECS', // New: 2.6 Spec Wizard (Editor)
  PRD_STUDIO_PLAN = 'PRD_STUDIO_PLAN', // New: 2.7 Epics & Stories
  PRD_STUDIO_EXPORT = 'PRD_STUDIO_EXPORT', // New: 2.8 Gateway

  PRD_STUDIO = 'PRD_STUDIO', // Legacy/Fallback
  
  // Branding OS (New 3.1)
  BRANDING_OS = 'BRANDING_OS',
  BRANDING_OS_MANIFESTO = 'BRANDING_OS_MANIFESTO',
  BRANDING_OS_EDITORIAL_LINES = 'BRANDING_OS_EDITORIAL_LINES',
  BRANDING_OS_CALENDAR = 'BRANDING_OS_CALENDAR',
  BRANDING_OS_ASSET = 'BRANDING_OS_ASSET',
  BRANDING_OS_CONTEXT = 'BRANDING_OS_CONTEXT',
  BRANDING_OS_OBJECTIVE = 'BRANDING_OS_OBJECTIVE',
  BRANDING_OS_CONTENT = 'BRANDING_OS_CONTENT',
  BRANDING_OS_VISUAL = 'BRANDING_OS_VISUAL',
  BRANDING_OS_EXPORT = 'BRANDING_OS_EXPORT',

  // Cognitive Engine (Mentes Sintéticas)
  COGNITIVE_ENGINE_INFERENCE = 'COGNITIVE_ENGINE_INFERENCE',
  COGNITIVE_ENGINE_SCIENTIFIC = 'COGNITIVE_ENGINE_SCIENTIFIC',
  COGNITIVE_ENGINE_RELATIONSHIPS = 'COGNITIVE_ENGINE_RELATIONSHIPS',
  COGNITIVE_ENGINE_SYSTEMS = 'COGNITIVE_ENGINE_SYSTEMS',
  COGNITIVE_ENGINE_TOOLS = 'COGNITIVE_ENGINE_TOOLS',
  COGNITIVE_ENGINE_MODELS = 'COGNITIVE_ENGINE_MODELS',
  COGNITIVE_ENGINE_PRECISION = 'COGNITIVE_ENGINE_PRECISION',

  ELO_CUT = 'ELO_CUT',

  // EditAI — Automated Video Editor
  EDIT_AI = 'EDIT_AI',
  EDIT_AI_DASHBOARD = 'EDIT_AI_DASHBOARD',
  EDIT_AI_UPLOAD = 'EDIT_AI_UPLOAD',
  EDIT_AI_TRANSCRIBE = 'EDIT_AI_TRANSCRIBE',
  EDIT_AI_CUT_REPORT = 'EDIT_AI_CUT_REPORT',
  EDIT_AI_PLAN_APPROVAL = 'EDIT_AI_PLAN_APPROVAL',
  EDIT_AI_RENDER = 'EDIT_AI_RENDER',
  EDIT_AI_REVIEW = 'EDIT_AI_REVIEW',

  MEDIA_STUDIO = 'MEDIA_STUDIO',
  
  // Design System
  DESIGN_SYSTEM = 'DESIGN_SYSTEM',
  DESIGN_SYSTEM_FOUNDATIONS = 'DESIGN_SYSTEM_FOUNDATIONS',
  DESIGN_SYSTEM_COMPONENTS = 'DESIGN_SYSTEM_COMPONENTS',
  DESIGN_SYSTEM_ASSETS = 'DESIGN_SYSTEM_ASSETS',

  AI_CONTROL_CENTER = 'AI_CONTROL_CENTER',

  ECOSYSTEM_CLONES = 'ECOSYSTEM_CLONES',
  ECOSYSTEM_MATRIX = 'ECOSYSTEM_MATRIX',

  // Design Studio
  DESIGN_STUDIO = 'DESIGN_STUDIO',
  DESIGN_STUDIO_DASHBOARD = 'DESIGN_STUDIO_DASHBOARD',
  DESIGN_STUDIO_WORKSPACE = 'DESIGN_STUDIO_WORKSPACE',
  DESIGN_STUDIO_CRITIQUE = 'DESIGN_STUDIO_CRITIQUE',
  DESIGN_STUDIO_HISTORY = 'DESIGN_STUDIO_HISTORY',
  DESIGN_STUDIO_VARIATIONS = 'DESIGN_STUDIO_VARIATIONS',
  DESIGN_STUDIO_ADVISOR = 'DESIGN_STUDIO_ADVISOR',

  // Squad Manager
  SQUAD_MANAGER = 'SQUAD_MANAGER',
  SQUAD_MANAGER_BUILDER = 'SQUAD_MANAGER_BUILDER',
  SQUAD_MANAGER_RUN = 'SQUAD_MANAGER_RUN',
  SQUAD_MANAGER_AI_WIZARD = 'SQUAD_MANAGER_AI_WIZARD',

  // Clone Studio (Stark Mansion)
  CLONE_STUDIO = 'CLONE_STUDIO',
  CLONE_STUDIO_CHAT = 'CLONE_STUDIO_CHAT',
  CLONE_STUDIO_BUILDER = 'CLONE_STUDIO_BUILDER',

  // AutoEdit — auto-edit-video pipeline
  AUTO_EDIT = 'AUTO_EDIT',
  AUTO_EDIT_UPLOAD = 'AUTO_EDIT_UPLOAD',
  AUTO_EDIT_WORKSPACE = 'AUTO_EDIT_WORKSPACE',

  // Ads Studio — claude-ads
  ADS_STUDIO = 'ADS_STUDIO',
  ADS_STUDIO_AUDIT = 'ADS_STUDIO_AUDIT',
  ADS_STUDIO_COPY = 'ADS_STUDIO_COPY',
  ADS_STUDIO_STRATEGY = 'ADS_STUDIO_STRATEGY',

  // Design References — awesome-design-md submodule
  DESIGN_REFERENCES = 'DESIGN_REFERENCES',

  // Time de Tráfego Pago — Meta Ads squad
  TRAFFIC_TEAM = 'TRAFFIC_TEAM',

  // Slides Studio — criação de slides para aulas e vídeos
  SLIDES_STUDIO = 'SLIDES_STUDIO',
  SLIDES_STUDIO_DASHBOARD = 'SLIDES_STUDIO_DASHBOARD',
  SLIDES_STUDIO_NEW = 'SLIDES_STUDIO_NEW',
  SLIDES_STUDIO_VIEWER = 'SLIDES_STUDIO_VIEWER',

  // Carousel Studio — CRUD + preview + export de carrosséis
  CAROUSEL_STUDIO = 'CAROUSEL_STUDIO',
  CAROUSEL_STUDIO_DASHBOARD = 'CAROUSEL_STUDIO_DASHBOARD',
  CAROUSEL_STUDIO_VIEWER = 'CAROUSEL_STUDIO_VIEWER',
}

export type AIProviderId = 'groq' | 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export type AICapability =
  | 'text_generation'
  | 'structured_text'
  | 'image_generation'
  | 'image_editing'
  | 'video_generation'
  | 'search_grounded_text';

export type AIProviderCredentialStatus = 'missing' | 'configured' | 'invalid';
export type AIProviderHealthState = 'unknown' | 'healthy' | 'degraded' | 'disabled' | 'missing_credentials' | 'error';

export interface AIProviderConfig {
  id: AIProviderId;
  label: string;
  enabled: boolean;
  baseUrl?: string;
  modelDefaults: Partial<Record<AICapability, string>>;
  capabilities: Record<AICapability, boolean>;
  credentialStatus: AIProviderCredentialStatus;
  updatedAt: string;
}

export interface AIProviderSecretStatus {
  providerId: AIProviderId;
  maskedKey: string;
  hasKey: boolean;
  updatedAt: string | null;
}

export interface AIProviderRecord {
  config: AIProviderConfig;
  secret: AIProviderSecretStatus;
}

export interface AIRoutingPolicy {
  capability: AICapability;
  primaryProvider: AIProviderId | null;
  fallbackOrder: AIProviderId[];
}

export interface AIProviderHealth {
  providerId: AIProviderId;
  state: AIProviderHealthState;
  message: string;
  checkedAt: string | null;
}

export type AIPromptTemplateGroup =
  | 'manifesto'
  | 'editorial'
  | 'calendar'
  | 'format_prompt'
  | 'content_generation';

export type AIPromptTemplateId =
  | 'branding_manifesto_agent'
  | 'branding_editorial_manifesto'
  | 'branding_editorial_blank'
  | 'branding_content_calendar'
  | 'branding_format_prompt_default'
  | 'branding_format_prompt_carousel'
  | 'branding_format_prompt_ads'
  | 'branding_format_prompt_post'
  | 'branding_format_prompt_slide'
  | 'branding_content_generation_carousel'
  | 'branding_content_generation_ads'
  | 'branding_content_generation_post'
  | 'branding_content_generation_slide';

export interface AIPromptTemplate {
  id: AIPromptTemplateId;
  label: string;
  description: string;
  group: AIPromptTemplateGroup;
  scope: 'branding';
  prompt: string;
  updatedAt: string;
}

export type BrandManifestoSourceType = 'uploaded_file' | 'manual' | 'ai';

export interface BrandManifestoRecord {
  id: string;
  name: string;
  content: string;
  sourceType: BrandManifestoSourceType;
  sourceFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BrandEditorialLineSource = 'ai' | 'manual';
export type BrandEditorialLineScopeMode = 'manifesto' | 'blank';
export type BrandVisualIdentitySource = 'manual' | 'instagram_seed';

export interface BrandEditorialLineRecord {
  id: string;
  manifestoId: string | null;
  scopeMode: BrandEditorialLineScopeMode;
  blankWorkspaceId?: string | null;
  content: string;
  selected: boolean;
  source: BrandEditorialLineSource;
  createdAt: string;
  updatedAt: string;
}

export interface BrandVisualIdentityRecord {
  id: string;
  manifestoId: string | null;
  scopeMode: BrandEditorialLineScopeMode;
  blankWorkspaceId?: string | null;
  brandName: string;
  brandHandle: string;
  brandStudioLabel: string;
  instagramPageName: string;
  instagramUsername: string;
  profileImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  titleFontFamily: 'serif' | 'sans';
  bodyFontFamily: 'serif' | 'sans';
  titleFontSize: number;
  bodyFontSize: number;
  visualStyle: string;
  imageryDirection: string;
  layoutNotes: string;
  source: BrandVisualIdentitySource;
  createdAt: string;
  updatedAt: string;
}

export type BrandCalendarPostStatus = 'Draft' | 'Scheduled' | 'Published';
export type BrandCalendarApprovalStatus = 'Needs Review' | 'Approved';
export type BrandInstagramSyncStatus = 'Not Synced' | 'Ready' | 'Scheduled' | 'Published' | 'Error';

export interface BrandCalendarPostRecord {
  id: string;
  day: string;
  format: string;
  editorialLine: string;
  theme: string;
  description: string;
  status: BrandCalendarPostStatus;
  approvalStatus: BrandCalendarApprovalStatus;
  scheduledAt: string;
  instagramStatus: BrandInstagramSyncStatus;
  imageUrl: string;
}

export interface LocalPluginSkillRecord {
  name: string;
  displayName: string;
  description: string;
  shortDescription: string;
  defaultPrompt: string;
  invocation: string;
  path: string;
  pluginName: string;
}

export interface LocalPluginRecord {
  name: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  path: string;
  skills: LocalPluginSkillRecord[];
}

export interface NavItem {
  id: string;
  label: string;
  view: View;
  icon: React.ElementType;
}

export enum ImageSize {
  S_1K = '1K',
  S_2K = '2K',
  S_4K = '4K',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  MOBILE_PORTRAIT = '9:16',
  WIDE = '16:9',
  CINEMATIC = '21:9',
}

// Blueprint Data Structures
export type BlueprintType = 'IA' | 'DOC' | 'STRAT';

export interface Blueprint {
  id: string;
  title: string;
  type: BlueprintType;
  description: string;
  icon: React.ElementType; 
  tags: string[];
  recommendedFor?: string[]; // Persona Archetypes or IDs
  structure?: {
    steps?: string[];
    temperature?: number; // For AI
    format?: string; // For Docs
  };
}

// Pipeline Data Structures
export enum PipelineStage {
  IDEATION = 'IDEATION',
  SCRIPTING = 'SCRIPTING',
  ASSETS = 'ASSETS',
  PRODUCTION = 'PRODUCTION',
  POST_PRODUCTION = 'POST_PRODUCTION',
  PUBLISHED = 'PUBLISHED'
}

export interface PipelineTask {
  id: string;
  title: string;
  personaId: string;
  stage: PipelineStage;
  duration?: string; // e.g. "12m"
  progress: number; // 0-100 (Internal checklist)
  isStagnant?: boolean; // If true, shows red alert
  tags?: string[];
  assignee?: string; // Initials
}

// PRD Data Structures
export type StoryStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
export type Complexity = 'P' | 'M' | 'G';

export interface UserStory {
  id: string;
  title: string; // "Como [Persona], quero [Ação]..."
  acceptanceCriteria: string[]; // List of checkboxes
  points: number; // Fibonacci (1, 2, 3, 5, 8, 13)
  status: StoryStatus;
  dependencies?: string[]; // IDs of other stories
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  stories: UserStory[];
}

export interface Project {
  id: string;
  title: string;
  status: 'IDEATION' | 'ANALYSIS' | 'PRODUCTION' | 'DONE';
  tech_stack: string[];
  epics: Epic[];
  updated_at: string;
}

// Analysis Data Structures
export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  usp: string; // Unique Selling Proposition (Gold)
  viabilityScore: number; // 0-100
  sources?: { title: string; uri: string }[]; // Search Grounding sources
}

export interface ResearchData {
  painPoints: string[];
  forumInsights: string[]; // "Mining"
  technicalRisks: string[];
}

// Brief Builder Structures (2.5)
export interface Stakeholder {
  role: string;
  name: string;
  interest: 'High' | 'Medium' | 'Low';
}

export interface SmartGoal {
  goal: string;
  metric: string;
  deadline: string;
}

export type MoSCoWCategory = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';

export interface MoSCoWItem {
  id: string;
  text: string;
  category: MoSCoWCategory;
}

export interface BriefData {
  chatHistory: { role: 'ai' | 'user', text: string }[];
  stakeholders: Stakeholder[];
  smartGoals: SmartGoal[];
  moscowList: MoSCoWItem[];
}


// Persona Data Structures
export enum AwarenessLevel {
  UNCONSCIOUS = 'Unconscious',
  PROBLEM_AWARE = 'Problem Aware',
  SOLUTION_AWARE = 'Solution Aware',
  PRODUCT_AWARE = 'Product Aware',
  MOST_AWARE = 'Most Aware',
}

export enum Archetype {
  WARRIOR = 'Warrior',
  CREATOR = 'Creator',
  EXPLORER = 'Explorer',
  INNOCENT = 'Innocent',
  SAGE = 'Sage',
  MAGICIAN = 'Magician',
  OUTLAW = 'Outlaw',
  RULER = 'Ruler',
  LOVER = 'Lover',
  CAREGIVER = 'Caregiver',
  JESTER = 'Jester',
  EVERYMAN = 'Everyman'
}

export enum LearningStyle {
  VISUAL = 'Visual',
  AUDITORY = 'Auditory',
  READING = 'Reading/Writing',
  KINESTHETIC = 'Kinesthetic',
}

export interface Persona {
  id: string;
  name: string;
  segment_age: string;
  occupation: string;
  awareness_level: AwarenessLevel;
  pain_points: string;
  aspirations: string;
  objections: string[];
  archetype: Archetype;
  triggers: string[];
  learning_style: LearningStyle;
  time_availability: string;
  prior_knowledge: string;
  ai_insight: string;
  stats: {
    technical: number;
    emotional: number;
    availability: number;
  };
}

// Course Detail Structures
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ';
  retention: number;
  status: 'PUBLISHED' | 'DRAFT' | 'REVISION';
  tags?: string[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  dropOffRate?: number;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  version: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  updatedAt: string;
  healthScore: number;
  completionRate: number;
  completionTrend: number;
  nps: number;
  students: number;
  modules: Module[];
}

// Cognitive Engine Data Structures
export type CognitiveCategory = 'complementary' | 'typological' | 'specialized' | 'clinical';
export type CognitiveType = 'tipo' | 'dim' | 'stage' | 'symbolic';
export type ValidityLevel = 'High' | 'Medium' | 'Low';
export type UtilityLevel = 'High' | 'Medium' | 'Low';

export interface CognitiveSystem {
    id: string;
    name: string;
    originalName?: string;
    description: string;
    category: CognitiveCategory;
    type: CognitiveType;
    componentsCount: number | null; // e.g. 16 types, 9 types
    validity: ValidityLevel;
    utility: UtilityLevel;
    coverage: number; // 0-100%
    originYear: number;
    detectionConfidence: number; // 0-100%
    tags: string[];
    // UI Enhancements
    themeColor?: string; // Tailwind class text color (e.g., 'text-emerald-400')
    dimensions?: string[]; // Specific dimensions list for card display
    driverOverlap?: string; // Description text for overlap
}

// Inference Engine Structures
export interface InferenceEvent {
  id: string;
  timestamp: string;
  userHash: string;
  inputType: 'text' | 'audio' | 'behavior';
  inputSnippet: string;
  detectedDriver: string; // e.g., "Medo / Segurança"
  mappedSystem: string; // e.g., "Eneagrama 6"
  confidenceScore: number; // 0-100
  actionSuggested: string;
}

export interface InferenceStats {
  activeMinds: number;
  activeAgents: number;
  processedInteractions: number;
  systemCoverage: number;
}

// ─── EditAI — Automated Video Editor ──────────────────────────────────────────

export interface EditAIWord {
  index: number;
  word: string;
  start: number;
  end: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export type EditAISceneType = 'A' | 'B' | 'C+' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'BONECO';

export interface EditAISceneRaw {
  id: number;
  tipo: EditAISceneType;
  startLeg: number;
  endLeg: number;
  conteudo: Record<string, unknown>;
}

export interface EditAIScene extends EditAISceneRaw {
  frame_inicio: number;
  frame_fim: number;
}

export interface EditAIPalette {
  primaria: string;
  secundaria: string;
  acento: string;
  texto: string;
}

export interface EditAICutReport {
  id?: string;
  tipo: 'silencio' | 'gaguejo' | 'refazimento';
  inicio: number;
  fim: number;
  duracao: number;
  preview: string;
  aprovado: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  reason?: string;
  source?: 'ai' | 'manual' | 'system';
  riskLevel?: 'low' | 'medium' | 'high';
}

export type EditAIProjectStatus =
  | 'uploading'
  | 'normalizing'
  | 'transcribing'
  | 'cutting'
  | 'awaiting_approval'
  | 'planning'
  | 'awaiting_plan'
  | 'analyzing'
  | 'ready'
  | 'rendering'
  | 'done'
  | 'error';

export type EditAITemplate = 'dicas-rapidas' | 'aula-teorica' | 'caso-historia' | 'aula-longa';

/** Destino de publicação — define thresholds de corte e prompts de IA */
export type EditAIFormatoDestino = 'reels' | 'youtube';

export type EditAIEditPreset = 'auto' | 'clean' | 'kinetic' | 'cinematic';

export interface EditAIVideoProject {
  id: string;
  title: string;
  sourceFileName: string;
  status: EditAIProjectStatus;
  formatoDestino: EditAIFormatoDestino;
  editPreset: EditAIEditPreset;
  originalPath: string;
  normalizedPath: string;
  cutPath: string;
  renderPath: string;
  fps: number;
  words: EditAIWord[];
  transcription: string;
  cutReport: EditAICutReport[];
  planText: string;
  planApproved: boolean;
  template: EditAITemplate | null;
  formato: string;
  paleta: EditAIPalette | null;
  scenes: EditAIScene[];
  renderProgress: number;
  error: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Design Studio ────────────────────────────────────────────────────────────

export type DesignPhilosophySchool =
  | 'pentagram'
  | 'ia_typography'
  | 'kenya_hara'
  | 'field_generative'
  | 'stamen';

export type DesignOutputType =
  | 'html_prototype'
  | 'presentation'
  | 'infographic'
  | 'critique'
  | 'motion_design'
  | 'design_variations'
  | 'direction_advisor';

export type DesignDeviceFrame = 'iphone_15' | 'browser' | 'none';

export interface DesignBrief {
  title: string;
  description: string;
  outputType: DesignOutputType;
  philosophySchool: DesignPhilosophySchool;
  deviceFrame: DesignDeviceFrame;
  colorHints?: string;
  contentNotes?: string;
}

export interface DesignCritiqueScore {
  philosophy: number;
  hierarchy: number;
  craft: number;
  functionality: number;
  originality: number;
  summary: string;
  recommendations: string[];
}

export interface DesignArtifact {
  id: string;
  brief: DesignBrief;
  htmlContent: string;
  createdAt: string;
  critiqueScore?: DesignCritiqueScore;
}

export interface DesignDirection {
  id: number;
  title: string;
  school: DesignPhilosophySchool;
  rationale: string;
  keyDecisions: string[];
  colorPalette: string[];
  typographyNote: string;
  htmlPreview: string;
}

export interface DesignVariationsResult {
  brief: DesignBrief;
  variations: Array<{ hint: string; htmlContent: string }>;
  createdAt: string;
}

// ─── Squad Manager ────────────────────────────────────────────────────────────

export interface SquadAgent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
  capability: AICapability;
  color: string;
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  agents: SquadAgent[];
  createdAt: string;
  updatedAt: string;
}

export type SquadStageStatus = 'pending' | 'running' | 'waiting_input' | 'done' | 'error';

export interface SquadStage {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentColor: string;
  input: string;
  output: string;
  status: SquadStageStatus;
  userFeedback?: string;
  startedAt?: string;
  finishedAt?: string;
}

export type SquadRunStatus = 'idle' | 'running' | 'waiting_input' | 'done' | 'error' | 'aborted';

// ─── Clone Studio ─────────────────────────────────────────────────────────────

export type CloneCategory = 'thought_leader' | 'copywriting' | 'marketing' | 'systems' | 'custom';

export interface CloneRecord {
  id: string;
  name: string;
  category: CloneCategory;
  description: string;
  tags: string[];
  systemPrompt: string;
  validationScore?: number;
  validationTier?: string;
  isPrebuilt: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CloneMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CloneConversation {
  id: string;
  cloneId: string;
  cloneName: string;
  messages: CloneMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SquadRun {
  id: string;
  squadId: string;
  squadName: string;
  task: string;
  stages: SquadStage[];
  status: SquadRunStatus;
  currentStageIndex: number;
  createdAt: string;
  finishedAt?: string;
}

// ─── Ads Studio ──────────────────────────────────────────────────────────────

export type AdsPlatform = 'google' | 'meta' | 'youtube' | 'linkedin' | 'tiktok' | 'microsoft' | 'apple';

export type AdsHealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type AdsIndustry =
  | 'saas' | 'ecommerce' | 'b2b' | 'healthcare' | 'finance' | 'local_services' | 'education' | 'other';

export type AdsCampaignGoal = 'sales' | 'leads' | 'installs' | 'awareness' | 'traffic';

export type AdsCopyFramework = 'AIDA' | 'PAS' | 'BAB' | '4P' | 'FAB' | 'Star-Story-Solution';

export interface AdsCategoryScore {
  name: string;
  score: number;
  weight: number;
  passed: number;
  warnings: number;
  failures: number;
  notes: string;
}

export interface AdsQuickWin {
  severity: 'critical' | 'high' | 'medium';
  issue: string;
  action: string;
  estimatedTime: string;
}

export interface AdsAuditRecord {
  id: string;
  platform: AdsPlatform;
  industry: AdsIndustry;
  monthlySpend: number;
  goal: AdsCampaignGoal;
  metricsRaw: string;
  healthScore: number;
  grade: AdsHealthGrade;
  categories: AdsCategoryScore[];
  quickWins: AdsQuickWin[];
  summary: string;
  createdAt: string;
}

export interface AdsCopyVariant {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
}

export interface AdsCopyRecord {
  id: string;
  platform: AdsPlatform;
  framework: AdsCopyFramework;
  productDescription: string;
  targetAudience: string;
  goal: string;
  variants: AdsCopyVariant[];
  createdAt: string;
}

export interface AdsCampaignConcept {
  title: string;
  hypothesis: string;
  messagingPillar: string;
  visualDirection: string;
  copyFramework: AdsCopyFramework;
  targetAudience: string;
  platforms: AdsPlatform[];
}

export interface AdsStrategyRecord {
  id: string;
  brandDescription: string;
  goal: AdsCampaignGoal;
  monthlyBudget: number;
  activePlatforms: AdsPlatform[];
  concepts: AdsCampaignConcept[];
  budgetRecommendation: string;
  createdAt: string;
}

// ─── AutoEdit ────────────────────────────────────────────────────────────────

export type AutoEditStage =
  | 'idle'
  | 'normalizing'
  | 'transcribing'
  | 'planning'
  | 'cutting'
  | 'captioning'
  | 'metadata'
  | 'shorts'
  | 'done'
  | 'error';

export interface AutoEditWord {
  word: string;
  start: number;
  end: number;
}

export interface AutoEditSegment {
  start: number;
  end: number;
  keep: boolean;
  reason?: string;
}

export interface AutoEditMetadata {
  title: string;
  description: string;
  hashtags: string[];
  shortsTitle?: string;
  shortsDescription?: string;
}

export interface AutoEditProject {
  id: string;
  title: string;
  sourceFileName: string;
  sourcePath: string;
  normalizedPath: string;
  outputPath: string;
  shortsPath: string;
  captionsPath: string;
  stage: AutoEditStage;
  words: AutoEditWord[];
  transcript: string;
  segments: AutoEditSegment[];
  metadata: AutoEditMetadata | null;
  includeShorts: boolean;
  error: string;
  createdAt: string;
  updatedAt: string;
}
