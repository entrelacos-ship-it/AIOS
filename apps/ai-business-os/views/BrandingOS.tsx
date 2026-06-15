import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
    Zap, FileText, Target, Edit3, Image as ImageIcon, Download, 
    ChevronRight, ChevronLeft, UploadCloud, BrainCircuit, 
    ShieldAlert, CheckCircle2, User, Layout, ArrowRight, Layers,
    Monitor, StickyNote, Palette, X, Sparkles, AlertTriangle, RefreshCw,
    Combine, BookOpen, Mic, Quote, Video, Lightbulb, List, Calendar, Bot, Instagram, Plus, Trash2, Edit, Save, GripVertical, Copy, Search
} from 'lucide-react';
import {
    generateStructuredContent,
    generateImage,
    critiqueBrandCopy,
    CritiqueResponse,
    generateEditorialLines,
    generateContentCalendar,
    generateFormatPrompts,
    generateBrandManifesto,
    generateCalendarCardSuggestion,
    type BrandManifestoBrief,
    type CalendarCardSuggestionInput,
    type ContentCalendarEntry,
    type ContentCalendarDateRange,
} from '../services/geminiService';
import {
    ImageSize,
    AspectRatio,
    View,
    type AIPromptTemplate,
    type BrandCalendarApprovalStatus,
    type BrandCalendarPostRecord,
    type BrandCalendarPostStatus,
    type BrandEditorialLineRecord,
    type BrandEditorialLineScopeMode,
    type BrandEditorialLineSource,
    type BrandInstagramSyncStatus,
    type BrandManifestoRecord,
    type BrandManifestoSourceType,
    type BrandVisualIdentityRecord,
    type LocalPluginRecord,
} from '../types';
import { DEFAULT_AI_PROMPT_TEMPLATES, resolveBrandingContentGenerationPromptId, resolveBrandingFormatPromptId } from '../services/aiPromptDefaults';
import { resolveBrandingStepFromView, resolveBrandingViewFromStep } from './brandosStepView';
import {
    PREMIUM_BRANDING_COVER_TEMPLATE_ID,
    PREMIUM_BRANDING_ROTATION,
    PREMIUM_BRANDING_TEMPLATE_OPTIONS,
    buildPremiumBrandingSlideMarkup,
    getBrandingTypographyGuide,
    normalizeBrandingTemplateId,
    type BrandingHtmlTemplateId,
} from '../shared/brandingPremiumSlides';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Mind to App Stages
const STEPS = [
    { id: 0, label: 'Base da Marca', icon: BookOpen },
    { id: 1, label: 'Linhas', icon: List },
    { id: 2, label: 'Calendário', icon: Calendar },
    { id: 3, label: 'Formato', icon: Layout },      // Escolha do Veículo
    { id: 4, label: 'Ingestão', icon: UploadCloud }, // Input Bruto
    { id: 5, label: 'Decomposição', icon: Combine }, // A Lente / Filtro
    { id: 6, label: 'Construção', icon: BrainCircuit }, // Geração do Texto
    { id: 7, label: 'Embalagem', icon: Palette },    // Design Visual
    { id: 8, label: 'Entrega', icon: Download }      // Export
];

// Mock Archetypes (A Lente)
const ARCHETYPES = [
    { id: 'rebel', name: 'O Rebelde', trait: 'Disruptivo', desc: 'Quebra o status quo. Provocador.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'magician', name: 'O Mago', trait: 'Visionário', desc: 'Transforma realidade. Místico.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'sage', name: 'O Sábio', trait: 'Analítico', desc: 'Busca a verdade. Lógico.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const TEMPLATE_OPTIONS = [
    ...PREMIUM_BRANDING_TEMPLATE_OPTIONS,
    { id: 'editorial', name: 'Editorial' },
    { id: 'spotlight', name: 'Spotlight' },
    { id: 'split', name: 'Split Screen' },
    { id: 'entrelacos-orbit', name: 'Entrelaços Orbit' },
    { id: 'entrelacos-ribbon', name: 'Entrelaços Ribbon' },
    { id: 'entrelacos-mosaic', name: 'Entrelaços Mosaic' },
    { id: 'memo', name: 'Memo Slide' },
    { id: 'twitter-comment', name: 'Twitter Comment' },
    { id: 'quote-card', name: 'Quote Card' },
    { id: 'checklist', name: 'Checklist' },
    { id: 'story', name: 'Story' },
    { id: 'reel', name: 'Reel Cover' },
    { id: 'carousel-cover', name: 'Carousel Cover' },
] as const;

type BrandingTemplateId = BrandingHtmlTemplateId;
type EditorialSourceMode = 'manifesto' | 'blank';
type ContentStudioSourceMode = 'planned' | 'knowledge' | 'title';
type CarouselStylePresetId = 'brand-editorial' | 'entrelacos-signature';

const CAROUSEL_STYLE_PRESETS: Array<{
    id: CarouselStylePresetId;
    label: string;
    description: string;
    templateId?: BrandingTemplateId;
    accentColor?: string;
    backgroundColor?: string;
    titleFontFamily?: 'serif' | 'sans';
    bodyFontFamily?: 'serif' | 'sans';
}> = [
    {
        id: 'brand-editorial',
        label: 'Brand Editorial',
        description: 'Nova base premium em HTML/CSS com capa forte, showcases e quote cards profissionais.',
    },
    {
        id: 'entrelacos-signature',
        label: 'Entrelaços Signature',
        description: 'Família original da Entrelaços com ritmo editorial, formas orbitais e camadas sofisticadas.',
        templateId: 'entrelacos-orbit',
        titleFontFamily: 'serif',
        bodyFontFamily: 'sans',
    },
];

const DEFAULT_MANIFESTO_EDITORIAL_PROMPT = DEFAULT_AI_PROMPT_TEMPLATES.branding_editorial_manifesto.prompt;
const DEFAULT_BLANK_EDITORIAL_PROMPT = DEFAULT_AI_PROMPT_TEMPLATES.branding_editorial_blank.prompt;
const DEFAULT_CALENDAR_PROMPT = DEFAULT_AI_PROMPT_TEMPLATES.branding_content_calendar.prompt;
const DEFAULT_MANIFESTO_AGENT_PROMPT = DEFAULT_AI_PROMPT_TEMPLATES.branding_manifesto_agent.prompt;

interface SlideData {
    id: number;
    title: string;
    body: string;
    visualPrompt: string;
    eyebrow: string;
    footerLabel: string;
    imageUrl?: string;
    templateId: BrandingTemplateId;
    accentColor: string;
    secondaryColor: string;
    surfaceColor: string;
    textColor: string;
    titleFontSize: number;
    bodyFontSize: number;
    textAlign: 'left' | 'center' | 'right';
    titleFontFamily: 'serif' | 'sans';
    bodyFontFamily: 'serif' | 'sans';
    imageFit: 'cover' | 'contain';
    imagePlacement: 'background' | 'half';
    imageScale: number;
    backgroundColor: string;
}

const LEGACY_CAROUSEL_STYLE_PRESET_ALIASES: Record<string, CarouselStylePresetId> = {
    'aiox-neon': 'entrelacos-signature',
    'aiox-search': 'entrelacos-signature',
    'aiox-agent': 'entrelacos-signature',
    'aiox-command': 'entrelacos-signature',
    'aiox-promo': 'entrelacos-signature',
};

const HALF_CAPABLE_BRANDING_TEMPLATES = new Set<BrandingTemplateId>([
    'split',
    'memo',
    'entrelacos-ribbon',
    'entrelacos-mosaic',
    'twitter-comment',
]);

const normalizeBrandingTemplateForEditor = (templateId?: string): BrandingTemplateId =>
    normalizeBrandingTemplateId(templateId) || 'editorial';

const normalizeCarouselStylePreset = (presetId?: string): CarouselStylePresetId => {
    if (presetId && CAROUSEL_STYLE_PRESETS.some((preset) => preset.id === presetId)) {
        return presetId as CarouselStylePresetId;
    }

    return LEGACY_CAROUSEL_STYLE_PRESET_ALIASES[presetId || ''] || 'brand-editorial';
};

const normalizeSlideRecord = (slide: SlideData): SlideData => {
    const templateId = normalizeBrandingTemplateForEditor(slide.templateId);

    return {
        ...slide,
        templateId,
        imagePlacement: HALF_CAPABLE_BRANDING_TEMPLATES.has(templateId) ? slide.imagePlacement : 'background',
    };
};

interface CarouselBrandProfile {
    brandName: string;
    brandHandle: string;
    studioLabel: string;
    profileImageUrl: string;
}

interface CarouselDraftRecord {
    id: string;
    name: string;
    manifestoId: string | null;
    selectedAsset: string;
    carouselStylePreset: CarouselStylePresetId;
    selectedSlideIndex: number;
    packagingEditorPanel: PackagingEditorPanel;
    brandProfile: CarouselBrandProfile;
    slides: SlideData[];
    createdAt: string;
    updatedAt: string;
}

type CalendarPostStatus = BrandCalendarPostStatus;
type CalendarApprovalStatus = BrandCalendarApprovalStatus;
type InstagramSyncStatus = BrandInstagramSyncStatus;
type CalendarViewMode = 'monthly' | 'weekly' | 'daily';
type CalendarWorkspaceTab = 'calendar' | 'agenda' | 'agent';
type PackagingEditorPanel = 'brand' | 'content' | 'slides' | 'layout' | 'typography' | 'media' | 'ai';

interface CalendarPostDraft extends ContentCalendarEntry {
    id?: string;
    status?: CalendarPostStatus;
    approvalStatus?: CalendarApprovalStatus;
    scheduledAt?: string;
    instagramStatus?: InstagramSyncStatus;
    imageUrl?: string;
}

interface CalendarPost extends ContentCalendarEntry {
    id: string;
    status: CalendarPostStatus;
    approvalStatus: CalendarApprovalStatus;
    scheduledAt: string;
    instagramStatus: InstagramSyncStatus;
    imageUrl: string;
}

interface EditorialSeed {
    brandName: string;
    positioning: string;
    audience: string;
    voice: string;
    themes: string;
    objective: string;
    references: string;
}

interface EditorialLineItem {
    id: string;
    content: string;
    selected: boolean;
    source: BrandEditorialLineSource;
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const startOfWeek = (date: Date) => {
    const next = new Date(date);
    const day = next.getDay();
    const diff = (day + 6) % 7;
    next.setDate(next.getDate() - diff);
    next.setHours(0, 0, 0, 0);
    return next;
};

const endOfWeek = (date: Date) => addDays(startOfWeek(date), 41);

const parseCalendarItemDate = (value: string) => {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (!match) return null;
    const parsed = new Date(`${match[0]}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getCalendarDayKey = (value: string) => {
    const parsed = parseCalendarItemDate(value);
    return parsed ? formatDateInput(parsed) : value;
};

const resolveAssetFromCalendarFormat = (format: string) => {
    const normalized = format.toLowerCase();

    if (normalized.includes('carousel') || normalized.includes('carrossel')) {
        return 'Carousel';
    }

    if (normalized.includes('ad')) {
        return 'Ads';
    }

    if (normalized.includes('slide')) {
        return 'Slide';
    }

    return 'Post';
};

const getCalendarFormatColorClasses = (format: string) => {
    const normalized = format.toLowerCase();

    if (normalized.includes('live')) {
        return {
            accent: 'text-red-300',
            pill: 'bg-red-500/15 border-red-500/25 text-red-300',
            surface: 'border-red-500/20 bg-red-500/8',
        };
    }

    if (normalized.includes('reel')) {
        return {
            accent: 'text-orange-300',
            pill: 'bg-orange-500/15 border-orange-500/25 text-orange-300',
            surface: 'border-orange-500/20 bg-orange-500/8',
        };
    }

    if (normalized.includes('carousel') || normalized.includes('carrossel')) {
        return {
            accent: 'text-sky-300',
            pill: 'bg-sky-500/15 border-sky-500/25 text-sky-300',
            surface: 'border-sky-500/20 bg-sky-500/8',
        };
    }

    if (normalized.includes('story')) {
        return {
            accent: 'text-fuchsia-300',
            pill: 'bg-fuchsia-500/15 border-fuchsia-500/25 text-fuchsia-300',
            surface: 'border-fuchsia-500/20 bg-fuchsia-500/8',
        };
    }

    if (normalized.includes('post')) {
        return {
            accent: 'text-emerald-300',
            pill: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
            surface: 'border-emerald-500/20 bg-emerald-500/8',
        };
    }

    return {
        accent: 'text-primary',
        pill: 'bg-primary/15 border-primary/25 text-primary',
        surface: 'border-primary/20 bg-primary/8',
    };
};

const createDefaultBrandVisualIdentity = (
    scopeMode: BrandEditorialLineScopeMode = 'blank',
    manifestoId: string | null = null,
): BrandVisualIdentityRecord => {
    const timestamp = new Date().toISOString();
    return {
        id: `visual-local-${scopeMode}-${manifestoId || 'blank'}`,
        manifestoId: scopeMode === 'manifesto' ? manifestoId : null,
        scopeMode,
        brandName: 'Entrelaç[OS]',
        brandHandle: '@entrelacos.ai',
        brandStudioLabel: 'Entrelaços Studio',
        instagramPageName: '',
        instagramUsername: '',
        profileImageUrl: '',
        primaryColor: '#9900ff',
        secondaryColor: '#9900ff',
        accentColor: '#9900ff',
        backgroundColor: '#141414',
        surfaceColor: '#1f1f1f',
        textColor: '#f5f5f5',
        titleFontFamily: 'serif',
        bodyFontFamily: 'sans',
        titleFontSize: 48,
        bodyFontSize: 34,
        visualStyle: 'Editorial premium, contraste alto, construção sofisticada e foco em autoridade.',
        imageryDirection: 'Retratos, close-up, fundos escuros, composições limpas e poucos elementos por slide.',
        layoutNotes: 'Usar respiro, capas fortes, blocos bem hierarquizados e CTA objetivo no fechamento.',
        source: 'manual',
        createdAt: timestamp,
        updatedAt: timestamp,
    };
};

const createSlideDesignDefaultsFromIdentity = (identity?: Partial<BrandVisualIdentityRecord>) => ({
    eyebrow: identity?.brandName || 'Entrelaç[OS]',
    footerLabel: 'Carrossel',
    accentColor: identity?.accentColor || identity?.primaryColor || '#9900ff',
    secondaryColor: identity?.secondaryColor || '#9900ff',
    surfaceColor: identity?.surfaceColor || '#1f1f1f',
    textColor: identity?.textColor || '#f5f5f5',
    backgroundColor: identity?.backgroundColor || '#141414',
    titleFontSize: identity?.titleFontSize || 48,
    bodyFontSize: identity?.bodyFontSize || 34,
    textAlign: 'left' as const,
    titleFontFamily: identity?.titleFontFamily || 'serif' as const,
    bodyFontFamily: identity?.bodyFontFamily || 'sans' as const,
    imageFit: 'cover' as const,
    imagePlacement: 'background' as const,
    imageScale: 100,
});

const escapePreviewHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const buildPackagingPreviewFallbackMarkup = ({
    title,
    body,
    eyebrow,
    footerLabel,
    templateLabel,
    brandHandle,
    accentColor,
    secondaryColor,
    backgroundColor,
    textColor,
    titleFontSize,
    bodyFontSize,
    textAlign,
    titleFontFamily,
    bodyFontFamily,
}: {
    title: string;
    body: string;
    eyebrow: string;
    footerLabel: string;
    templateLabel: string;
    brandHandle: string;
    accentColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    titleFontSize: number;
    bodyFontSize: number;
    textAlign: 'left' | 'center' | 'right';
    titleFontFamily: 'serif' | 'sans';
    bodyFontFamily: 'serif' | 'sans';
}) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background:
        radial-gradient(circle at top right, ${accentColor}33, transparent 28%),
        radial-gradient(circle at bottom left, ${secondaryColor}2a, transparent 24%),
        linear-gradient(180deg, ${backgroundColor}, #050505);
      color: ${textColor};
    }
    body {
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: "Inter", "Segoe UI", sans-serif;
    }
    .eyebrow {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: ${accentColor};
    }
    .template {
      margin: 18px 0 0;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.48);
    }
    .title {
      margin: 24px 0 0;
      font-size: ${Math.min(titleFontSize, 44)}px;
      line-height: ${titleFontSize >= 56 ? '0.98' : '1.06'};
      letter-spacing: -0.03em;
      text-align: ${textAlign};
      font-family: ${titleFontFamily === 'sans' ? '"Inter", "Segoe UI", sans-serif' : '"Georgia", "Times New Roman", serif'};
    }
    .body {
      margin: 18px 0 0;
      font-size: ${Math.min(bodyFontSize, 24)}px;
      line-height: 1.6;
      text-align: ${textAlign};
      color: rgba(255,255,255,0.82);
      font-family: ${bodyFontFamily === 'sans' ? '"Inter", "Segoe UI", sans-serif' : '"Georgia", "Times New Roman", serif'};
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.10);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.48);
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">${escapePreviewHtml(eyebrow)}</p>
    <p class="template">${escapePreviewHtml(templateLabel)}</p>
    <h1 class="title">${escapePreviewHtml(title)}</h1>
    <p class="body">${escapePreviewHtml(body)}</p>
  </main>
  <footer class="footer">
    <span>${escapePreviewHtml(brandHandle)}</span>
    <span>${escapePreviewHtml(footerLabel)}</span>
  </footer>
</body>
</html>`;

const getSlideReadabilityGuide = (templateId?: BrandingTemplateId) => {
    return getBrandingTypographyGuide(templateId);
};

const clampSlideTypographyForTemplate = (slide: SlideData): SlideData => {
    const templateId = normalizeBrandingTemplateForEditor(slide.templateId);
    const guide = getSlideReadabilityGuide(templateId);
    return {
        ...slide,
        templateId,
        titleFontSize: Math.max(slide.titleFontSize, guide.titleMin),
        bodyFontSize: Math.max(slide.bodyFontSize, guide.bodyMin),
    };
};

const isPortraitBrandingTemplate = (templateId?: string) => {
    const normalizedTemplateId = normalizeBrandingTemplateForEditor(templateId);

    return (
        normalizedTemplateId === 'entrelacos-premium-cover' ||
        normalizedTemplateId === 'carousel-cover' ||
        normalizedTemplateId === 'entrelacos-orbit' ||
        normalizedTemplateId === 'entrelacos-ribbon' ||
        normalizedTemplateId === 'entrelacos-mosaic'
    );
};

const getSlideRenderHint = (templateId?: BrandingTemplateId) => {
    if (templateId === 'story' || templateId === 'reel') {
        return {
            aspectRatio: AspectRatio.MOBILE_PORTRAIT,
            viewportLabel: '1080x1920',
        };
    }

    if (isPortraitBrandingTemplate(templateId)) {
        return {
            aspectRatio: AspectRatio.PORTRAIT,
            viewportLabel: '1080x1440',
        };
    }

    return {
        aspectRatio: AspectRatio.SQUARE,
        viewportLabel: '1080x1080',
    };
};

const mapIdentityToCarouselProfile = (identity: Partial<BrandVisualIdentityRecord>): CarouselBrandProfile => ({
    brandName: identity.brandName || 'Entrelaç[OS]',
    brandHandle: identity.brandHandle || '@entrelacos.ai',
    studioLabel: identity.brandStudioLabel || 'Entrelaços Studio',
    profileImageUrl: identity.profileImageUrl || '',
});

const getCarouselStylePresetDefinition = (presetId: CarouselStylePresetId) =>
    CAROUSEL_STYLE_PRESETS.find((preset) => preset.id === presetId) || CAROUSEL_STYLE_PRESETS[0];

const formatCalendarLabel = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);

const formatWeekdayLabel = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');

const formatDayLabel = (date: Date) =>
    `${formatDateInput(date)} - ${new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)}`;

const buildScheduledAt = (dateValue: string, timeValue: string) => `${dateValue}T${timeValue}`;

const extractDateFromScheduledAt = (scheduledAt?: string) => scheduledAt?.slice(0, 10) || '';

const extractTimeFromScheduledAt = (scheduledAt?: string) => scheduledAt?.slice(11, 16) || '09:00';

const getDefaultScheduledAtFromDay = (dayLabel: string) => {
    const date = parseCalendarItemDate(dayLabel);
    return date ? `${formatDateInput(date)}T09:00` : '';
};

const createEditorialLine = (
    content: string = '',
    source: BrandEditorialLineSource = 'manual',
    overrides?: Partial<Pick<EditorialLineItem, 'id' | 'selected'>>,
): EditorialLineItem => ({
    id: overrides?.id || `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    selected: overrides?.selected ?? true,
    source,
});

const mapEditorialRecordToItem = (record: BrandEditorialLineRecord): EditorialLineItem => createEditorialLine(
    record.content,
    record.source,
    {
        id: record.id,
        selected: record.selected,
    },
);

interface BrandingOSProps {
  view?: View;
  onViewChange?: (view: View) => void;
}

const normalizeCalendarPost = (item: Partial<BrandCalendarPostRecord>): CalendarPost => ({
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `calendar-post-${Date.now()}`,
    day: typeof item.day === 'string' ? item.day : '',
    format: typeof item.format === 'string' ? item.format : '',
    editorialLine: typeof item.editorialLine === 'string' ? item.editorialLine : '',
    theme: typeof item.theme === 'string' ? item.theme : '',
    description: typeof item.description === 'string' ? item.description : '',
    status: item.status === 'Scheduled' || item.status === 'Published' ? item.status : 'Draft',
    approvalStatus: item.approvalStatus === 'Approved' ? 'Approved' : 'Needs Review',
    scheduledAt: typeof item.scheduledAt === 'string' ? item.scheduledAt : '',
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
    instagramStatus: item.instagramStatus === 'Ready' || item.instagramStatus === 'Scheduled' || item.instagramStatus === 'Published' || item.instagramStatus === 'Error'
        ? item.instagramStatus
        : ((typeof item.scheduledAt === 'string' && item.scheduledAt) && (typeof item.imageUrl === 'string' && item.imageUrl && !item.imageUrl.startsWith('data:')) ? 'Ready' : 'Not Synced'),
});

const getOrCreateBlankWorkspaceId = (): string => {
    const KEY = 'brandos-blank-workspace-id';
    try {
        let id = localStorage.getItem(KEY);
        if (!id) {
            id = `blank-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            localStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        return `blank-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
};

export const BrandingOS: React.FC<BrandingOSProps> = ({ view = View.BRANDING_OS_MANIFESTO, onViewChange }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [blankWorkspaceId] = useState<string>(getOrCreateBlankWorkspaceId);

    // Form Data
    const [selectedAsset, setSelectedAsset] = useState<string>('Carousel'); 
    const [contextText, setContextText] = useState('');
    const [activeSource, setActiveSource] = useState<string>('thought'); // book, podcast, quote, video, thought
    const [contentStudioSourceMode, setContentStudioSourceMode] = useState<ContentStudioSourceMode>('knowledge');
    const [contentStudioTitle, setContentStudioTitle] = useState('');
    const [selectedArchetype, setSelectedArchetype] = useState<string>('magician');
    const [selectedObjective, setSelectedObjective] = useState<string>('');
    
    // Engine State
    const [generatedSlides, setGeneratedSlides] = useState<SlideData[]>([]);
    const [agentStatus, setAgentStatus] = useState<'IDLE' | 'COPYWRITER' | 'CRITIC' | 'DESIGNER' | 'ILLUSTRATOR'>('IDLE');
    const [critique, setCritique] = useState<CritiqueResponse | null>(null);
    const [isCritiquingContent, setIsCritiquingContent] = useState(false);
    const [savedCarouselDrafts, setSavedCarouselDrafts] = useState<CarouselDraftRecord[]>([]);
    const [selectedCarouselDraftId, setSelectedCarouselDraftId] = useState<string | null>(null);
    const [carouselDraftName, setCarouselDraftName] = useState('');
    const [carouselDraftNotice, setCarouselDraftNotice] = useState('');
    const [carouselDraftError, setCarouselDraftError] = useState('');
    const [isLoadingCarouselDrafts, setIsLoadingCarouselDrafts] = useState(false);
    const [isSavingCarouselDraft, setIsSavingCarouselDraft] = useState(false);
    const [draggingSlideIndex, setDraggingSlideIndex] = useState<number | null>(null);

    // Visual State
    const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
    const [generatingImgId, setGeneratingImgId] = useState<number | null>(null);
    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [packagingEditorPanel, setPackagingEditorPanel] = useState<PackagingEditorPanel>('content');
    const [carouselStylePreset, setCarouselStylePreset] = useState<CarouselStylePresetId>('brand-editorial');
    const [isExportingCurrent, setIsExportingCurrent] = useState(false);
    const [isExportingPack, setIsExportingPack] = useState(false);
    const [brandVisualIdentity, setBrandVisualIdentity] = useState<BrandVisualIdentityRecord>(() => createDefaultBrandVisualIdentity('blank', null));
    const [carouselBrandProfile, setCarouselBrandProfile] = useState<CarouselBrandProfile>(() => mapIdentityToCarouselProfile(createDefaultBrandVisualIdentity('blank', null)));

    // Manifesto State
    const [editorialSourceMode, setEditorialSourceMode] = useState<EditorialSourceMode>('manifesto');
    const [manifestoFile, setManifestoFile] = useState<File | null>(null);
    const [manifestoName, setManifestoName] = useState<string>('');
    const [manifestoContent, setManifestoContent] = useState<string>('');
    const [manifestoDraftSourceType, setManifestoDraftSourceType] = useState<BrandManifestoSourceType>('manual');
    const [savedManifestos, setSavedManifestos] = useState<BrandManifestoRecord[]>([]);
    const [selectedManifestoId, setSelectedManifestoId] = useState<string | null>(null);
    const [editorialLines, setEditorialLines] = useState<EditorialLineItem[]>([]);
    const [contentCalendar, setContentCalendar] = useState<CalendarPost[]>([]);
    const [generatedPrompts, setGeneratedPrompts] = useState<Record<string, string>>({});
    const [manifestoAgentPrompt, setManifestoAgentPrompt] = useState<string>(DEFAULT_MANIFESTO_AGENT_PROMPT);
    const [manifestoEditorialPrompt, setManifestoEditorialPrompt] = useState<string>(DEFAULT_MANIFESTO_EDITORIAL_PROMPT);
    const [blankEditorialPrompt, setBlankEditorialPrompt] = useState<string>(DEFAULT_BLANK_EDITORIAL_PROMPT);
    const [calendarPrompt, setCalendarPrompt] = useState<string>(DEFAULT_CALENDAR_PROMPT);
    const [formatPromptTemplates, setFormatPromptTemplates] = useState<Record<string, string>>({});
    const [contentGenerationPromptTemplates, setContentGenerationPromptTemplates] = useState<Record<string, string>>({});
    const [localPlugins, setLocalPlugins] = useState<LocalPluginRecord[]>([]);
    const [localPluginsError, setLocalPluginsError] = useState('');
    const [copiedSkillPrompt, setCopiedSkillPrompt] = useState('');
    const [showManifestoAgentPanel, setShowManifestoAgentPanel] = useState(false);
    const [showVisualIdentityPanel, setShowVisualIdentityPanel] = useState(false);
    const [manifestoError, setManifestoError] = useState<string>('');
    const [manifestoNotice, setManifestoNotice] = useState<string>('');
    const [editorialError, setEditorialError] = useState<string>('');
    const [editorialNotice, setEditorialNotice] = useState<string>('');
    const [calendarError, setCalendarError] = useState<string>('');
    const [calendarNotice, setCalendarNotice] = useState<string>('');
    const [contentStudioError, setContentStudioError] = useState<string>('');
    const [textAiConfigured, setTextAiConfigured] = useState(false);
    const [textAiModel, setTextAiModel] = useState('Groq');
    const [isGeneratingManifesto, setIsGeneratingManifesto] = useState(false);
    const [isSavingManifestoPrompt, setIsSavingManifestoPrompt] = useState(false);
    const [isSavingEditorialPrompt, setIsSavingEditorialPrompt] = useState(false);
    const [isSavingCalendarPrompt, setIsSavingCalendarPrompt] = useState(false);
    const [isLoadingEditorialWorkspace, setIsLoadingEditorialWorkspace] = useState(false);
    const [isSavingEditorialWorkspace, setIsSavingEditorialWorkspace] = useState(false);
    const [hasUnsavedEditorialChanges, setHasUnsavedEditorialChanges] = useState(false);
    const [isLoadingCalendarWorkspace, setIsLoadingCalendarWorkspace] = useState(false);
    const [calendarRange, setCalendarRange] = useState<ContentCalendarDateRange>(() => {
        const today = new Date();
        return {
            startDate: formatDateInput(today),
            endDate: formatDateInput(addDays(today, 6)),
        };
    });
    const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => startOfMonth(new Date()));
    const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('monthly');
    const [calendarWorkspaceTab, setCalendarWorkspaceTab] = useState<CalendarWorkspaceTab>('calendar');
    const [calendarFocusedDayKey, setCalendarFocusedDayKey] = useState<string>(() => formatDateInput(new Date()));
    const [selectedCalendarPostIds, setSelectedCalendarPostIds] = useState<string[]>([]);
    const [selectedProductionPostIds, setSelectedProductionPostIds] = useState<string[]>([]);
    const [draggingCalendarPostId, setDraggingCalendarPostId] = useState<string | null>(null);
    const [draggingCalendarDayKey, setDraggingCalendarDayKey] = useState<string | null>(null);
    const [calendarFormatFilter, setCalendarFormatFilter] = useState<string>('all');
    const [calendarStatusFilter, setCalendarStatusFilter] = useState<'all' | CalendarPostStatus>('all');
    const [calendarEditorialLineFilter, setCalendarEditorialLineFilter] = useState<string>('all');
    const [calendarSearchQuery, setCalendarSearchQuery] = useState<string>('');
    const [agendaPreviewPostId, setAgendaPreviewPostId] = useState<string | null>(null);
    const [editorialSeed, setEditorialSeed] = useState<EditorialSeed>({
        brandName: '',
        positioning: '',
        audience: '',
        voice: '',
        themes: '',
        objective: '',
        references: '',
    });
    
    // Calendar & Instagram State
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);
    const [instagramAccountLabel, setInstagramAccountLabel] = useState('');
    const [isLoadingBrandIdentity, setIsLoadingBrandIdentity] = useState(false);
    const [isSavingBrandIdentity, setIsSavingBrandIdentity] = useState(false);
    const [hasUnsavedBrandIdentityChanges, setHasUnsavedBrandIdentityChanges] = useState(false);
    const [editingPost, setEditingPost] = useState<CalendarPostDraft | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGeneratingCalendarCardSuggestion, setIsGeneratingCalendarCardSuggestion] = useState(false);
    const [calendarCardGenerationMode, setCalendarCardGenerationMode] = useState<'ai' | 'manual'>('manual');
    const hasHydratedCalendarWorkspaceRef = useRef(false);
    const isHydratingCalendarWorkspaceRef = useRef(false);
    const calendarPersistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeCalendarPostModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingPost(null);
        setCalendarCardGenerationMode('manual');
    }, []);

    // Sync View Prop with Internal Step
    useEffect(() => {
        setCurrentStep(resolveBrandingStepFromView(view));
    }, [view]);

    useEffect(() => {
        if (!onViewChange) {
            return;
        }

        const nextView = resolveBrandingViewFromStep(currentStep);
        if (nextView !== view) {
            onViewChange(nextView);
        }
    }, [currentStep, onViewChange, view]);

    // --- Consolidated mount initialisation (batched to avoid ERR_INSUFFICIENT_RESOURCES) ---
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            // Batch 1 – critical: AI status + manifestos (max 2 concurrent connections)
            try {
                const [aiRes, manifestoRes] = await Promise.all([
                    fetch('/api/ai/providers/status').catch(() => null),
                    fetch('/api/branding/manifestos').catch(() => null),
                ]);

                if (cancelled) return;

                if (aiRes?.ok) {
                    const status = await aiRes.json();
                    setTextAiConfigured(Boolean(status?.textAiConfigured));
                    if (typeof status?.textPrimaryProvider === 'string' && status.textPrimaryProvider.trim()) {
                        setTextAiModel(status.textPrimaryProvider);
                    } else if (typeof status?.groqModel === 'string' && status.groqModel.trim()) {
                        setTextAiModel(status.groqModel);
                    }
                }

                if (manifestoRes) {
                    try {
                        const payload = await manifestoRes.json();
                        if (manifestoRes.ok) {
                            const manifestos = Array.isArray(payload?.manifestos) ? payload.manifestos as BrandManifestoRecord[] : [];
                            setSavedManifestos(manifestos);
                            if (manifestos.length > 0) {
                                const latest = manifestos[0];
                                setSelectedManifestoId(latest.id);
                                setManifestoName(latest.name);
                                setManifestoContent(latest.content);
                                setManifestoDraftSourceType(latest.sourceType);
                                setEditorialSourceMode('manifesto');
                            }
                        } else {
                            throw new Error(payload?.error || 'Falha ao carregar manifestos salvos.');
                        }
                    } catch (error) {
                        console.error('Failed to load brand manifestos', error);
                        setManifestoError(error instanceof Error ? error.message : 'Erro ao carregar manifestos salvos.');
                    }
                }
            } catch { /* individual catches above handle errors */ }

            if (cancelled) return;

            // Batch 2 – secondary: plugins + prompts (runs after batch 1 settles, leaves room for cascading fetches)
            try {
                const [pluginsRes, promptsRes] = await Promise.all([
                    fetch('/api/plugins/local').catch(() => null),
                    fetch('/api/ai/prompts').catch(() => null),
                ]);

                if (cancelled) return;

                if (pluginsRes) {
                    try {
                        const payload = await pluginsRes.json();
                        if (pluginsRes.ok) {
                            setLocalPlugins(Array.isArray(payload?.plugins) ? payload.plugins as LocalPluginRecord[] : []);
                            setLocalPluginsError('');
                        } else {
                            throw new Error(payload?.error || 'Falha ao carregar plugins locais.');
                        }
                    } catch (error) {
                        console.error('Failed to load local plugins', error);
                        setLocalPlugins([]);
                        setLocalPluginsError(error instanceof Error ? error.message : 'Erro ao carregar plugins locais.');
                    }
                }

                if (promptsRes?.ok) {
                    try {
                        const payload = await promptsRes.json();
                        const prompts = Array.isArray(payload?.prompts) ? payload.prompts as AIPromptTemplate[] : [];
                        const promptMap = Object.fromEntries(prompts.map((template) => [template.id, template.prompt]));

                        setManifestoAgentPrompt(promptMap.branding_manifesto_agent || DEFAULT_MANIFESTO_AGENT_PROMPT);
                        setManifestoEditorialPrompt(promptMap.branding_editorial_manifesto || DEFAULT_MANIFESTO_EDITORIAL_PROMPT);
                        setBlankEditorialPrompt(promptMap.branding_editorial_blank || DEFAULT_BLANK_EDITORIAL_PROMPT);
                        setCalendarPrompt(promptMap.branding_content_calendar || DEFAULT_CALENDAR_PROMPT);
                        setFormatPromptTemplates({
                            default: promptMap.branding_format_prompt_default || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_default.prompt,
                            Carousel: promptMap.branding_format_prompt_carousel || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_carousel.prompt,
                            Ads: promptMap.branding_format_prompt_ads || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_ads.prompt,
                            Post: promptMap.branding_format_prompt_post || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_post.prompt,
                            Slide: promptMap.branding_format_prompt_slide || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_slide.prompt,
                        });
                        setContentGenerationPromptTemplates({
                            Carousel: promptMap.branding_content_generation_carousel || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_carousel.prompt,
                            Ads: promptMap.branding_content_generation_ads || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_ads.prompt,
                            Post: promptMap.branding_content_generation_post || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_post.prompt,
                            Slide: promptMap.branding_content_generation_slide || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_slide.prompt,
                        });
                    } catch (error) {
                        console.error('Failed to load prompt templates', error);
                    }
                }
            } catch { /* individual catches above handle errors */ }

            if (cancelled) return;

            // Batch 3 – Instagram (2 fetches via Promise.all inside loadInstagramState)
            await loadInstagramState();
        };

        void init();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!isModalOpen) {
            return;
        }

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeCalendarPostModal();
            }
        };

        window.addEventListener('keydown', handleEscapeKey);
        return () => window.removeEventListener('keydown', handleEscapeKey);
    }, [closeCalendarPostModal, isModalOpen]);

    useEffect(() => {
        if (currentStep !== 2 && isModalOpen) {
            closeCalendarPostModal();
        }
    }, [closeCalendarPostModal, currentStep, isModalOpen]);

    // loadPromptTemplates — consolidated into mount init above

    useEffect(() => {
        if (currentStep !== 7) {
            return;
        }

        const loadCarouselDrafts = async () => {
            setIsLoadingCarouselDrafts(true);
            try {
                const response = await fetch('/api/branding/carousel-drafts');
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload?.error || 'Falha ao carregar drafts do carrossel.');
                }

                setSavedCarouselDrafts(Array.isArray(payload?.drafts) ? payload.drafts as CarouselDraftRecord[] : []);
            } catch (error) {
                console.error('Failed to load carousel drafts', error);
                setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao carregar drafts do carrossel.');
            } finally {
                setIsLoadingCarouselDrafts(false);
            }
        };

        loadCarouselDrafts();
    }, [currentStep]);

    const getCalendarScope = useCallback((
        scopeMode: BrandEditorialLineScopeMode = editorialSourceMode,
        manifestoId: string | null = editorialSourceMode === 'manifesto' ? selectedManifestoId : null,
    ) => ({
        scopeMode,
        manifestoId: scopeMode === 'manifesto' ? manifestoId : null,
        blankWorkspaceId: scopeMode === 'blank' ? blankWorkspaceId : null,
    }), [editorialSourceMode, selectedManifestoId, blankWorkspaceId]);

    const persistCalendarWorkspace = useCallback(async (
        postsToPersist: CalendarPost[],
        scopeOverride?: Partial<{ scopeMode: BrandEditorialLineScopeMode; manifestoId: string | null }>,
    ) => {
        const scope = getCalendarScope(
            scopeOverride?.scopeMode ?? editorialSourceMode,
            scopeOverride?.manifestoId ?? (scopeOverride?.scopeMode === 'manifesto' ? selectedManifestoId : undefined),
        );

        if (scope.scopeMode === 'manifesto' && !scope.manifestoId) {
            return;
        }

        const response = await fetch('/api/branding/calendar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                manifestoId: scope.manifestoId,
                scopeMode: scope.scopeMode,
                blankWorkspaceId: scope.blankWorkspaceId ?? null,
                posts: postsToPersist,
            }),
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload?.error || 'Falha ao salvar calendário.');
        }
    }, [editorialSourceMode, getCalendarScope, selectedManifestoId]);

    useEffect(() => {
        let ignore = false;

        const loadCalendarWorkspace = async () => {
            const scope = getCalendarScope();
            hasHydratedCalendarWorkspaceRef.current = false;

            if (scope.scopeMode === 'manifesto' && !scope.manifestoId) {
                setContentCalendar([]);
                setSelectedCalendarPostIds([]);
                setSelectedProductionPostIds([]);
                return;
            }

            isHydratingCalendarWorkspaceRef.current = true;
            setIsLoadingCalendarWorkspace(true);

            try {
                const params = new URLSearchParams({
                    scopeMode: scope.scopeMode,
                });

                if (scope.scopeMode === 'manifesto' && scope.manifestoId) {
                    params.set('manifestoId', scope.manifestoId);
                }

                if (scope.scopeMode === 'blank' && scope.blankWorkspaceId) {
                    params.set('blankWorkspaceId', scope.blankWorkspaceId);
                }

                const response = await fetch(`/api/branding/calendar?${params.toString()}`);
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload?.error || 'Falha ao carregar calendário salvo.');
                }

                if (ignore) {
                    return;
                }

                const posts = Array.isArray(payload?.posts) ? payload.posts as BrandCalendarPostRecord[] : [];
                setContentCalendar(posts.map(normalizeCalendarPost));
                setSelectedCalendarPostIds([]);
                setSelectedProductionPostIds([]);
                setCalendarError('');
            } catch (error) {
                if (ignore) {
                    return;
                }

                console.error('Failed to load BrandOS calendar workspace', error);
                setContentCalendar([]);
                setSelectedCalendarPostIds([]);
                setSelectedProductionPostIds([]);
                setCalendarError(error instanceof Error ? error.message : 'Erro ao carregar calendário salvo.');
            } finally {
                if (!ignore) {
                    isHydratingCalendarWorkspaceRef.current = false;
                    hasHydratedCalendarWorkspaceRef.current = true;
                    setIsLoadingCalendarWorkspace(false);
                }
            }
        };

        void loadCalendarWorkspace();

        return () => {
            ignore = true;
        };
    }, [getCalendarScope]);

    useEffect(() => {
        const validIds = new Set(contentCalendar.map((item) => item.id));

        setSelectedCalendarPostIds((current) => current.filter((id) => validIds.has(id)));
        setSelectedProductionPostIds((current) => current.filter((id) => validIds.has(id)));

        setEditingPost((current) => {
            if (!current?.id) {
                return current;
            }

            return validIds.has(current.id) ? current : null;
        });

        if (editingPost?.id && !validIds.has(editingPost.id) && isModalOpen) {
            closeCalendarPostModal();
        }
    }, [closeCalendarPostModal, contentCalendar, editingPost?.id, isModalOpen]);

    useEffect(() => {
        if (!hasHydratedCalendarWorkspaceRef.current || isHydratingCalendarWorkspaceRef.current) {
            return;
        }

        if (calendarPersistTimeoutRef.current) {
            clearTimeout(calendarPersistTimeoutRef.current);
        }

        calendarPersistTimeoutRef.current = setTimeout(() => {
            void persistCalendarWorkspace(contentCalendar).catch((error) => {
                console.error('Failed to persist BrandOS calendar workspace', error);
                setCalendarError(error instanceof Error ? error.message : 'Erro ao salvar calendário.');
            });
        }, 300);

        return () => {
            if (calendarPersistTimeoutRef.current) {
                clearTimeout(calendarPersistTimeoutRef.current);
                calendarPersistTimeoutRef.current = null;
            }
        };
    }, [contentCalendar, persistCalendarWorkspace]);

    useEffect(() => {
        setSelectedCalendarPostIds((current) => current.filter((id) => contentCalendar.some((item) => item.id === id)));
    }, [contentCalendar]);

    useEffect(() => {
        setSelectedProductionPostIds((current) => current.filter((id) => contentCalendar.some((item) => item.id === id)));
    }, [contentCalendar]);

    useEffect(() => {
        if (calendarViewMode !== 'daily') {
            return;
        }

        setCalendarFocusedDayKey(formatDateInput(calendarViewDate));
    }, [calendarViewDate, calendarViewMode]);

    // loadBrandManifestos — consolidated into mount init above

    useEffect(() => {
        let ignore = false;

        const loadEditorialWorkspace = async () => {
            if (editorialSourceMode === 'manifesto' && !selectedManifestoId) {
                setEditorialLines([]);
                setHasUnsavedEditorialChanges(false);
                return;
            }

            setIsLoadingEditorialWorkspace(true);
            try {
                const params = new URLSearchParams({
                    scopeMode: editorialSourceMode,
                });

                if (editorialSourceMode === 'manifesto' && selectedManifestoId) {
                    params.set('manifestoId', selectedManifestoId);
                }

                if (editorialSourceMode === 'blank') {
                    params.set('blankWorkspaceId', blankWorkspaceId);
                }

                const response = await fetch(`/api/branding/editorial-lines?${params.toString()}`);
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload?.error || 'Falha ao carregar linhas editoriais salvas.');
                }

                if (ignore) {
                    return;
                }

                const persistedLines = Array.isArray(payload?.editorialLines)
                    ? payload.editorialLines as BrandEditorialLineRecord[]
                    : [];

                setEditorialLines(persistedLines.map(mapEditorialRecordToItem));
                setHasUnsavedEditorialChanges(false);
                setEditorialError('');
            } catch (error) {
                if (ignore) {
                    return;
                }

                console.error('Failed to load editorial workspace', error);
                setEditorialLines([]);
                setHasUnsavedEditorialChanges(false);
                setEditorialError(error instanceof Error ? error.message : 'Erro ao carregar linhas editoriais salvas.');
            } finally {
                if (!ignore) {
                    setIsLoadingEditorialWorkspace(false);
                }
            }
        };

        void loadEditorialWorkspace();

        return () => {
            ignore = true;
        };
    }, [editorialSourceMode, selectedManifestoId]);

    // loadInstagramState — consolidated into mount init above

    // --- Actions ---

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const buildEditorialSeedContext = () => {
        const blocks = [
            editorialSeed.brandName && `Marca: ${editorialSeed.brandName}`,
            editorialSeed.positioning && `Posicionamento: ${editorialSeed.positioning}`,
            editorialSeed.audience && `Publico: ${editorialSeed.audience}`,
            editorialSeed.voice && `Tom de voz: ${editorialSeed.voice}`,
            editorialSeed.themes && `Temas editoriais desejados: ${editorialSeed.themes}`,
            editorialSeed.objective && `Objetivo de negocio/conteudo: ${editorialSeed.objective}`,
            editorialSeed.references && `Referencias e restricoes: ${editorialSeed.references}`,
        ].filter(Boolean);

        return blocks.join('\n');
    };

    const getVisualIdentityScope = useCallback((
        scopeMode: BrandEditorialLineScopeMode = editorialSourceMode,
        manifestoId: string | null = editorialSourceMode === 'manifesto' ? selectedManifestoId : null,
    ) => {
        if (scopeMode === 'manifesto' && !manifestoId) {
            return {
                scopeMode: 'blank' as const,
                manifestoId: null,
                blankWorkspaceId: blankWorkspaceId,
            };
        }

        return {
            scopeMode,
            manifestoId: scopeMode === 'manifesto' ? manifestoId : null,
            blankWorkspaceId: scopeMode === 'blank' ? blankWorkspaceId : null,
        };
    }, [editorialSourceMode, selectedManifestoId, blankWorkspaceId]);

    const buildBrandVisualIdentityContext = () => {
        const selectedStylePreset = getCarouselStylePresetDefinition(carouselStylePreset);
        const lines = [
            brandVisualIdentity.brandName ? `Nome da marca: ${brandVisualIdentity.brandName}` : '',
            brandVisualIdentity.brandHandle ? `Perfil principal: ${brandVisualIdentity.brandHandle}` : '',
            brandVisualIdentity.brandStudioLabel ? `Assinatura editorial da marca: ${brandVisualIdentity.brandStudioLabel}` : '',
            brandVisualIdentity.instagramUsername ? `Instagram conectado: @${brandVisualIdentity.instagramUsername}` : '',
            brandVisualIdentity.instagramPageName ? `Página conectada: ${brandVisualIdentity.instagramPageName}` : '',
            `Paleta principal: ${brandVisualIdentity.primaryColor}, ${brandVisualIdentity.secondaryColor}, ${brandVisualIdentity.accentColor}`,
            `Base visual: fundo ${brandVisualIdentity.backgroundColor}, superfície ${brandVisualIdentity.surfaceColor}, texto ${brandVisualIdentity.textColor}`,
            `Tipografia: títulos em ${brandVisualIdentity.titleFontFamily}, corpo em ${brandVisualIdentity.bodyFontFamily}`,
            `Preset desejado para o carrossel: ${selectedStylePreset.label}. ${selectedStylePreset.description}`,
            brandVisualIdentity.visualStyle ? `Estilo visual: ${brandVisualIdentity.visualStyle}` : '',
            brandVisualIdentity.imageryDirection ? `Direção de imagem: ${brandVisualIdentity.imageryDirection}` : '',
            brandVisualIdentity.layoutNotes ? `Regras de layout: ${brandVisualIdentity.layoutNotes}` : '',
        ].filter(Boolean);

        return lines.join('\n');
    };

    const applyBrandIdentityToEditor = (identity: BrandVisualIdentityRecord) => {
        setCarouselBrandProfile(mapIdentityToCarouselProfile(identity));
        setGeneratedSlides((current) => current.map((slide, index, slides) => clampSlideTypographyForTemplate({
            ...slide,
            ...createSlideDesignDefaultsFromIdentity(identity),
            eyebrow: index === 0 ? (slide.eyebrow || identity.brandName || 'Capa de Carrossel') : slide.eyebrow || `Slide ${index + 1}`,
            footerLabel: slide.footerLabel || (index === slides.length - 1 ? 'CTA' : 'Carrossel'),
            title: slide.title,
            body: slide.body,
            visualPrompt: slide.visualPrompt,
            imageUrl: slide.imageUrl,
            templateId: slide.templateId,
            id: slide.id,
        })));
    };

    const updateBrandVisualIdentityField = <K extends keyof BrandVisualIdentityRecord>(field: K, value: BrandVisualIdentityRecord[K]) => {
        setBrandVisualIdentity((current) => ({ ...current, [field]: value }));
        setHasUnsavedBrandIdentityChanges(true);
        setManifestoError('');
    };

    const loadBrandVisualIdentity = useCallback(async (
        scopeOverride?: Partial<{ scopeMode: BrandEditorialLineScopeMode; manifestoId: string | null }>,
    ) => {
        const scope = getVisualIdentityScope(
            scopeOverride?.scopeMode ?? editorialSourceMode,
            scopeOverride?.manifestoId ?? (scopeOverride?.scopeMode === 'manifesto' ? selectedManifestoId : undefined),
        );

        if (scope.scopeMode === 'manifesto' && !scope.manifestoId) {
            const fallbackIdentity = createDefaultBrandVisualIdentity(scope.scopeMode, scope.manifestoId);
            setBrandVisualIdentity(fallbackIdentity);
            setCarouselBrandProfile(mapIdentityToCarouselProfile(fallbackIdentity));
            setHasUnsavedBrandIdentityChanges(false);
            return;
        }

        setIsLoadingBrandIdentity(true);
        try {
            const params = new URLSearchParams({ scopeMode: scope.scopeMode });
            if (scope.scopeMode === 'manifesto' && scope.manifestoId) {
                params.set('manifestoId', scope.manifestoId);
            }
            if (scope.scopeMode === 'blank' && scope.blankWorkspaceId) {
                params.set('blankWorkspaceId', scope.blankWorkspaceId);
            }

            const response = await fetch(`/api/branding/visual-identity?${params.toString()}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao carregar a identidade visual da marca.');
            }

            const nextIdentity = (payload?.visualIdentity as BrandVisualIdentityRecord | null)
                || createDefaultBrandVisualIdentity(scope.scopeMode, scope.manifestoId ?? null);
            setBrandVisualIdentity(nextIdentity);
            setCarouselBrandProfile(mapIdentityToCarouselProfile(nextIdentity));
            setHasUnsavedBrandIdentityChanges(false);
        } catch (error) {
            console.error('Failed to load brand visual identity', error);
            const fallbackIdentity = createDefaultBrandVisualIdentity(scope.scopeMode, scope.manifestoId ?? null);
            setBrandVisualIdentity(fallbackIdentity);
            setCarouselBrandProfile(mapIdentityToCarouselProfile(fallbackIdentity));
            setHasUnsavedBrandIdentityChanges(false);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao carregar identidade visual da marca.');
        } finally {
            setIsLoadingBrandIdentity(false);
        }
    }, [editorialSourceMode, getVisualIdentityScope, selectedManifestoId]);

    useEffect(() => {
        void loadBrandVisualIdentity();
    }, [loadBrandVisualIdentity]);

    const persistBrandVisualIdentity = async (
        scopeOverride?: Partial<{ scopeMode: BrandEditorialLineScopeMode; manifestoId: string | null }>,
        options?: Partial<{ successMessage: string; source: 'manual' | 'instagram_seed'; silentNotice: boolean }>,
    ) => {
        const scope = getVisualIdentityScope(
            scopeOverride?.scopeMode ?? editorialSourceMode,
            scopeOverride?.manifestoId ?? (scopeOverride?.scopeMode === 'manifesto' ? selectedManifestoId : undefined),
        );

        if (scope.scopeMode === 'manifesto' && !scope.manifestoId) {
            throw new Error('Salve o manifesto antes de persistir a identidade visual desta base.');
        }

        setIsSavingBrandIdentity(true);
        try {
            const response = await fetch('/api/branding/visual-identity', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...brandVisualIdentity,
                    manifestoId: scope.manifestoId,
                    scopeMode: scope.scopeMode,
                    blankWorkspaceId: scope.blankWorkspaceId ?? null,
                    source: options?.source || brandVisualIdentity.source,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao salvar a identidade visual da marca.');
            }

            const nextIdentity = payload?.visualIdentity as BrandVisualIdentityRecord;
            setBrandVisualIdentity(nextIdentity);
            setCarouselBrandProfile(mapIdentityToCarouselProfile(nextIdentity));
            setHasUnsavedBrandIdentityChanges(false);
            if (!options?.silentNotice) {
                setManifestoNotice(options?.successMessage || 'Identidade visual da marca salva para futuras criações.');
            }
            return nextIdentity;
        } finally {
            setIsSavingBrandIdentity(false);
        }
    };

    const loadInstagramState = async () => {
        try {
            const [statusResponse, schedulesResponse] = await Promise.all([
                fetch('/api/auth/instagram/status'),
                fetch('/api/instagram/schedules'),
            ]);

            const statusPayload = await statusResponse.json();
            const schedulesPayload = await schedulesResponse.json();

            if (statusResponse.ok) {
                setIsInstagramConnected(Boolean(statusPayload?.connected));
                const username = statusPayload?.account?.igUsername || '';
                const pageName = statusPayload?.account?.pageName || '';
                setInstagramAccountLabel(username ? `@${username}` : pageName);
                if (statusPayload?.connected) {
                    setBrandVisualIdentity((current) => {
                        const nextHandle = current.brandHandle.trim() && current.brandHandle !== '@entrelacos.ai'
                            ? current.brandHandle
                            : username ? `@${username}` : current.brandHandle;
                        const nextName = current.brandName.trim() && current.brandName !== 'Entrelaç[OS]'
                            ? current.brandName
                            : pageName || current.brandName;
                        return {
                            ...current,
                            brandName: nextName,
                            brandHandle: nextHandle,
                            instagramPageName: pageName,
                            instagramUsername: username,
                        };
                    });
                    setCarouselBrandProfile((current) => ({
                        ...current,
                        brandName: current.brandName !== 'Entrelaç[OS]' ? current.brandName : (pageName || current.brandName),
                        brandHandle: current.brandHandle !== '@entrelacos.ai' ? current.brandHandle : (username ? `@${username}` : current.brandHandle),
                    }));
                }
            }

            if (schedulesResponse.ok && Array.isArray(schedulesPayload?.jobs)) {
                const jobs = schedulesPayload.jobs as Array<{ localPostId: string; status: 'queued' | 'published' | 'error'; scheduledAt: string; lastError?: string | null }>;
                if (jobs.length > 0) {
                    setContentCalendar((current) => current.map((item) => {
                        const job = jobs.find((entry) => entry.localPostId === item.id);
                        if (!job) return item;

                        const nextStatus: CalendarPostStatus =
                            job.status === 'published' ? 'Published'
                            : job.status === 'queued' ? 'Scheduled'
                            : item.status;
                        const nextInstagramStatus: InstagramSyncStatus =
                            job.status === 'published' ? 'Published'
                            : job.status === 'queued' ? 'Scheduled'
                            : 'Error';

                        return {
                            ...item,
                            status: nextStatus,
                            scheduledAt: job.scheduledAt || item.scheduledAt,
                            instagramStatus: nextInstagramStatus,
                        };
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to load Instagram state', error);
        }
    };

    const buildManifestoBrief = (): BrandManifestoBrief => ({
        brandName: editorialSeed.brandName,
        positioning: editorialSeed.positioning,
        audience: editorialSeed.audience,
        voice: editorialSeed.voice,
        themes: editorialSeed.themes,
        objective: editorialSeed.objective,
        references: editorialSeed.references,
    });

    const getManifestoNameFallback = () =>
        manifestoName.trim()
        || editorialSeed.brandName.trim()
        || manifestoFile?.name.replace(/\.[^.]+$/, '')
        || 'Manifesto da Marca';

    const getEditorialSourceText = () =>
        editorialSourceMode === 'manifesto' ? manifestoContent.trim() : buildEditorialSeedContext().trim();

    const getEditorialSourceLabel = () =>
        editorialSourceMode === 'manifesto' ? 'Manifesto' : 'Briefing de marca';

    const getEditorialPrompt = () =>
        editorialSourceMode === 'manifesto' ? manifestoEditorialPrompt : blankEditorialPrompt;

    const getFormatPromptTemplate = (format: string) => {
        const promptId = resolveBrandingFormatPromptId(format);
        if (promptId === 'branding_format_prompt_carousel') return formatPromptTemplates.Carousel || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_carousel.prompt;
        if (promptId === 'branding_format_prompt_ads') return formatPromptTemplates.Ads || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_ads.prompt;
        if (promptId === 'branding_format_prompt_post') return formatPromptTemplates.Post || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_post.prompt;
        if (promptId === 'branding_format_prompt_slide') return formatPromptTemplates.Slide || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_slide.prompt;
        return formatPromptTemplates.default || DEFAULT_AI_PROMPT_TEMPLATES.branding_format_prompt_default.prompt;
    };

    const getContentGenerationPromptTemplate = (format: string) => {
        const promptId = resolveBrandingContentGenerationPromptId(format);
        if (promptId === 'branding_content_generation_carousel') return contentGenerationPromptTemplates.Carousel || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_carousel.prompt;
        if (promptId === 'branding_content_generation_ads') return contentGenerationPromptTemplates.Ads || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_ads.prompt;
        if (promptId === 'branding_content_generation_post') return contentGenerationPromptTemplates.Post || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_post.prompt;
        return contentGenerationPromptTemplates.Slide || DEFAULT_AI_PROMPT_TEMPLATES.branding_content_generation_slide.prompt;
    };

    const selectedEditorialLines = editorialLines.filter(line => line.selected && line.content.trim());
    const availableCalendarFormats = Array.from(new Set(contentCalendar.map((item) => item.format))).sort((a, b) => a.localeCompare(b));
    const availableCalendarEditorialLines = Array.from(new Set(contentCalendar.map((item) => item.editorialLine).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const filteredCalendarItems = contentCalendar.filter((item) => {
        if (calendarFormatFilter !== 'all' && item.format !== calendarFormatFilter) return false;
        if (calendarStatusFilter !== 'all' && item.status !== calendarStatusFilter) return false;
        if (calendarEditorialLineFilter !== 'all' && item.editorialLine !== calendarEditorialLineFilter) return false;
        if (calendarSearchQuery.trim()) {
            const search = calendarSearchQuery.trim().toLowerCase();
            const haystack = [
                item.theme,
                item.description,
                item.editorialLine,
                item.format,
                item.day,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });
    const calendarViewStart = calendarViewMode === 'monthly'
        ? startOfWeek(startOfMonth(calendarViewDate))
        : calendarViewMode === 'weekly'
            ? startOfWeek(calendarViewDate)
            : new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), calendarViewDate.getDate());
    const calendarViewEnd = calendarViewMode === 'monthly'
        ? endOfWeek(endOfMonth(calendarViewDate))
        : calendarViewMode === 'weekly'
            ? addDays(calendarViewStart, 6)
            : calendarViewStart;
    const calendarDays = Array.from(
        { length: calendarViewMode === 'monthly' ? 42 : calendarViewMode === 'weekly' ? 7 : 1 },
        (_, index) => addDays(calendarViewStart, index),
    );

    const getCalendarItemsForDate = (date: Date) => {
        const dayKey = formatDateInput(date);
        return filteredCalendarItems.filter((item) => {
            return getCalendarDayKey(item.day) === dayKey;
        });
    };
    const focusedCalendarItems = filteredCalendarItems
        .filter((item) => getCalendarDayKey(item.day) === calendarFocusedDayKey)
        .sort((a, b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
    const agendaPreviewItem = focusedCalendarItems.find((item) => item.id === agendaPreviewPostId) || focusedCalendarItems[0] || null;
    const selectedCalendarItems = filteredCalendarItems.filter((item) => selectedCalendarPostIds.includes(item.id));
    const selectedPlannedItems = contentCalendar.filter((item) => selectedProductionPostIds.includes(item.id));
    const approvedCalendarItems = contentCalendar.filter((item) => item.approvalStatus === 'Approved');
    const pendingCalendarItems = contentCalendar.filter((item) => item.approvalStatus !== 'Approved');
    const activeProductionItems = selectedPlannedItems.length > 0
        ? selectedPlannedItems
        : approvedCalendarItems.length > 0
            ? approvedCalendarItems
            : contentCalendar;
    const approvedCalendarCount = contentCalendar.filter((item) => item.approvalStatus === 'Approved').length;

    useEffect(() => {
        if (!agendaPreviewPostId) {
            return;
        }

        if (!focusedCalendarItems.some((item) => item.id === agendaPreviewPostId)) {
            setAgendaPreviewPostId(focusedCalendarItems[0]?.id || null);
        }
    }, [agendaPreviewPostId, focusedCalendarItems]);
    const hasContentStudioInput = contentStudioSourceMode === 'planned'
        ? activeProductionItems.length > 0
        : contentStudioSourceMode === 'title'
            ? Boolean(contentStudioTitle.trim() || contextText.trim())
            : Boolean(contextText.trim());

    const getContentStudioContext = () => {
        const brandGrounding = [
            manifestoContent.trim()
                ? `Manifesto da marca:\n${manifestoContent.trim().slice(0, 5000)}`
                : '',
            selectedEditorialLines.length > 0
                ? `Linhas editoriais ativas:\n${selectedEditorialLines.map((line, index) => `${index + 1}. ${line.content}`).join('\n')}`
                : '',
            buildBrandVisualIdentityContext().trim()
                ? `Identidade visual da marca:\n${buildBrandVisualIdentityContext()}`
                : '',
        ].filter(Boolean);

        const sourceContext = contentStudioSourceMode === 'planned'
            ? [
                'Origem de criação: calendário editorial aprovado',
                buildProductionContextFromPosts(activeProductionItems),
                contextText.trim() ? `Direção adicional do usuário:\n${contextText.trim()}` : '',
            ].filter(Boolean).join('\n\n')
            : contentStudioSourceMode === 'title'
                ? [
                    'Origem de criação: título ou ideia inicial',
                    contentStudioTitle.trim() ? `Título base: ${contentStudioTitle.trim()}` : '',
                    contextText.trim() ? `Direção adicional:\n${contextText.trim()}` : '',
                ].filter(Boolean).join('\n\n')
                : [
                    `Origem de criação: ingestão de conhecimento (${activeSource})`,
                    contextText.trim(),
                ].filter(Boolean).join('\n\n');

        return [...brandGrounding, sourceContext].filter(Boolean).join('\n\n---\n\n').trim();
    };

    const openExistingPostModal = (post: CalendarPost) => {
        setCalendarFocusedDayKey(getCalendarDayKey(post.day));
        setCalendarCardGenerationMode('manual');
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const toggleCalendarPostSelection = (postId: string) => {
        setSelectedCalendarPostIds((current) => (
            current.includes(postId)
                ? current.filter((id) => id !== postId)
                : [...current, postId]
        ));
    };

    const clearCalendarSelection = () => {
        setSelectedCalendarPostIds([]);
    };

    const moveCalendarPostToDate = (postId: string, targetDate: Date) => {
        const nextDay = formatDayLabel(targetDate);
        const nextDate = formatDateInput(targetDate);

        setContentCalendar((current) => current.map((item) => (
            item.id === postId
                ? {
                    ...item,
                    day: nextDay,
                    scheduledAt: item.scheduledAt
                        ? buildScheduledAt(nextDate, extractTimeFromScheduledAt(item.scheduledAt))
                        : buildScheduledAt(nextDate, '09:00'),
                }
                : item
        )));
        setCalendarFocusedDayKey(nextDate);
        setCalendarViewDate(calendarViewMode === 'monthly' ? startOfMonth(targetDate) : targetDate);
        setCalendarNotice('Card movido para a nova data.');
    };

    const handleGenerateCalendarCardSuggestion = async (input?: Partial<CalendarCardSuggestionInput>) => {
        const draft = editingPost;
        if (!draft && !input) {
            return;
        }

        if (!textAiConfigured) {
            setCalendarError('A IA textual não está configurada. Ative um provider de texto no AI Control Center para gerar sugestões para o card.');
            return;
        }

        setIsGeneratingCalendarCardSuggestion(true);
        setCalendarError('');
        try {
            const suggestion = await generateCalendarCardSuggestion({
                manifestoText: manifestoContent,
                editorialLine: input?.editorialLine ?? draft?.editorialLine,
                format: input?.format ?? draft?.format,
                dateLabel: input?.dateLabel ?? draft?.day,
                customDirection: input?.customDirection ?? draft?.description,
            });

            setEditingPost((current) => current ? {
                ...current,
                format: suggestion.format || current.format,
                theme: suggestion.theme || current.theme,
                description: suggestion.description || current.description,
            } : current);
            setCalendarNotice('Sugestão de IA aplicada ao card.');
        } catch (error) {
            console.error('Error generating calendar card suggestion', error);
            setCalendarError(error instanceof Error ? error.message : 'Erro ao gerar sugestão para o card.');
        } finally {
            setIsGeneratingCalendarCardSuggestion(false);
        }
    };

    const toggleProductionPostSelection = (postId: string) => {
        setSelectedProductionPostIds((current) => (
            current.includes(postId)
                ? current.filter((id) => id !== postId)
                : [...current, postId]
        ));
    };

    const buildProductionContextFromPosts = (posts: CalendarPost[]) => posts.map((post, index) => [
        `Card ${index + 1}`,
        `Data: ${post.day}`,
        `Formato: ${post.format}`,
        `Linha editorial: ${post.editorialLine}`,
        `Tema: ${post.theme}`,
        `Descrição: ${post.description}`,
        post.scheduledAt ? `Agendamento: ${extractDateFromScheduledAt(post.scheduledAt)} ${extractTimeFromScheduledAt(post.scheduledAt)}` : '',
    ].filter(Boolean).join('\n')).join('\n\n---\n\n');

    const openApprovedProductionQueue = () => {
        if (contentCalendar.length === 0) {
            handleNext();
            return;
        }

        if (isModalOpen) {
            closeCalendarPostModal();
        }

        if (selectedProductionPostIds.length === 0) {
            setSelectedProductionPostIds((approvedCalendarItems.length > 0 ? approvedCalendarItems : contentCalendar).map((item) => item.id));
        }
        setContentStudioSourceMode('planned');
        setCurrentStep(3);
    };

    const handleApprovePosts = (postIds: string[], mode: 'approve' | 'production' = 'approve') => {
        const ids = Array.from(new Set(postIds)).filter(Boolean);
        if (ids.length === 0) {
            return;
        }

        setContentCalendar((current) => current.map((item) => (
            ids.includes(item.id)
                ? {
                    ...item,
                    approvalStatus: 'Approved',
                }
                : item
        )));
        setSelectedProductionPostIds((current) => Array.from(new Set([...current, ...ids])));
        setCalendarNotice(
            mode === 'production'
                ? `${ids.length} card(s) aprovados para criação de conteúdo.`
                : `${ids.length} card(s) aprovados no calendário.`,
        );
        setSelectedCalendarPostIds((current) => current.filter((id) => !ids.includes(id)));
    };

    const getEditorialScope = (
        scopeMode: BrandEditorialLineScopeMode = editorialSourceMode,
        manifestoId: string | null = editorialSourceMode === 'manifesto' ? selectedManifestoId : null,
    ) => ({
        scopeMode,
        manifestoId: scopeMode === 'manifesto' ? manifestoId : null,
        blankWorkspaceId: scopeMode === 'blank' ? blankWorkspaceId : null,
    });

    const persistEditorialWorkspace = async (
        linesToPersist: EditorialLineItem[] = editorialLines,
        scopeOverride?: Partial<{ scopeMode: BrandEditorialLineScopeMode; manifestoId: string | null }>,
        options?: Partial<{ successMessage: string; silentNotice: boolean }>,
    ) => {
        const scope = getEditorialScope(
            scopeOverride?.scopeMode ?? editorialSourceMode,
            scopeOverride?.manifestoId ?? (scopeOverride?.scopeMode === 'manifesto' ? selectedManifestoId : undefined),
        );

        if (scope.scopeMode === 'manifesto' && !scope.manifestoId) {
            throw new Error('Salve o manifesto antes de persistir as linhas editoriais desta base.');
        }

        setIsSavingEditorialWorkspace(true);

        try {
            const response = await fetch('/api/branding/editorial-lines', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    manifestoId: scope.manifestoId,
                    scopeMode: scope.scopeMode,
                    blankWorkspaceId: scope.blankWorkspaceId ?? null,
                    lines: linesToPersist.map((line) => ({
                        id: line.id,
                        content: line.content,
                        selected: line.selected,
                        source: line.source,
                    })),
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao salvar linhas editoriais.');
            }

            const persistedLines = Array.isArray(payload?.editorialLines)
                ? payload.editorialLines as BrandEditorialLineRecord[]
                : [];

            setEditorialLines(persistedLines.map(mapEditorialRecordToItem));
            setHasUnsavedEditorialChanges(false);
            setEditorialError('');

            if (!options?.silentNotice) {
                setEditorialNotice(
                    options?.successMessage
                    || `${persistedLines.length} linhas editoriais salvas para futuras gerações.`,
                );
            }

            return persistedLines;
        } finally {
            setIsSavingEditorialWorkspace(false);
        }
    };

    const syncManifestoSelection = (manifesto: BrandManifestoRecord) => {
        setSelectedManifestoId(manifesto.id);
        setManifestoName(manifesto.name);
        setManifestoContent(manifesto.content);
        setManifestoDraftSourceType(manifesto.sourceType);
        setEditorialSourceMode('manifesto');
        setEditorialLines([]);
        setHasUnsavedEditorialChanges(false);
        setManifestoError('');
        setManifestoNotice(`Manifesto "${manifesto.name}" carregado como base da marca.`);
    };

    const persistManifesto = async (
        sourceType: BrandManifestoSourceType,
        overrides?: Partial<{ name: string; content: string; sourceFileName: string | null }>,
    ) => {
        const payload = {
            name: overrides?.name?.trim() || getManifestoNameFallback(),
            content: overrides?.content ?? manifestoContent,
            sourceType,
            sourceFileName: sourceType === 'uploaded_file'
                ? (overrides?.sourceFileName ?? manifestoFile?.name ?? null)
                : null,
        };

        const endpoint = selectedManifestoId
            ? `/api/branding/manifestos/${selectedManifestoId}`
            : '/api/branding/manifestos';
        const method = selectedManifestoId ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const nextManifesto = await response.json();

        if (!response.ok) {
            throw new Error(nextManifesto?.error || 'Falha ao salvar manifesto.');
        }

        setSavedManifestos((current) => {
            const filtered = current.filter((item) => item.id !== nextManifesto.id);
            return [nextManifesto, ...filtered];
        });

        syncManifestoSelection(nextManifesto);
        setManifestoNotice(selectedManifestoId ? 'Manifesto atualizado e salvo para futuras gerações.' : 'Manifesto salvo para futuras gerações.');
        return nextManifesto as BrandManifestoRecord;
    };

    const updateEditorialLine = (id: string, value: string) => {
        setEditorialLines(prev => prev.map((line) => (line.id === id ? { ...line, content: value } : line)));
        setHasUnsavedEditorialChanges(true);
        setEditorialError('');
    };

    const addEditorialLine = (initialValue: string = '') => {
        setEditorialLines(prev => [...prev, createEditorialLine(initialValue, 'manual')]);
        setHasUnsavedEditorialChanges(true);
        setEditorialNotice('');
    };

    const removeEditorialLine = (id: string) => {
        setEditorialLines(prev => prev.filter((line) => line.id !== id));
        setHasUnsavedEditorialChanges(true);
    };

    const toggleEditorialLine = (id: string) => {
        setEditorialLines(prev => prev.map((line) => (
            line.id === id ? { ...line, selected: !line.selected } : line
        )));
        setHasUnsavedEditorialChanges(true);
    };

    const updateCalendarRange = (field: keyof ContentCalendarDateRange, value: string) => {
        setCalendarRange(prev => ({ ...prev, [field]: value }));
        setCalendarError('');
    };

    const getDefaultCarouselDraftName = () => {
        const firstSlideTitle = generatedSlides[0]?.title?.trim();
        if (carouselDraftName.trim()) return carouselDraftName.trim();
        if (contentStudioTitle.trim()) return contentStudioTitle.trim();
        if (manifestoName.trim()) return `${manifestoName.trim()} Carousel`;
        if (firstSlideTitle) return firstSlideTitle;
        return `Carousel ${new Date().toLocaleDateString('pt-BR')}`;
    };

    const syncCarouselDraftCollection = (draft: CarouselDraftRecord) => {
        setSavedCarouselDrafts((current) => {
            const next = current.filter((item) => item.id !== draft.id);
            return [draft, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
    };

    const hydrateCarouselDraft = async (draft: CarouselDraftRecord) => {
        setSelectedCarouselDraftId(draft.id);
        setCarouselDraftName(draft.name);

        if (draft.manifestoId) {
            try {
                const response = await fetch(`/api/branding/manifestos/${draft.manifestoId}`);
                if (response.ok) {
                    const freshManifesto: BrandManifestoRecord = await response.json();
                    syncManifestoSelection(freshManifesto);
                    setSavedManifestos((current) => {
                        const rest = current.filter((m) => m.id !== freshManifesto.id);
                        return [freshManifesto, ...rest].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
                    });
                } else {
                    setSelectedManifestoId(draft.manifestoId);
                    setManifestoName('');
                    setManifestoContent('');
                    setManifestoDraftSourceType('manual');
                    setEditorialSourceMode('manifesto');
                    setEditorialLines([]);
                    setHasUnsavedEditorialChanges(false);
                    setManifestoNotice(`Draft "${draft.name}" carregado, mas o manifesto vinculado não está mais disponível.`);
                }
            } catch {
                setSelectedManifestoId(draft.manifestoId);
                setManifestoName('');
                setManifestoContent('');
                setManifestoDraftSourceType('manual');
                setEditorialSourceMode('manifesto');
                setEditorialLines([]);
                setHasUnsavedEditorialChanges(false);
                setManifestoNotice(`Draft "${draft.name}" carregado, mas o manifesto vinculado não pôde ser carregado.`);
            }
        } else {
            setSelectedManifestoId(null);
            setManifestoName('');
            setManifestoContent('');
            setManifestoDraftSourceType('manual');
            setEditorialSourceMode('blank');
            setEditorialLines([]);
            setHasUnsavedEditorialChanges(false);
        }

        setSelectedAsset(draft.selectedAsset || 'Carousel');
        setCarouselStylePreset(normalizeCarouselStylePreset(draft.carouselStylePreset));
        setPackagingEditorPanel(draft.packagingEditorPanel || 'content');
        setCarouselBrandProfile(draft.brandProfile);
        setGeneratedImages({});
        setGeneratedSlides(
            Array.isArray(draft.slides) && draft.slides.length > 0
                ? draft.slides.map((slide) => clampSlideTypographyForTemplate(normalizeSlideRecord(slide)))
                : [buildEditorSlide([], { templateId: PREMIUM_BRANDING_ROTATION[0] })],
        );
        setSelectedSlideIndex(Math.max(0, Math.min(draft.selectedSlideIndex || 0, Math.max(0, draft.slides.length - 1))));
        setCarouselDraftNotice(`Draft "${draft.name}" carregado no editor.`);
        setCarouselDraftError('');
    };

    const buildCarouselDraftPayload = () => ({
        name: getDefaultCarouselDraftName(),
        manifestoId: selectedManifestoId,
        selectedAsset,
        carouselStylePreset,
        selectedSlideIndex,
        packagingEditorPanel,
        brandProfile: carouselBrandProfile,
        slides: generatedSlides.map((slide) => ({
            ...slide,
            imageUrl: resolveSlideImage(slide),
        })),
    });

    const loadCarouselDraft = async (draftId: string) => {
        try {
            const response = await fetch(`/api/branding/carousel-drafts/${draftId}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao carregar draft.');
            }

            await hydrateCarouselDraft(payload.draft as CarouselDraftRecord);
        } catch (error) {
            console.error('Failed to load carousel draft', error);
            setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao carregar draft.');
        }
    };

    const saveCarouselDraft = async () => {
        if (generatedSlides.length === 0) {
            setCarouselDraftError('Gere ou adicione pelo menos um slide antes de salvar o draft.');
            return;
        }

        setIsSavingCarouselDraft(true);
        setCarouselDraftError('');
        setCarouselDraftNotice('');

        try {
            const draftPayload = buildCarouselDraftPayload();
            const response = await fetch(
                selectedCarouselDraftId
                    ? `/api/branding/carousel-drafts/${selectedCarouselDraftId}`
                    : '/api/branding/carousel-drafts',
                {
                    method: selectedCarouselDraftId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(draftPayload),
                },
            );

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao salvar draft.');
            }

            const savedDraft = payload as CarouselDraftRecord;
            syncCarouselDraftCollection(savedDraft);
            setSelectedCarouselDraftId(savedDraft.id);
            setCarouselDraftName(savedDraft.name);
            setCarouselDraftNotice(`Draft "${savedDraft.name}" salvo com sucesso.`);
        } catch (error) {
            console.error('Failed to save carousel draft', error);
            setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao salvar draft.');
        } finally {
            setIsSavingCarouselDraft(false);
        }
    };

    const deleteCarouselDraftRecord = async (draftId: string) => {
        try {
            const response = await fetch(`/api/branding/carousel-drafts/${draftId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error((payload as { error?: string })?.error || 'Falha ao excluir draft.');
            }

            const removedDraft = savedCarouselDrafts.find((draft) => draft.id === draftId);
            setSavedCarouselDrafts((current) => current.filter((draft) => draft.id !== draftId));
            if (selectedCarouselDraftId === draftId) {
                setSelectedCarouselDraftId(null);
                setCarouselDraftName('');
            }
            setCarouselDraftNotice(`Draft "${removedDraft?.name || 'sem nome'}" excluído.`);
            setCarouselDraftError('');
        } catch (error) {
            console.error('Failed to delete carousel draft', error);
            setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao excluir draft.');
        }
    };

    const updateSlide = (id: number, field: keyof SlideData, value: string) => {
        setGeneratedSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const buildEditorSlide = (slides: SlideData[], overrides?: Partial<SlideData>): SlideData => clampSlideTypographyForTemplate({
        id: overrides?.id ?? ((slides.reduce((max, slide) => Math.max(max, slide.id), 0)) + 1),
        title: overrides?.title ?? 'Novo slide',
        body: overrides?.body ?? 'Descreva a ideia principal deste slide.',
        visualPrompt: overrides?.visualPrompt ?? 'Editorial premium background, sophisticated composition, brand-aligned visuals',
        imageUrl: overrides?.imageUrl ?? '',
        templateId: overrides?.templateId ?? PREMIUM_BRANDING_ROTATION[0],
        ...createSlideDesignDefaultsFromIdentity(brandVisualIdentity),
        ...Object.fromEntries(Object.entries(buildStylePresetPatch(carouselStylePreset)).filter(([, value]) => value !== undefined)),
        ...overrides,
    });

    const updateSlideDesign = (id: number, patch: Partial<SlideData>) => {
        setGeneratedSlides((current) => current.map((slide) => (
            slide.id === id ? clampSlideTypographyForTemplate({ ...slide, ...patch }) : slide
        )));
    };

    const insertSlideAfter = (index: number) => {
        setGeneratedSlides((current) => {
            const nextSlide = buildEditorSlide(current, {
                templateId: applyDefaultTemplate(index + 1, selectedAsset),
            });
            const next = [...current];
            next.splice(index + 1, 0, nextSlide);
            return next;
        });
        setSelectedSlideIndex(index + 1);
    };

    const duplicateSlideAt = (index: number) => {
        setGeneratedSlides((current) => {
            const baseSlide = current[index];
            if (!baseSlide) return current;

            const duplicated = buildEditorSlide(current, {
                ...baseSlide,
                id: undefined,
                title: `${baseSlide.title} (cópia)`,
            });
            const next = [...current];
            next.splice(index + 1, 0, duplicated);
            return next;
        });
        setSelectedSlideIndex(index + 1);
    };

    const removeSlideAt = (index: number) => {
        setGeneratedSlides((current) => {
            if (current.length <= 1) {
                return [buildEditorSlide([], { templateId: applyDefaultTemplate(0, selectedAsset) })];
            }

            return current.filter((_, slideIndex) => slideIndex !== index);
        });
        setSelectedSlideIndex((current) => {
            if (generatedSlides.length <= 1) return 0;
            if (current > index) return current - 1;
            return Math.max(0, Math.min(current, generatedSlides.length - 2));
        });
    };

    const moveSlideAt = (index: number, direction: 'left' | 'right') => {
        setGeneratedSlides((current) => {
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= current.length) return current;

            const next = [...current];
            const [moved] = next.splice(index, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setSelectedSlideIndex((current) => {
            if (current !== index) return current;
            return direction === 'left' ? Math.max(0, index - 1) : Math.min(generatedSlides.length - 1, index + 1);
        });
    };

    const moveSlideToIndex = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        setGeneratedSlides((current) => {
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) {
                return current;
            }

            const next = [...current];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });

        setSelectedSlideIndex((current) => {
            if (current === fromIndex) return toIndex;
            if (fromIndex < current && toIndex >= current) return current - 1;
            if (fromIndex > current && toIndex <= current) return current + 1;
            return current;
        });
    };

    const handleSlideImageUpload = async (slideId: number, file: File) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

        updateSlideDesign(slideId, { imageUrl: dataUrl });
    };

    const updateEditorialSeed = (field: keyof EditorialSeed, value: string) => {
        setEditorialSeed(prev => ({ ...prev, [field]: value }));
    };

    const applyDefaultTemplate = (index: number, assetType: string): BrandingTemplateId => {
        const preset = getCarouselStylePresetDefinition(carouselStylePreset);
        if (preset.templateId) {
            if (assetType.toLowerCase().includes('carousel') && index === 0 && preset.id === 'brand-editorial') {
                return PREMIUM_BRANDING_COVER_TEMPLATE_ID;
            }
            return preset.templateId;
        }

        if (assetType.toLowerCase().includes('carousel') && index === 0) {
            return PREMIUM_BRANDING_COVER_TEMPLATE_ID;
        }

        const rotation: BrandingTemplateId[] = [...PREMIUM_BRANDING_ROTATION];
        return rotation[index % rotation.length];
    };

    const resolveSlideImage = (slide: SlideData) => slide.imageUrl || generatedImages[slide.id] || '';

    const resolveSlideImagePlacement = (slide: SlideData) => {
        const templateId = normalizeBrandingTemplateForEditor(slide.templateId);
        return HALF_CAPABLE_BRANDING_TEMPLATES.has(templateId) ? slide.imagePlacement : 'background';
    };

    const buildStylePresetPatch = (presetId: CarouselStylePresetId): Partial<SlideData> => {
        const preset = getCarouselStylePresetDefinition(presetId);
        return {
            templateId: preset.templateId,
            accentColor: preset.accentColor,
            backgroundColor: preset.backgroundColor,
            titleFontFamily: preset.titleFontFamily,
            bodyFontFamily: preset.bodyFontFamily,
        };
    };

    const applyCarouselStylePresetToPack = (presetId: CarouselStylePresetId) => {
        setCarouselStylePreset(presetId);
        const preset = getCarouselStylePresetDefinition(presetId);
        const patch = buildStylePresetPatch(presetId);

        if (presetId !== 'brand-editorial') {
            setGeneratedSlides((current) => current.map((slide) => clampSlideTypographyForTemplate({
                ...slide,
                ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
                templateId: preset.templateId || slide.templateId,
            } as SlideData)));
        }

        if (preset.accentColor || preset.backgroundColor || preset.titleFontFamily || preset.bodyFontFamily) {
            setBrandVisualIdentity((current) => ({
                ...current,
                accentColor: preset.accentColor || current.accentColor,
                primaryColor: preset.accentColor || current.primaryColor,
                backgroundColor: preset.backgroundColor || current.backgroundColor,
                titleFontFamily: preset.titleFontFamily || current.titleFontFamily,
                bodyFontFamily: preset.bodyFontFamily || current.bodyFontFamily,
                updatedAt: new Date().toISOString(),
            }));
            setHasUnsavedBrandIdentityChanges(true);
        }

        setManifestoNotice(`Preset visual "${preset.label}" aplicado ao pack.`);
    };

    const getPreviewAspectClass = (templateId: BrandingTemplateId) => {
        if (templateId === 'story' || templateId === 'reel') {
            return 'aspect-[9/16]';
        }

        if (isPortraitBrandingTemplate(templateId)) {
            return 'aspect-[4/5]';
        }

        return 'aspect-square';
    };

    const triggerDownload = (dataUrl: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = filename;
        anchor.click();
    };

    const renderSlidesToPng = async (slides: SlideData[]) => {
        const normalizedSlides = slides.map((slide) => clampSlideTypographyForTemplate(slide));

        // Slides com imagem gerada pela OpenAI já são pacote completo — exportar direto
        const openAIGenerated = normalizedSlides
            .filter(slide => generatedImages[slide.id] && !slide.imageUrl)
            .map(slide => ({
                id: slide.id,
                filename: `slide-${String(slide.id).padStart(2, '0')}-${(slide.title || 'slide').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`,
                dataUrl: generatedImages[slide.id],
            }));

        const slidesNeedingRender = normalizedSlides.filter(slide => !generatedImages[slide.id] || slide.imageUrl);

        if (slidesNeedingRender.length === 0) {
            return { images: openAIGenerated };
        }

        const response = await fetch('/api/render/branding/png-pack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slides: slidesNeedingRender.map(slide => ({
                    id: slide.id,
                    title: slide.title,
                    body: slide.body,
                    eyebrow: slide.eyebrow,
                    footerLabel: slide.footerLabel,
                    templateId: slide.templateId,
                    imageUrl: resolveSlideImage(slide),
                    brandName: carouselBrandProfile.brandName,
                    brandHandle: carouselBrandProfile.brandHandle,
                    brandStudioLabel: carouselBrandProfile.studioLabel,
                    profileImageUrl: carouselBrandProfile.profileImageUrl,
                    accentColor: slide.accentColor || '#9900ff',
                    secondaryColor: slide.secondaryColor || brandVisualIdentity.secondaryColor,
                    surfaceColor: slide.surfaceColor || brandVisualIdentity.surfaceColor,
                    textColor: slide.textColor || brandVisualIdentity.textColor,
                    backgroundColor: slide.backgroundColor || '#141414',
                    titleFontSize: slide.titleFontSize,
                    bodyFontSize: slide.bodyFontSize,
                    textAlign: slide.textAlign,
                    titleFontFamily: slide.titleFontFamily,
                    bodyFontFamily: slide.bodyFontFamily,
                    imageFit: slide.imageFit,
                    imagePlacement: resolveSlideImagePlacement(slide),
                    imageScale: slide.imageScale,
                })),
            }),
        });

        if (!response.ok) {
            throw new Error('Falha ao renderizar PNGs.');
        }

        const renderResult = await response.json() as { images: Array<{ id: number; filename: string; dataUrl: string }> };
        const merged = [...openAIGenerated, ...renderResult.images].sort((a, b) => a.id - b.id);
        return { images: merged };
    };

    const handleExportCurrentSlide = async () => {
        if (!generatedSlides.length) return;

        setIsExportingCurrent(true);
        try {
            const currentSlide = generatedSlides[selectedSlideIndex];
            const { images } = await renderSlidesToPng([currentSlide]);

            if (images[0]) {
                triggerDownload(images[0].dataUrl, images[0].filename);
            }
        } catch (error) {
            console.error(error);
            setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao exportar PNG.');
        } finally {
            setIsExportingCurrent(false);
        }
    };

    const handleDownloadPngPack = async () => {
        if (!generatedSlides.length) return;

        setIsExportingPack(true);
        try {
            const { images } = await renderSlidesToPng(generatedSlides);

            images.forEach((image, index) => {
                window.setTimeout(() => {
                    triggerDownload(image.dataUrl, image.filename);
                }, index * 180);
            });
        } catch (error) {
            console.error(error);
            setCarouselDraftError(error instanceof Error ? error.message : 'Erro ao exportar pack de PNGs.');
        } finally {
            setIsExportingPack(false);
        }
    };

    const handleSourceSelect = (sourceId: string, placeholderPrompt: string) => {
        setContentStudioSourceMode('knowledge');
        setActiveSource(sourceId);
        if (!contextText) {
            setContextText(placeholderPrompt);
        }
    };

    const handleRunEngine = async () => {
        const contentStudioContext = getContentStudioContext();
        if (!contentStudioContext) {
            return;
        }

        setAgentStatus('COPYWRITER');
        setContentStudioError('');
        setIsLoading(true);
        // Move to construction step
        setCurrentStep(6);

        try {
            const archetype = ARCHETYPES.find(a => a.id === selectedArchetype)?.name || 'Generic';
            const stylePresetPatch = buildStylePresetPatch(carouselStylePreset);

            // 1. Generate Structured Content
            const result = await generateStructuredContent(
                selectedAsset,
                contentStudioContext,
                selectedObjective,
                archetype,
                getContentGenerationPromptTemplate(selectedAsset),
            );

            const slidesData = result.slides.map((slide, index) => clampSlideTypographyForTemplate({
                ...slide,
                imageUrl: '',
                templateId: applyDefaultTemplate(index, selectedAsset),
                ...createSlideDesignDefaultsFromIdentity(brandVisualIdentity),
                ...Object.fromEntries(Object.entries(stylePresetPatch).filter(([, value]) => value !== undefined)),
                eyebrow: index === 0 ? (brandVisualIdentity.brandName || 'Capa de Carrossel') : `Slide ${index + 1}`,
                footerLabel: index === result.slides.length - 1 ? 'CTA' : 'Carrossel',
            }));

            setGeneratedSlides(slidesData);
            setCarouselBrandProfile(mapIdentityToCarouselProfile(brandVisualIdentity));
            setCritique(null);

            // 2. Auto-generate images for all slides via OpenAI
            setAgentStatus('ILLUSTRATOR');

            const imageResults = await Promise.allSettled(
                slidesData.map((slide, index) =>
                    fetch('/api/ai/slide/image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            slideIndex: index,
                            totalSlides: slidesData.length,
                            title: slide.title,
                            body: slide.body,
                            visualPrompt: slide.visualPrompt,
                            primaryColor: brandVisualIdentity.primaryColor,
                            backgroundColor: brandVisualIdentity.backgroundColor,
                            textColor: brandVisualIdentity.textColor,
                            accentColor: brandVisualIdentity.accentColor,
                            brandName: brandVisualIdentity.brandName,
                        }),
                    })
                    .then(r => r.json())
                    .then((data: { imageUrl?: string; error?: string }) => {
                        if (data.error) throw new Error(data.error);
                        if (!data.imageUrl) throw new Error('No imageUrl returned.');
                        return { slideId: slide.id, imageUrl: data.imageUrl };
                    }),
                ),
            );

            const nextImages: Record<number, string> = {};
            imageResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    nextImages[result.value.slideId] = result.value.imageUrl;
                }
            });

            if (Object.keys(nextImages).length > 0) {
                setGeneratedImages(nextImages);
            }

            const failCount = imageResults.filter(r => r.status === 'rejected').length;
            if (failCount > 0 && failCount === imageResults.length) {
                setContentStudioError('Imagens não puderam ser geradas. Verifique a chave OPENAI_API_KEY.');
            }

            setAgentStatus('IDLE');
        } catch (e) {
            console.error(e);
            setContentStudioError(e instanceof Error ? e.message : 'Erro ao gerar o conteúdo estruturado.');
            setAgentStatus('IDLE');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunCritique = async () => {
        if (generatedSlides.length === 0) {
            return;
        }

        const contentStudioContext = getContentStudioContext();
        const archetype = ARCHETYPES.find(a => a.id === selectedArchetype)?.name || 'Generic';
        const fullCopy = generatedSlides.map(s => `Slide ${s.id}: ${s.title}\n${s.body}\nVisual: ${s.visualPrompt}`).join('\n\n');

        setIsCritiquingContent(true);
        try {
            const feedback = await critiqueBrandCopy(fullCopy, archetype, contentStudioContext);
            setCritique(feedback);
        } catch (error) {
            console.error('Error running critique', error);
            setContentStudioError(error instanceof Error ? error.message : 'Erro ao executar a crítica do conteúdo.');
        } finally {
            setIsCritiquingContent(false);
        }
    };

    const handleGenerateSlideImage = async (slideId: number, prompt: string) => {
        setGeneratingImgId(slideId);
        try {
            const targetSlide = generatedSlides.find((slide) => slide.id === slideId);
            const renderHint = getSlideRenderHint(targetSlide?.templateId);
            const placementHint = targetSlide
                ? resolveSlideImagePlacement(targetSlide) === 'half'
                    ? 'Create a composition that works in a half-slide editorial panel, with the subject offset and enough negative space for copy.'
                    : 'Create a composition that works as a full background image for a carousel slide, preserving legibility for overlay text.'
                : '';
            const readabilityHint = `Compose for ${renderHint.viewportLabel}. Preserve clean negative space so exported slide keeps readable typography above platform minimums.`;
            const images = await generateImage(
                [prompt, placementHint, readabilityHint].filter(Boolean).join('\n\n'),
                ImageSize.S_1K,
                renderHint.aspectRatio,
            );
            if (images.length > 0) {
                setGeneratedImages(prev => ({ ...prev, [slideId]: images[0] }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingImgId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setEditorialSourceMode('manifesto');
        setManifestoFile(file);
        setManifestoName(file.name.replace(/\.[^.]+$/, ''));
        setManifestoDraftSourceType('uploaded_file');
        setManifestoError('');
        setEditorialError('');
        setEditorialNotice('');
        setIsLoading(true);
        
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item: { str?: string }) => item.str ?? '')
                        .join(' ');
                    fullText += pageText + '\n';
                }
                text = fullText;
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else {
                setManifestoError('Formato não suportado. Envie um PDF ou DOCX.');
                setIsLoading(false);
                return;
            }
            
            setManifestoContent(text);
            setSelectedManifestoId(null);
            setManifestoNotice('Manifesto importado. Salve-o para reutilizar em futuras gerações.');
            setEditorialNotice('Manifesto importado. Agora siga para a tela de linhas editoriais para gerar ou editar as sugestões.');
            await persistManifesto('uploaded_file', {
                name: file.name.replace(/\.[^.]+$/, ''),
                content: text,
                sourceFileName: file.name,
            });
            
        } catch (error) {
            console.error("Error parsing file:", error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao processar o arquivo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedVisualIdentityFromInstagram = () => {
        if (!isInstagramConnected) {
            setManifestoError('Conecte o Instagram antes de usar o perfil como base da identidade visual.');
            return;
        }

        setBrandVisualIdentity((current) => ({
            ...current,
            brandName: current.instagramPageName || instagramAccountLabel.replace(/^@/, '') || current.brandName,
            brandHandle: current.instagramUsername ? `@${current.instagramUsername}` : (instagramAccountLabel || current.brandHandle),
            source: 'instagram_seed',
        }));
        setCarouselBrandProfile((current) => ({
            ...current,
            brandName: brandVisualIdentity.instagramPageName || instagramAccountLabel.replace(/^@/, '') || current.brandName,
            brandHandle: brandVisualIdentity.instagramUsername ? `@${brandVisualIdentity.instagramUsername}` : (instagramAccountLabel || current.brandHandle),
        }));
        setHasUnsavedBrandIdentityChanges(true);
        setManifestoNotice('Nome e @ do perfil conectado aplicados como base da identidade visual.');
    };

    const handleSaveBrandIdentity = async () => {
        setManifestoError('');
        try {
            await persistBrandVisualIdentity(undefined, {
                successMessage: 'Identidade visual da marca salva e pronta para orientar o calendário e a criação.',
            });
        } catch (error) {
            console.error('Error saving brand visual identity', error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao salvar a identidade visual da marca.');
        }
    };

    const handleApplyBrandIdentityToCurrentCarousel = () => {
        applyBrandIdentityToEditor(brandVisualIdentity);
        setManifestoNotice('Identidade visual aplicada ao carrossel atual.');
    };

    const handleSelectManifesto = (manifesto: BrandManifestoRecord) => {
        setManifestoFile(null);
        syncManifestoSelection(manifesto);
    };

    const handleCreateNewManifesto = () => {
        setSelectedManifestoId(null);
        setManifestoFile(null);
        setManifestoName(editorialSeed.brandName || '');
        setManifestoContent('');
        setManifestoDraftSourceType('manual');
        setEditorialSourceMode('manifesto');
        setEditorialLines([]);
        setHasUnsavedEditorialChanges(false);
        setManifestoError('');
        setManifestoNotice('Novo manifesto em branco. Gere com IA, escreva manualmente ou importe um arquivo.');
        const nextIdentity = createDefaultBrandVisualIdentity('manifesto', null);
        setBrandVisualIdentity(nextIdentity);
        setCarouselBrandProfile(mapIdentityToCarouselProfile(nextIdentity));
        setHasUnsavedBrandIdentityChanges(false);
    };

    const handleSaveManifesto = async (sourceType: BrandManifestoSourceType = manifestoDraftSourceType) => {
        if (!manifestoContent.trim()) {
            setManifestoError('Escreva, gere ou importe um manifesto antes de salvar.');
            return;
        }

        setIsLoading(true);
        setManifestoError('');
        try {
            const savedManifesto = await persistManifesto(sourceType);

            if (hasUnsavedBrandIdentityChanges || brandVisualIdentity.scopeMode !== 'manifesto' || brandVisualIdentity.manifestoId !== savedManifesto.id) {
                await persistBrandVisualIdentity(
                    {
                        scopeMode: 'manifesto',
                        manifestoId: savedManifesto.id,
                    },
                    {
                        successMessage: 'Identidade visual vinculada ao manifesto e salva para futuras criações.',
                        silentNotice: true,
                    },
                );
            }

            if (editorialSourceMode === 'manifesto' && hasUnsavedEditorialChanges) {
                await persistEditorialWorkspace(
                    editorialLines,
                    {
                        scopeMode: 'manifesto',
                        manifestoId: savedManifesto.id,
                    },
                    {
                        successMessage: 'Linhas editoriais vinculadas a este manifesto e salvas para futuras gerações.',
                    },
                );
            }
        } catch (error) {
            console.error('Error saving manifesto', error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao salvar manifesto.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteManifestoRecord = async (manifestoId: string) => {
        setIsLoading(true);
        setManifestoError('');
        try {
            const response = await fetch(`/api/branding/manifestos/${manifestoId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.error || 'Erro ao excluir manifesto.');
            }

            const nextManifestos = savedManifestos.filter((manifesto) => manifesto.id !== manifestoId);
            setSavedManifestos(nextManifestos);

            if (selectedManifestoId === manifestoId) {
                if (nextManifestos[0]) {
                    handleSelectManifesto(nextManifestos[0]);
                } else {
                    handleCreateNewManifesto();
                }
            }

            setManifestoNotice('Manifesto removido da base salva.');
        } catch (error) {
            console.error('Error deleting manifesto', error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao excluir manifesto.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateManifesto = async () => {
        if (!buildEditorialSeedContext().trim()) {
            setManifestoError('Preencha o briefing da marca antes de pedir a criação do manifesto.');
            return;
        }

        if (!textAiConfigured) {
            setManifestoError('A IA textual não está configurada. Ative um provider de texto no AI Control Center.');
            return;
        }

        setIsGeneratingManifesto(true);
        setManifestoError('');
        setManifestoNotice('');

        try {
            const generated = await generateBrandManifesto(
                buildManifestoBrief(),
                manifestoAgentPrompt,
                manifestoContent,
            );

            if (!generated.trim()) {
                throw new Error('A IA não retornou um manifesto válido.');
            }

            setManifestoName((current) => current.trim() || editorialSeed.brandName.trim() || 'Manifesto da Marca');
            setManifestoContent(generated);
            setManifestoDraftSourceType('ai');
            setEditorialSourceMode('manifesto');
            setManifestoNotice('Manifesto gerado pelo agente. Revise o texto e salve para reutilizar no Brand[OS].');
        } catch (error) {
            console.error('Error generating manifesto', error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao gerar manifesto.');
        } finally {
            setIsGeneratingManifesto(false);
        }
    };

    const handleSaveManifestoAgentPrompt = async () => {
        if (!manifestoAgentPrompt.trim()) {
            setManifestoError('O system prompt do agente não pode ficar vazio.');
            return;
        }

        setIsSavingManifestoPrompt(true);
        setManifestoError('');
        try {
            const response = await fetch('/api/ai/prompts/branding_manifesto_agent', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: manifestoAgentPrompt }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Erro ao salvar system prompt do agente.');
            }

            setManifestoNotice('System prompt do agente de manifesto salvo.');
        } catch (error) {
            console.error('Error saving manifesto prompt', error);
            setManifestoError(error instanceof Error ? error.message : 'Erro ao salvar prompt do agente.');
        } finally {
            setIsSavingManifestoPrompt(false);
        }
    };

    const savePromptTemplate = async (promptId: string, prompt: string) => {
        const response = await fetch(`/api/ai/prompts/${promptId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload?.error || 'Erro ao salvar prompt.');
        }
    };

    const handleSaveEditorialPrompt = async () => {
        const promptId = editorialSourceMode === 'manifesto' ? 'branding_editorial_manifesto' : 'branding_editorial_blank';
        const prompt = getEditorialPrompt();

        if (!prompt.trim()) {
            setEditorialError('O prompt editorial não pode ficar vazio.');
            return;
        }

        setIsSavingEditorialPrompt(true);
        setEditorialError('');
        try {
            await savePromptTemplate(promptId, prompt);
            setEditorialNotice('Prompt do agente editorial salvo.');
        } catch (error) {
            console.error('Error saving editorial prompt', error);
            setEditorialError(error instanceof Error ? error.message : 'Erro ao salvar prompt editorial.');
        } finally {
            setIsSavingEditorialPrompt(false);
        }
    };

    const handleSaveEditorialLines = async () => {
        try {
            await persistEditorialWorkspace(
                editorialLines,
                undefined,
                {
                    successMessage: 'Workspace editorial salvo. Essas linhas seguem disponíveis para futuras gerações.',
                },
            );
        } catch (error) {
            console.error('Error saving editorial lines', error);
            setEditorialError(error instanceof Error ? error.message : 'Erro ao salvar linhas editoriais.');
        }
    };

    const handleResetEditorialPrompt = async () => {
        const promptId = editorialSourceMode === 'manifesto' ? 'branding_editorial_manifesto' : 'branding_editorial_blank';
        const defaultPrompt = editorialSourceMode === 'manifesto'
            ? DEFAULT_MANIFESTO_EDITORIAL_PROMPT
            : DEFAULT_BLANK_EDITORIAL_PROMPT;

        if (editorialSourceMode === 'manifesto') {
            setManifestoEditorialPrompt(defaultPrompt);
        } else {
            setBlankEditorialPrompt(defaultPrompt);
        }

        setIsSavingEditorialPrompt(true);
        try {
            await savePromptTemplate(promptId, defaultPrompt);
            setEditorialNotice('Prompt editorial redefinido para o padrão.');
        } catch (error) {
            console.error('Error resetting editorial prompt', error);
            setEditorialError(error instanceof Error ? error.message : 'Erro ao redefinir prompt editorial.');
        } finally {
            setIsSavingEditorialPrompt(false);
        }
    };

    const handleSaveCalendarPrompt = async () => {
        if (!calendarPrompt.trim()) {
            setCalendarError('O prompt do agente de calendário não pode ficar vazio.');
            return;
        }

        setIsSavingCalendarPrompt(true);
        setCalendarError('');
        try {
            await savePromptTemplate('branding_content_calendar', calendarPrompt);
            setCalendarNotice('Prompt do agente de calendário salvo.');
        } catch (error) {
            console.error('Error saving calendar prompt', error);
            setCalendarError(error instanceof Error ? error.message : 'Erro ao salvar prompt do calendário.');
        } finally {
            setIsSavingCalendarPrompt(false);
        }
    };

    const handleResetCalendarPrompt = async () => {
        setCalendarPrompt(DEFAULT_CALENDAR_PROMPT);
        setIsSavingCalendarPrompt(true);
        try {
            await savePromptTemplate('branding_content_calendar', DEFAULT_CALENDAR_PROMPT);
            setCalendarNotice('Prompt do calendário redefinido para o padrão.');
        } catch (error) {
            console.error('Error resetting calendar prompt', error);
            setCalendarError(error instanceof Error ? error.message : 'Erro ao redefinir prompt do calendário.');
        } finally {
            setIsSavingCalendarPrompt(false);
        }
    };

    const handleGenerateEditorialLines = async () => {
        const sourceText = getEditorialSourceText();
        if (!sourceText) {
            setEditorialError('Adicione um manifesto ou preencha o briefing antes de gerar linhas editoriais.');
            return;
        }

        if (!textAiConfigured) {
            setEditorialError('A IA textual não está configurada. Ative um provider de texto no AI Control Center para gerar sugestões.');
            return;
        }

        setEditorialError('');
        setEditorialNotice('');
        setIsLoading(true);
        try {
            const lines = await generateEditorialLines(sourceText, getEditorialPrompt(), getEditorialSourceLabel());
            const normalizedLines = lines
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => createEditorialLine(line, 'ai'));

            if (normalizedLines.length === 0) {
                setEditorialError('A IA respondeu sem linhas válidas. Revise o prompt salvo no AI Control Center, ajuste o prompt local ou confira o provider textual ativo.');
                return;
            }

            setEditorialLines(normalizedLines);
            setHasUnsavedEditorialChanges(true);

            const shouldPersistImmediately = editorialSourceMode === 'blank' || Boolean(selectedManifestoId);
            if (shouldPersistImmediately) {
                await persistEditorialWorkspace(
                    normalizedLines,
                    undefined,
                    {
                        successMessage: `${normalizedLines.length} linhas editoriais geradas e salvas. Edite, remova ou desmarque as que não entram no calendário.`,
                    },
                );
            } else {
                setEditorialNotice(`${normalizedLines.length} linhas editoriais geradas. Salve o manifesto para persisti-las e edite, remova ou desmarque as que não entram no calendário.`);
            }
        } catch (error) {
            console.error("Error generating editorial lines:", error);
            const message = error instanceof Error ? error.message : 'Erro ao gerar linhas editoriais.';
            setEditorialError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Instagram Connection
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const origin = event.origin;
            if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
                return;
            }
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                setIsInstagramConnected(true);
                const username = event.data?.connection?.igUsername ? `@${event.data.connection.igUsername}` : '';
                const pageName = event.data?.connection?.pageName || '';
                setInstagramAccountLabel(username || pageName);
                setCalendarNotice(username || pageName ? `Instagram conectado: ${username || pageName}` : 'Instagram conectado com sucesso.');
                void loadInstagramState();
            }
            if (event.data?.type === 'OAUTH_AUTH_ERROR') {
                setCalendarError(typeof event.data?.error === 'string' ? event.data.error : 'Falha ao autenticar no Instagram.');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleConnectInstagram = async () => {
        try {
            const response = await fetch('/api/auth/instagram/url');
            if (!response.ok) {
                throw new Error('Failed to get auth URL');
            }
            const { url } = await response.json();
            
            const authWindow = window.open(
                url,
                'oauth_popup',
                'width=600,height=700'
            );
            
            if (!authWindow) {
                setCalendarError('Permita popups no navegador para conectar sua conta do Instagram.');
            }
        } catch (error) {
            console.error('OAuth error:', error);
            setCalendarError(error instanceof Error ? error.message : 'Erro ao conectar com Instagram. Verifique as configurações de API.');
        }
    };

    const handlePublishToInstagram = async (post: CalendarPost) => {
        if (!isInstagramConnected) {
            setCalendarError('Conecte-se ao Instagram antes de publicar.');
            return;
        }

        if (!post.imageUrl.trim() || post.imageUrl.startsWith('data:')) {
            setCalendarError('Adicione uma URL pública de imagem (não data URL) no card antes de publicar no Instagram. Exporte o PNG na Etapa 8, hospede e cole a URL.');
            return;
        }

        if (!post.scheduledAt) {
            setCalendarError('Defina a data e hora de postagem no card antes de programar no Instagram.');
            return;
        }
        
        setIsLoading(true);
        setCalendarError('');
        setCalendarNotice('');
        try {
            const response = await fetch('/api/instagram/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    localPostId: post.id,
                    caption: post.description,
                    image_url: post.imageUrl,
                    scheduled_at: post.scheduledAt,
                    day: post.day,
                    format: post.format,
                    theme: post.theme,
                })
            });
            
            if (response.ok) {
                const payload = await response.json();
                const nextStatus: CalendarPostStatus = payload?.mode === 'published' ? 'Published' : 'Scheduled';
                const nextInstagramStatus: InstagramSyncStatus = payload?.mode === 'published' ? 'Published' : 'Scheduled';

                setContentCalendar(prev => prev.map(p => p.id === post.id ? {
                    ...p,
                    status: nextStatus,
                    instagramStatus: nextInstagramStatus,
                    scheduledAt: payload?.job?.scheduledAt || p.scheduledAt,
                } : p));
                setCalendarNotice(payload?.message || 'Instagram sincronizado com sucesso.');
                await loadInstagramState();
            } else {
                const payload = await response.json();
                throw new Error(payload?.error || 'Erro ao sincronizar com Instagram.');
            }
        } catch (error) {
            console.error(error);
            setCalendarError(error instanceof Error ? error.message : 'Erro ao publicar.');
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD Calendar
    const handleSavePost = () => {
        if (!editingPost) return;

        const dateValue = parseCalendarItemDate(editingPost.day);
        const normalizedDay = dateValue ? formatDayLabel(dateValue) : editingPost.day;
        const normalizedEditorialLine = editingPost.editorialLine?.trim() || selectedEditorialLines[0]?.content || '';
        const normalizedScheduledAt = editingPost.scheduledAt?.trim()
            ? editingPost.scheduledAt
            : (dateValue ? `${formatDateInput(dateValue)}T09:00` : '');
        const hasImageUrl = Boolean(editingPost.imageUrl?.trim());
        const nextInstagramStatus = editingPost.instagramStatus
            || (normalizedScheduledAt && hasImageUrl ? 'Ready' : 'Not Synced');
        const normalizedApprovalStatus = editingPost.approvalStatus || 'Needs Review';

        if (editingPost.id) {
            setContentCalendar(prev => prev.map(p => p.id === editingPost.id ? {
                ...p,
                ...editingPost,
                day: normalizedDay,
                editorialLine: normalizedEditorialLine,
                approvalStatus: normalizedApprovalStatus,
                scheduledAt: normalizedScheduledAt,
                instagramStatus: nextInstagramStatus,
                imageUrl: editingPost.imageUrl?.trim() || '',
                status: editingPost.status || p.status,
            } : p));
            setSelectedProductionPostIds((current) => (
                normalizedApprovalStatus === 'Approved'
                    ? Array.from(new Set([...current, editingPost.id as string]))
                    : current.filter((id) => id !== editingPost.id)
            ));
        } else {
            const nextId = Date.now().toString();
            setContentCalendar(prev => [...prev, {
                ...editingPost,
                id: nextId,
                day: normalizedDay,
                editorialLine: normalizedEditorialLine,
                approvalStatus: normalizedApprovalStatus,
                scheduledAt: normalizedScheduledAt,
                status: editingPost.status || 'Draft',
                instagramStatus: nextInstagramStatus,
                imageUrl: editingPost.imageUrl?.trim() || '',
            } as CalendarPost]);
            if (normalizedApprovalStatus === 'Approved') {
                setSelectedProductionPostIds((current) => Array.from(new Set([...current, nextId])));
            }
        }

        if (dateValue) {
            setCalendarFocusedDayKey(formatDateInput(dateValue));
            setCalendarViewDate(calendarViewMode === 'monthly' ? startOfMonth(dateValue) : dateValue);
        }

        setCalendarNotice('Card salvo no calendário.');
        closeCalendarPostModal();
    };

    const handleDeletePost = (id: string) => {
        setContentCalendar(prev => prev.filter(p => p.id !== id));
        setSelectedCalendarPostIds((current) => current.filter((postId) => postId !== id));
        setSelectedProductionPostIds((current) => current.filter((postId) => postId !== id));
        if (editingPost?.id === id) {
            closeCalendarPostModal();
        }
        setCalendarNotice('Card removido do calendário.');
    };

    const openNewPostModal = (date?: Date) => {
        const baseDate = date ? formatDateInput(date) : calendarRange.startDate;
        if (baseDate) {
            setCalendarFocusedDayKey(baseDate);
        }
        setCalendarCardGenerationMode('manual');
        setEditingPost({
            day: baseDate ? formatDayLabel(new Date(`${baseDate}T00:00:00`)) : 'Novo Dia',
            format: 'Post de Instagram',
            editorialLine: selectedEditorialLines[0]?.content || '',
            theme: '',
            description: '',
            status: 'Draft',
            approvalStatus: 'Needs Review',
            scheduledAt: baseDate ? buildScheduledAt(baseDate, '09:00') : '',
            instagramStatus: 'Not Synced',
            imageUrl: '',
        });
        setIsModalOpen(true);
    };

    const openNewAiCardModal = async (date?: Date) => {
        const baseDate = date ? formatDateInput(date) : calendarRange.startDate;
        if (!baseDate) {
            openNewPostModal(date);
            return;
        }

        const draft: CalendarPostDraft = {
            day: formatDayLabel(new Date(`${baseDate}T00:00:00`)),
            format: 'Post de Instagram',
            editorialLine: selectedEditorialLines[0]?.content || '',
            theme: '',
            description: '',
            status: 'Draft',
            approvalStatus: 'Needs Review',
            scheduledAt: buildScheduledAt(baseDate, '09:00'),
            instagramStatus: 'Not Synced',
            imageUrl: '',
        };

        setCalendarFocusedDayKey(baseDate);
        setCalendarCardGenerationMode('ai');
        setEditingPost(draft);
        setIsModalOpen(true);
        await handleGenerateCalendarCardSuggestion({
            dateLabel: draft.day,
            editorialLine: draft.editorialLine,
            format: draft.format,
            customDirection: '',
        });
    };

    const renderCalendarCreateButtons = (date?: Date, compact = false) => (
        <div className={`flex flex-wrap ${compact ? 'gap-2' : 'gap-3'}`}>
            <Button
                variant="primary"
                className={compact ? 'text-xs' : ''}
                onClick={() => {
                    void openNewAiCardModal(date);
                }}
            >
                <BrainCircuit size={compact ? 14 : 18} className="mr-2" /> Criar com IA
            </Button>
            <Button
                variant="secondary"
                className={compact ? 'text-xs' : ''}
                onClick={() => openNewPostModal(date)}
            >
                <Plus size={compact ? 14 : 18} className="mr-2" /> Criar do zero
            </Button>
        </div>
    );

    const handleGenerateCalendar = async () => {
        const sourceText = getEditorialSourceText() || 'Contexto de marca em construcao. Use as linhas editoriais como verdade principal.';
        if (selectedEditorialLines.length === 0) {
            setCalendarError('Selecione pelo menos uma linha editorial para criar o calendário.');
            return;
        }

        if (!calendarRange.startDate || !calendarRange.endDate) {
            setCalendarError('Defina a data inicial e final do período do calendário.');
            return;
        }

        if (calendarRange.endDate < calendarRange.startDate) {
            setCalendarError('A data final precisa ser igual ou posterior à data inicial.');
            return;
        }

        if (!textAiConfigured) {
            setCalendarError('A IA textual não está configurada. Ative um provider de texto no AI Control Center para gerar o calendário.');
            return;
        }

        setCalendarError('');
        setIsLoading(true);
        try {
            const calendar = await generateContentCalendar(
                sourceText,
                selectedEditorialLines.map(line => line.content.trim()),
                getEditorialSourceLabel(),
                calendarRange,
                calendarPrompt,
            );

            if (calendar.length === 0) {
                setCalendarError('A IA não retornou um calendário válido para o período selecionado.');
                return;
            }

            // Add IDs and status to generated calendar
            const calendarWithIds: CalendarPost[] = calendar.map((item: ContentCalendarEntry, index: number) => ({
                ...item,
                id: `gen-${Date.now()}-${index}`,
                status: 'Draft',
                approvalStatus: 'Needs Review',
                scheduledAt: getDefaultScheduledAtFromDay(item.day),
                instagramStatus: 'Not Synced',
                imageUrl: '',
            }));
            const referenceDate = parseCalendarItemDate(calendarWithIds[0]?.day || calendarRange.startDate) || new Date(`${calendarRange.startDate}T00:00:00`);
            setContentCalendar(calendarWithIds);
            setSelectedCalendarPostIds([]);
            setSelectedProductionPostIds([]);
            setCalendarFocusedDayKey(formatDateInput(referenceDate));
            setCalendarViewDate(calendarViewMode === 'monthly' ? startOfMonth(referenceDate) : referenceDate);
            setCalendarNotice(`${calendarWithIds.length} cards criados no calendário.`);
            setCurrentStep(2);
        } catch (error) {
            console.error("Error generating calendar:", error);
            const message = error instanceof Error ? error.message : 'Erro ao gerar calendário.';
            setCalendarError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePrompt = async (format: string) => {
        if (!manifestoContent) return;
        setIsLoading(true);
        try {
            const prompt = await generateFormatPrompts(manifestoContent, format, getFormatPromptTemplate(format));
            setGeneratedPrompts(prev => ({ ...prev, [format]: prompt }));
        } catch (error) {
            console.error("Error generating prompt:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Renderers ---

    const renderStepper = () => (
        <nav aria-label="Etapas do Brand[OS]">
            <ol className="flex justify-between items-center mb-10 px-12 relative list-none p-0 m-0">
                <div className="absolute left-12 right-12 top-5 h-[2px] bg-[#222] -z-10" aria-hidden="true"></div>
                {STEPS.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const StepIcon = step.icon;
                    const statusLabel = isActive ? 'etapa atual' : isCompleted ? 'concluída' : 'pendente';

                    return (
                        <li key={step.id} className="flex flex-col items-center gap-3">
                            <button
                                type="button"
                                className={`flex flex-col items-center gap-3 group ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => isCompleted && setCurrentStep(step.id)}
                                onKeyDown={(e) => {
                                    if (isCompleted && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        setCurrentStep(step.id);
                                    }
                                }}
                                tabIndex={isCompleted || isActive ? 0 : -1}
                                aria-current={isActive ? 'step' : undefined}
                                aria-disabled={!isCompleted && !isActive}
                                aria-label={`${step.label} — ${statusLabel}`}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative bg-[#0A0A0A]
                                    ${isActive ? 'border-primary text-primary shadow-[0_0_20px_rgba(143,67,246,0.3)] scale-110' :
                                      isCompleted ? 'border-primary bg-primary text-black' : 'border-[#333] text-gray-600 group-hover:border-gray-500'}
                                `}>
                                    <StepIcon size={16} aria-hidden="true" />
                                    {isActive && <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" aria-hidden="true"></div>}
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-widest ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                    {step.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );

    const renderManifesto = () => {
        const isFirstTime = savedManifestos.length === 0 && !manifestoContent.trim();

        return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Base da Marca</h2>
                <p className="text-gray-400">Crie, importe, refine e salve o manifesto fundador da marca para alimentar todas as gerações futuras no Brand[OS].</p>
            </div>

            {isFirstTime && (
                <div className="max-w-2xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
                    <p className="text-sm font-semibold text-primary uppercase tracking-widest">Por onde começar?</p>
                    <p className="text-gray-400 text-sm">Escolha como deseja criar a base da sua marca. Você pode mudar depois.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <button
                            type="button"
                            className="rounded-xl border border-[#222] bg-[#111] hover:border-primary/60 hover:bg-primary/5 transition-colors p-4 text-left"
                            onClick={() => document.getElementById('manifesto-upload')?.click()}
                        >
                            <UploadCloud size={20} className="text-primary mb-2" aria-hidden="true" />
                            <p className="text-sm font-semibold text-white">Importar arquivo</p>
                            <p className="text-xs text-gray-500 mt-1">PDF ou DOCX com seu manifesto existente</p>
                        </button>
                        <button
                            type="button"
                            className="rounded-xl border border-[#222] bg-[#111] hover:border-primary/60 hover:bg-primary/5 transition-colors p-4 text-left"
                            onClick={() => document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Escreva ou revise aqui o manifesto fundador da marca."]')?.focus()}
                        >
                            <FileText size={20} className="text-primary mb-2" aria-hidden="true" />
                            <p className="text-sm font-semibold text-white">Escrever manualmente</p>
                            <p className="text-xs text-gray-500 mt-1">Cole ou escreva o texto direto no editor</p>
                        </button>
                        <button
                            type="button"
                            className="rounded-xl border border-[#222] bg-[#111] hover:border-primary/60 hover:bg-primary/5 transition-colors p-4 text-left"
                            onClick={() => setShowManifestoAgentPanel(true)}
                        >
                            <BrainCircuit size={20} className="text-primary mb-2" aria-hidden="true" />
                            <p className="text-sm font-semibold text-white">Gerar com IA</p>
                            <p className="text-xs text-gray-500 mt-1">Preencha um briefing e a IA cria o manifesto</p>
                        </button>
                    </div>
                </div>
            )}

            {manifestoError && (
                <div className="max-w-4xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {manifestoError}
                </div>
            )}

            {manifestoNotice && (
                <div className="max-w-4xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {manifestoNotice}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.35fr_1fr] gap-6">
                <Card className="border-border bg-[#0A0A0A] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Biblioteca da Marca</h3>
                            <p className="text-sm text-gray-500 mt-1">Manifestos salvos para reutilização.</p>
                        </div>
                        <Badge variant="secondary">{savedManifestos.length}</Badge>
                    </div>

                    <Button variant="ghost" className="w-full text-xs mb-4" onClick={handleCreateNewManifesto}>
                        <Plus size={14} className="mr-2" /> Novo manifesto
                    </Button>

                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {savedManifestos.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#222] bg-[#111] p-4 text-sm text-gray-500">
                                Nenhum manifesto salvo ainda. Importe um arquivo, escreva manualmente ou gere com IA.
                            </div>
                        ) : (
                            savedManifestos.map((manifesto) => (
                                <div
                                    key={manifesto.id}
                                    className={`rounded-2xl border p-4 transition-colors ${
                                        selectedManifestoId === manifesto.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-[#222] bg-[#111]'
                                    }`}
                                >
                                    <button className="w-full text-left" onClick={() => handleSelectManifesto(manifesto)}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{manifesto.name}</p>
                                                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mt-2">
                                                    {manifesto.sourceType === 'uploaded_file' ? 'Importado' : manifesto.sourceType === 'ai' ? 'Gerado por IA' : 'Manual'}
                                                </p>
                                            </div>
                                            {selectedManifestoId === manifesto.id && <CheckCircle2 size={16} className="text-emerald-400 mt-1" />}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-3 line-clamp-4">{manifesto.content}</p>
                                        <p className="text-[11px] text-gray-600 mt-3">Atualizado em {new Date(manifesto.updatedAt).toLocaleDateString('pt-BR')}</p>
                                    </button>
                                    <button
                                        className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                                        onClick={() => handleDeleteManifestoRecord(manifesto.id)}
                                    >
                                        Excluir manifesto
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="border-border bg-[#0A0A0A] p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <BookOpen size={18} className="text-primary" /> Manifesto da Marca
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Editor central da base estratégica que será usada em linhas editoriais, calendário e prompts de formato.</p>
                        </div>
                        <Badge variant="secondary">{selectedManifestoId ? 'Salvo' : 'Rascunho'}</Badge>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Nome do manifesto</label>
                            <input
                                className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                value={manifestoName}
                                onChange={(e) => setManifestoName(e.target.value)}
                                placeholder="Ex.: Manifesto Entrelaç[OS]"
                            />
                        </div>

                        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary transition-colors relative">
                            <input
                                type="file"
                                id="manifesto-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.docx"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="manifesto-upload" className="cursor-pointer flex flex-col items-center">
                                <UploadCloud size={32} className="text-gray-500 mb-3" />
                                <span className="text-sm text-gray-300 font-medium">Importar manifesto existente</span>
                                <span className="text-xs text-gray-500 mt-1">PDF ou DOCX (Word)</span>
                            </label>
                        </div>

                        {manifestoFile && (
                            <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-white truncate">{manifestoFile.name}</span>
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Texto-base do manifesto</label>
                            <textarea
                                className="w-full h-[360px] bg-[#141414] border border-[#222] rounded-xl p-4 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none leading-relaxed"
                                value={manifestoContent}
                                onChange={(e) => {
                                    setManifestoContent(e.target.value);
                                    setManifestoError('');
                                }}
                                placeholder="Escreva ou revise aqui o manifesto fundador da marca."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button variant="primary" className="w-full" onClick={() => handleSaveManifesto()} isLoading={isLoading}>
                                <Save size={16} className="mr-2" /> {selectedManifestoId ? 'Atualizar manifesto' : 'Salvar manifesto'}
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={() => setCurrentStep(1)}>
                                Ir para Linhas Editoriais <ChevronRight size={16} className="ml-2" />
                            </Button>
                        </div>

                        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Uso no fluxo</p>
                            <p className="text-sm text-gray-300">Este manifesto passa a ser a referência principal para linhas editoriais, calendário de conteúdo e prompts de cada formato.</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-border bg-[#0A0A0A] p-6">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between gap-3 mb-4"
                        aria-expanded={showManifestoAgentPanel}
                        aria-controls="manifesto-agent-panel"
                        onClick={() => setShowManifestoAgentPanel(v => !v)}
                    >
                        <div className="flex items-center gap-3 text-left">
                            <Bot size={18} className="text-primary shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Agente de Manifesto</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Briefing estruturado para gerar ou refinar com IA.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary">{textAiConfigured ? textAiModel : 'IA indisponível'}</Badge>
                            <ChevronRight size={16} className={`text-gray-500 transition-transform ${showManifestoAgentPanel ? 'rotate-90' : ''}`} />
                        </div>
                    </button>

                    {showManifestoAgentPanel && <div id="manifesto-agent-panel" className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Marca</label>
                            <input
                                className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                value={editorialSeed.brandName}
                                onChange={(e) => updateEditorialSeed('brandName', e.target.value)}
                                placeholder="Nome da marca ou produto"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Posicionamento</label>
                            <textarea
                                className="w-full h-20 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-none"
                                value={editorialSeed.positioning}
                                onChange={(e) => updateEditorialSeed('positioning', e.target.value)}
                                placeholder="Qual tese, crença e lugar essa marca quer ocupar?"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Público</label>
                                <input
                                    className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                    value={editorialSeed.audience}
                                    onChange={(e) => updateEditorialSeed('audience', e.target.value)}
                                    placeholder="Quem a marca quer atingir"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Tom de voz</label>
                                <input
                                    className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                    value={editorialSeed.voice}
                                    onChange={(e) => updateEditorialSeed('voice', e.target.value)}
                                    placeholder="Ex.: direto, elegante, educativo"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Territórios editoriais</label>
                            <textarea
                                className="w-full h-20 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-none"
                                value={editorialSeed.themes}
                                onChange={(e) => updateEditorialSeed('themes', e.target.value)}
                                placeholder="Assuntos e territórios que a marca precisa dominar"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Objetivo</label>
                                <input
                                    className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                    value={editorialSeed.objective}
                                    onChange={(e) => updateEditorialSeed('objective', e.target.value)}
                                    placeholder="Autoridade, demanda, comunidade..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Referências e restrições</label>
                                <input
                                    className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                    value={editorialSeed.references}
                                    onChange={(e) => updateEditorialSeed('references', e.target.value)}
                                    placeholder="Referências, limites, termos proibidos..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">System prompt do agente</label>
                            <textarea
                                className="w-full h-32 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                                value={manifestoAgentPrompt}
                                onChange={(e) => setManifestoAgentPrompt(e.target.value)}
                                placeholder="Prompt do agente responsável por criar o manifesto"
                            />
                            <div className="mt-3 flex gap-3">
                                <Button variant="ghost" className="text-xs" onClick={handleSaveManifestoAgentPrompt} isLoading={isSavingManifestoPrompt}>
                                    <Save size={14} className="mr-2" /> Salvar system prompt
                                </Button>
                                <Button variant="primary" className="text-xs" onClick={handleGenerateManifesto} isLoading={isGeneratingManifesto} disabled={!textAiConfigured}>
                                    <RefreshCw size={14} className="mr-2" /> Gerar manifesto com IA
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Próximas etapas</p>
                            <p className="text-sm text-gray-300">Depois de salvar a base da marca, o próximo passo é gerar linhas editoriais e montar o calendário de conteúdo usando esse manifesto como grounding.</p>
                        </div>
                    </div>}
                </Card>
            </div>

            <Card className="border-border bg-[#0A0A0A] p-6">
                <button
                    type="button"
                    className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-0 text-left"
                    aria-expanded={showVisualIdentityPanel}
                    aria-controls="visual-identity-panel"
                    onClick={() => setShowVisualIdentityPanel(v => !v)}
                >
                    <div className="flex items-center gap-3">
                        <Palette size={18} className="text-primary shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Identidade Visual da Marca</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Base visual para geração de conteúdos, editor de carrossel e IA.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Badge variant="secondary">{isInstagramConnected ? (instagramAccountLabel || 'Instagram conectado') : 'Instagram não conectado'}</Badge>
                        <Badge variant="secondary">{isLoadingBrandIdentity ? 'Carregando' : hasUnsavedBrandIdentityChanges ? 'Pendente' : 'Sincronizado'}</Badge>
                        <ChevronRight size={16} className={`text-gray-500 transition-transform ${showVisualIdentityPanel ? 'rotate-90' : ''}`} />
                    </div>
                </button>

                {showVisualIdentityPanel && <div id="visual-identity-panel" className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_1fr] gap-6 mt-6">
                    <div className="rounded-2xl border border-[#222] bg-[#111] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">Perfil da marca</p>
                            {isInstagramConnected && (
                                <button
                                    type="button"
                                    className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                                    onClick={handleSeedVisualIdentityFromInstagram}
                                >
                                    Usar Instagram conectado
                                </button>
                            )}
                        </div>
                        <input
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={brandVisualIdentity.brandName}
                            onChange={(e) => updateBrandVisualIdentityField('brandName', e.target.value)}
                            placeholder="Nome visual da marca"
                        />
                        <input
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={brandVisualIdentity.brandHandle}
                            onChange={(e) => updateBrandVisualIdentityField('brandHandle', e.target.value)}
                            placeholder="@perfilprincipal"
                        />
                        <input
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={brandVisualIdentity.brandStudioLabel}
                            onChange={(e) => updateBrandVisualIdentityField('brandStudioLabel', e.target.value)}
                            placeholder="Assinatura editorial da marca"
                        />
                        <input
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={brandVisualIdentity.profileImageUrl}
                            onChange={(e) => updateBrandVisualIdentityField('profileImageUrl', e.target.value)}
                            placeholder="URL pública da foto de perfil"
                        />
                        <label className="block">
                            <span className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-bold block mb-2">Upload da foto de perfil</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-[10px] text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-primary"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        if (typeof reader.result === 'string') {
                                            updateBrandVisualIdentityField('profileImageUrl', reader.result);
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                    e.currentTarget.value = '';
                                }}
                            />
                        </label>
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4 text-xs text-gray-400">
                            <p className="text-white font-semibold mb-1">Instagram conectado</p>
                            <p>{brandVisualIdentity.instagramUsername ? `@${brandVisualIdentity.instagramUsername}` : 'Nenhum username sincronizado ainda.'}</p>
                            <p className="mt-1">{brandVisualIdentity.instagramPageName || 'Nenhuma página sincronizada ainda.'}</p>
                            <p className="mt-3 text-[11px] text-gray-500">O Meta login hoje preenche automaticamente o nome e o @. A foto do perfil continua manual para garantir controle visual.</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#222] bg-[#111] p-5 space-y-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">Sistema visual</p>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { field: 'primaryColor' as const, label: 'Cor primária' },
                                { field: 'secondaryColor' as const, label: 'Cor secundária' },
                                { field: 'accentColor' as const, label: 'Cor de destaque' },
                                { field: 'backgroundColor' as const, label: 'Fundo' },
                                { field: 'surfaceColor' as const, label: 'Superfície' },
                                { field: 'textColor' as const, label: 'Texto' },
                            ]).map(({ field, label }) => (
                                <label key={field} className="space-y-2">
                                    <span className="text-[11px] text-gray-500 uppercase tracking-[0.18em] font-bold block">{label}</span>
                                    <div className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#141414] px-3 py-2">
                                        <input
                                            type="color"
                                            value={brandVisualIdentity[field]}
                                            onChange={(e) => updateBrandVisualIdentityField(field, e.target.value)}
                                            className="h-9 w-10 rounded border border-[#222] bg-transparent"
                                        />
                                        <span className="text-xs text-gray-300">{brandVisualIdentity[field]}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-[0.18em] font-bold mb-2">Fonte dos títulos</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => updateBrandVisualIdentityField('titleFontFamily', 'serif')} className={`rounded-lg border px-3 py-2 text-[10px] ${brandVisualIdentity.titleFontFamily === 'serif' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#141414] text-gray-400'}`}>Serif</button>
                                    <button type="button" onClick={() => updateBrandVisualIdentityField('titleFontFamily', 'sans')} className={`rounded-lg border px-3 py-2 text-[10px] ${brandVisualIdentity.titleFontFamily === 'sans' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#141414] text-gray-400'}`}>Sans</button>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-500 uppercase tracking-[0.18em] font-bold mb-2">Fonte do corpo</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => updateBrandVisualIdentityField('bodyFontFamily', 'serif')} className={`rounded-lg border px-3 py-2 text-[10px] ${brandVisualIdentity.bodyFontFamily === 'serif' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#141414] text-gray-400'}`}>Serif</button>
                                    <button type="button" onClick={() => updateBrandVisualIdentityField('bodyFontFamily', 'sans')} className={`rounded-lg border px-3 py-2 text-[10px] ${brandVisualIdentity.bodyFontFamily === 'sans' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#141414] text-gray-400'}`}>Sans</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-[0.18em] font-bold mb-2">
                                <span>Tamanho-base dos títulos</span>
                                <span>{brandVisualIdentity.titleFontSize}px</span>
                            </div>
                            <input type="range" min="43" max="80" step="1" value={brandVisualIdentity.titleFontSize} onChange={(e) => updateBrandVisualIdentityField('titleFontSize', Number(e.target.value))} className="w-full" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-[0.18em] font-bold mb-2">
                                <span>Tamanho-base do corpo</span>
                                <span>{brandVisualIdentity.bodyFontSize}px</span>
                            </div>
                            <input type="range" min="34" max="48" step="1" value={brandVisualIdentity.bodyFontSize} onChange={(e) => updateBrandVisualIdentityField('bodyFontSize', Number(e.target.value))} className="w-full" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#222] bg-[#111] p-5 space-y-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">Direção criativa</p>
                        <textarea
                            className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                            value={brandVisualIdentity.visualStyle}
                            onChange={(e) => updateBrandVisualIdentityField('visualStyle', e.target.value)}
                            placeholder="Ex.: premium editorial, modular, ousado, minimalista..."
                        />
                        <textarea
                            className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                            value={brandVisualIdentity.imageryDirection}
                            onChange={(e) => updateBrandVisualIdentityField('imageryDirection', e.target.value)}
                            placeholder="Ex.: retratos contrastados, texturas, mockups, recortes..."
                        />
                        <textarea
                            className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                            value={brandVisualIdentity.layoutNotes}
                            onChange={(e) => updateBrandVisualIdentityField('layoutNotes', e.target.value)}
                            placeholder="Ex.: capas fortes, grid limpo, respiro, CTA final..."
                        />

                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Ações</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button variant="primary" className="w-full" onClick={handleSaveBrandIdentity} isLoading={isSavingBrandIdentity}>
                                    <Save size={14} className="mr-2" /> Salvar identidade
                                </Button>
                                <Button variant="secondary" className="w-full" onClick={handleApplyBrandIdentityToCurrentCarousel}>
                                    <Palette size={14} className="mr-2" /> Aplicar ao carrossel
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Toda nova geração de conteúdo passa a considerar essa identidade visual como grounding adicional junto do manifesto e das linhas editoriais.
                            </p>
                        </div>
                    </div>
                </div>}
            </Card>
        </div>
        );
    };

    const renderEditorialLines = () => (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Linhas Editoriais</h2>
                    <p className="text-gray-400">Tela dedicada para gerar, editar, excluir e selecionar as linhas que vão alimentar o calendário.</p>
                </div>
                <Button variant="ghost" onClick={() => setCurrentStep(0)} className="text-xs self-start lg:self-auto">
                    <ChevronLeft size={14} className="mr-1" /> Voltar para a fonte
                </Button>
            </div>

            <div className="flex justify-center">
                <div className="inline-flex rounded-2xl border border-[#222] bg-[#0A0A0A] p-1">
                    <button
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${editorialSourceMode === 'manifesto' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setEditorialSourceMode('manifesto')}
                    >
                        <div className="flex items-center gap-2">
                            <UploadCloud size={16} />
                            A partir do manifesto
                        </div>
                    </button>
                    <button
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${editorialSourceMode === 'blank' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setEditorialSourceMode('blank')}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} />
                            Do zero
                        </div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="border-border bg-[#0A0A0A] p-6 lg:col-span-1">
                    {editorialSourceMode === 'manifesto' ? (
                        <>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <UploadCloud size={18} className="text-primary" /> Manifesto da Marca
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Importe o manifesto em PDF ou DOCX para gerar linhas editoriais a partir do material fundador.</p>
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary transition-colors relative">
                                <input 
                                    type="file" 
                                    id="manifesto-upload" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.docx"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="manifesto-upload" className="cursor-pointer flex flex-col items-center">
                                    <UploadCloud size={32} className="text-gray-500 mb-3" />
                                    <span className="text-sm text-gray-300 font-medium">Clique para fazer upload</span>
                                    <span className="text-xs text-gray-500 mt-1">PDF ou DOCX (Word)</span>
                                </label>
                            </div>
                            {manifestoFile && (
                                <div className="mt-4 p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                    <span className="text-sm text-white truncate">{manifestoFile.name}</span>
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                </div>
                            )}
                            <div className="mt-4 p-4 rounded-xl bg-[#111] border border-[#1f1f1f]">
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Contexto lido</p>
                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-6">
                                    {manifestoContent || 'O manifesto carregado aparece aqui como contexto-base para a IA.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles size={18} className="text-primary" /> Briefing de Marca
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Se ainda nao existe manifesto, descreva a marca do zero e use a IA para sugerir as linhas editoriais.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Marca</label>
                                    <input
                                        className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                        value={editorialSeed.brandName}
                                        onChange={(e) => updateEditorialSeed('brandName', e.target.value)}
                                        placeholder="Nome da marca ou projeto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Posicionamento</label>
                                    <textarea
                                        className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-none"
                                        value={editorialSeed.positioning}
                                        onChange={(e) => updateEditorialSeed('positioning', e.target.value)}
                                        placeholder="O que a marca acredita, promete e quer ocupar na mente das pessoas"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Publico</label>
                                        <input
                                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                            value={editorialSeed.audience}
                                            onChange={(e) => updateEditorialSeed('audience', e.target.value)}
                                            placeholder="Quem voce quer atingir"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Tom de voz</label>
                                        <input
                                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                            value={editorialSeed.voice}
                                            onChange={(e) => updateEditorialSeed('voice', e.target.value)}
                                            placeholder="Ex.: direto, sofisticado, educativo"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Temas e territorios</label>
                                    <textarea
                                        className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-none"
                                        value={editorialSeed.themes}
                                        onChange={(e) => updateEditorialSeed('themes', e.target.value)}
                                        placeholder="Assuntos que a marca quer dominar, defender ou explorar"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Objetivo</label>
                                        <input
                                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                            value={editorialSeed.objective}
                                            onChange={(e) => updateEditorialSeed('objective', e.target.value)}
                                            placeholder="Autoridade, vendas, comunidade..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Referencias e restricoes</label>
                                        <input
                                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                            value={editorialSeed.references}
                                            onChange={(e) => updateEditorialSeed('references', e.target.value)}
                                            placeholder="Estilos, referencias, limites"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border bg-[#0A0A0A] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <List size={18} className="text-blue-500" /> Workspace Editorial
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Faça o CRUD completo das linhas e defina quais entram no calendário.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {isLoadingEditorialWorkspace && (
                                    <Badge variant="secondary">Carregando base</Badge>
                                )}
                                {!isLoadingEditorialWorkspace && hasUnsavedEditorialChanges && (
                                    <Badge variant="secondary">Alterações pendentes</Badge>
                                )}
                                {!isLoadingEditorialWorkspace && !hasUnsavedEditorialChanges && editorialLines.length > 0 && (
                                    <Badge variant="secondary">Sincronizado</Badge>
                                )}
                                {editorialLines.length > 0 && (
                                    <Badge variant="secondary">{selectedEditorialLines.length}/{editorialLines.length} selecionadas</Badge>
                                )}
                            </div>
                        </div>

                        {editorialError && (
                            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {editorialError}
                            </div>
                        )}

                        {editorialNotice && (
                            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                {editorialNotice}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Prompt do agente criador</label>
                            <textarea 
                                className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                                value={getEditorialPrompt()}
                                onChange={(e) => editorialSourceMode === 'manifesto' ? setManifestoEditorialPrompt(e.target.value) : setBlankEditorialPrompt(e.target.value)}
                                placeholder="Ajuste o prompt para a IA sugerir as linhas editoriais"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Provedor textual: <span className={textAiConfigured ? 'text-emerald-400' : 'text-amber-300'}>{textAiConfigured ? textAiModel : 'Groq não configurado'}</span>
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                <Button
                                    variant="primary"
                                    className="text-xs"
                                    onClick={handleSaveEditorialLines}
                                    isLoading={isSavingEditorialWorkspace}
                                    disabled={isLoadingEditorialWorkspace || (editorialLines.length === 0 && !hasUnsavedEditorialChanges)}
                                >
                                    <Save size={14} className="mr-2" /> Salvar linhas
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={handleSaveEditorialPrompt}
                                    isLoading={isSavingEditorialPrompt}
                                >
                                    <Save size={14} className="mr-2" /> Salvar prompt
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={handleResetEditorialPrompt}
                                    isLoading={isSavingEditorialPrompt}
                                >
                                    <RefreshCw size={14} className="mr-2" /> Resetar prompt
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="text-xs"
                                    onClick={handleGenerateEditorialLines}
                                    isLoading={isLoading}
                                    disabled={!textAiConfigured || !getEditorialSourceText()}
                                >
                                    <RefreshCw size={14} className="mr-2" /> {editorialLines.length > 0 ? 'Regenerar Sugestoes' : 'Gerar Sugestoes com IA'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={() => addEditorialLine('')}
                                >
                                    <Plus size={14} className="mr-2" /> Adicionar linha manual
                                </Button>
                            </div>
                        </div>

                        {isLoadingEditorialWorkspace ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                Carregando linhas editoriais salvas...
                            </div>
                        ) : editorialLines.length > 0 ? (
                            <div className="space-y-3">
                                {editorialLines.map((line, idx) => (
                                    <div key={line.id} className={`p-4 rounded-xl border transition-colors ${line.selected ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEditorialLine(line.id)}
                                                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${line.selected ? 'border-primary bg-primary text-black' : 'border-gray-600 text-transparent'}`}
                                                    aria-label={`Selecionar linha ${idx + 1}`}
                                                >
                                                    <CheckCircle2 size={12} />
                                                </button>
                                                <div>
                                                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500">Linha {idx + 1}</span>
                                                    <p className="text-xs text-gray-500 mt-1">{line.source === 'ai' ? 'Gerada por IA' : 'Criada manualmente'}</p>
                                                </div>
                                            </div>
                                            <button
                                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                onClick={() => removeEditorialLine(line.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full h-24 bg-[#111] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none resize-none"
                                            value={line.content}
                                            onChange={(e) => updateEditorialLine(line.id, e.target.value)}
                                            placeholder="Escreva ou ajuste a linha editorial"
                                        />
                                    </div>
                                ))}
                                <div className="rounded-2xl border border-[#222] bg-[#111] p-5">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Calendário a partir das linhas selecionadas</h3>
                                            <p className="text-xs text-gray-500 mt-1">Escolha exatamente quais linhas editoriais quer trabalhar no calendário. Só as ativas entram na geração.</p>
                                        </div>
                                        <Badge variant="secondary">{selectedEditorialLines.length} ativas</Badge>
                                    </div>

                                    {selectedEditorialLines.length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {selectedEditorialLines.map((line) => (
                                                <button
                                                    key={line.id}
                                                    type="button"
                                                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
                                                    onClick={() => toggleEditorialLine(line.id)}
                                                >
                                                    {line.content}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {calendarError && (
                                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                            {calendarError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Data inicial</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                                value={calendarRange.startDate}
                                                onChange={(e) => updateCalendarRange('startDate', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Data final</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                                value={calendarRange.endDate}
                                                onChange={(e) => updateCalendarRange('endDate', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        variant="primary" 
                                        className="w-full mt-4"
                                        onClick={handleGenerateCalendar}
                                        isLoading={isLoading}
                                        disabled={selectedEditorialLines.length === 0}
                                    >
                                        <Calendar size={16} className="mr-2" /> Criar Calendario de Conteudo
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {editorialSourceMode === 'manifesto'
                                    ? (manifestoContent ? 'Revise o prompt ou clique em "Adicionar linha manual" para começar.' : 'Faça o upload do manifesto ou troque para o modo "Do zero".')
                                    : (getEditorialSourceText() ? 'Clique em "Gerar Sugestoes com IA" ou comece a escrever manualmente.' : 'Preencha um briefing de marca ou comece adicionando uma linha manual.')}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );

    const renderCalendar = () => {
        const focusedDateCandidate = new Date(`${calendarFocusedDayKey}T00:00:00`);
        const focusedDate = Number.isNaN(focusedDateCandidate.getTime()) ? calendarViewStart : focusedDateCandidate;
        const visibleSelectionCount = selectedCalendarItems.length;
        const maxVisibleItemsPerDay = calendarViewMode === 'monthly' ? 2 : calendarViewMode === 'weekly' ? 4 : 8;
        const dailyCalendarItems = getCalendarItemsForDate(focusedDate);

        return (
        <div className="max-w-[1480px] mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 h-full flex flex-col">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(143,67,246,0.18),_transparent_35%),linear-gradient(180deg,_rgba(17,17,17,0.95),_rgba(10,10,10,0.98))] p-6 lg:p-8">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-primary/80 mb-3">Brand[OS] Calendar Systems</p>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white">Calendário Editorial</h2>
                        <p className="text-sm text-gray-400 mt-3 max-w-3xl">
                            Experiência inspirada em agenda profissional para revisar a pauta por dia, aprovar cards em lote e
                            seguir para criação de conteúdo com mais controle.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant={isInstagramConnected ? "ghost" : "secondary"}
                            onClick={handleConnectInstagram}
                            className={isInstagramConnected ? "text-emerald-400 hover:text-emerald-300" : ""}
                        >
                            <Instagram size={18} className="mr-2" />
                            {isInstagramConnected ? (instagramAccountLabel || 'Instagram Conectado') : 'Conectar Instagram'}
                        </Button>
                        {renderCalendarCreateButtons(focusedDate)}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Cards</p>
                        <p className="text-2xl font-bold text-white">{contentCalendar.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Aprovados</p>
                        <p className="text-2xl font-bold text-emerald-400">{approvedCalendarCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Agendados</p>
                        <p className="text-2xl font-bold text-sky-300">{contentCalendar.filter((item) => item.status === 'Scheduled').length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Linhas ativas</p>
                        <p className="text-2xl font-bold text-white">{selectedEditorialLines.length}</p>
                    </div>
                </div>
            </div>

            {visibleSelectionCount > 0 && (
                <div className="sticky top-4 z-20 rounded-2xl border border-primary/30 bg-[#111]/95 backdrop-blur px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-white">{visibleSelectionCount} card(s) selecionados</p>
                        <p className="text-xs text-gray-500 mt-1">Aprove em lote ou limpe a seleção sem perder o contexto do calendário.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" className="text-xs" onClick={() => handleApprovePosts(selectedCalendarItems.map((item) => item.id))}>
                            <CheckCircle2 size={14} className="mr-2" /> Aprovar selecionados
                        </Button>
                        <Button variant="primary" className="text-xs" onClick={() => handleApprovePosts(selectedCalendarItems.map((item) => item.id), 'production')}>
                            <BrainCircuit size={14} className="mr-2" /> Aprovar para criação
                        </Button>
                        <Button variant="ghost" className="text-xs" onClick={clearCalendarSelection}>
                            Limpar seleção
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-border bg-[#0A0A0A] p-6">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Base ativa</p>
                                <p className="text-sm text-white">{manifestoName || 'Manifesto atual da marca'}</p>
                                <p className="text-xs text-gray-500 mt-1">{selectedEditorialLines.length} linhas editoriais selecionadas alimentando este calendário.</p>
                                {isLoadingCalendarWorkspace && (
                                    <p className="text-xs text-primary mt-2">Carregando calendário salvo desta base...</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-2xl border border-[#222] bg-[#111] p-1">
                                    <button
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarViewMode === 'monthly' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setCalendarViewMode('monthly')}
                                    >
                                        Mensal
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarViewMode === 'weekly' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => setCalendarViewMode('weekly')}
                                    >
                                        Semanal
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarViewMode === 'daily' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                                        onClick={() => {
                                            setCalendarViewMode('daily');
                                            setCalendarWorkspaceTab('calendar');
                                            setCalendarViewDate(focusedDate);
                                        }}
                                    >
                                        Dia
                                    </button>
                                </div>
                                <Button variant="ghost" className="text-xs" onClick={() => {
                                    const today = new Date();
                                    setCalendarViewDate(today);
                                    setCalendarFocusedDayKey(formatDateInput(today));
                                }}>
                                    Hoje
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 rounded-2xl border border-white/10 bg-[#111] p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button variant="ghost" className="text-xs" onClick={() => setCalendarViewDate(
                                    calendarViewMode === 'monthly'
                                        ? startOfMonth(addDays(calendarViewDate, -31))
                                        : calendarViewMode === 'weekly'
                                            ? addDays(calendarViewDate, -7)
                                            : addDays(calendarViewDate, -1)
                                )}>
                                    <ChevronLeft size={14} className="mr-1" /> {calendarViewMode === 'monthly' ? 'Mês anterior' : calendarViewMode === 'weekly' ? 'Semana anterior' : 'Dia anterior'}
                                </Button>
                                <div className="px-4 py-2 rounded-xl border border-[#222] bg-black/30 text-sm text-white min-w-44 text-center">
                                    {calendarViewMode === 'monthly'
                                        ? formatCalendarLabel(calendarViewDate)
                                        : calendarViewMode === 'weekly'
                                            ? `${formatDateInput(calendarViewStart)} → ${formatDateInput(calendarViewEnd)}`
                                            : formatDayLabel(focusedDate)}
                                </div>
                                <Button variant="ghost" className="text-xs" onClick={() => setCalendarViewDate(
                                    calendarViewMode === 'monthly'
                                        ? startOfMonth(addDays(calendarViewDate, 31))
                                        : calendarViewMode === 'weekly'
                                            ? addDays(calendarViewDate, 7)
                                            : addDays(calendarViewDate, 1)
                                )}>
                                    {calendarViewMode === 'monthly' ? 'Próximo mês' : calendarViewMode === 'weekly' ? 'Próxima semana' : 'Próximo dia'} <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" className="text-xs" onClick={() => setSelectedCalendarPostIds(filteredCalendarItems.map((item) => item.id))} disabled={filteredCalendarItems.length === 0}>
                                    Selecionar tudo visível
                                </Button>
                                <Button variant="ghost" className="text-xs" onClick={() => handleApprovePosts(filteredCalendarItems.map((item) => item.id), 'production')} disabled={filteredCalendarItems.length === 0}>
                                    Aprovar tudo visível
                                </Button>
                            </div>
                        </div>

                        <div className="inline-flex flex-wrap rounded-2xl border border-[#222] bg-[#111] p-1 w-max">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarWorkspaceTab === 'calendar' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setCalendarWorkspaceTab('calendar')}
                            >
                                Calendário
                            </button>
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarWorkspaceTab === 'agenda' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setCalendarWorkspaceTab('agenda')}
                            >
                                Agenda do Dia
                            </button>
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarWorkspaceTab === 'agent' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setCalendarWorkspaceTab('agent')}
                            >
                                Agente IA
                            </button>
                        </div>
                    </div>

                    {calendarError && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {calendarError}
                        </div>
                    )}

                    {calendarNotice && (
                        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            {calendarNotice}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                className="w-full bg-[#141414] border border-[#222] rounded-xl py-3 pl-10 pr-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                                value={calendarSearchQuery}
                                onChange={(e) => setCalendarSearchQuery(e.target.value)}
                                placeholder="Buscar por tema, formato ou linha"
                            />
                        </div>
                        <select
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={calendarFormatFilter}
                            onChange={(e) => setCalendarFormatFilter(e.target.value)}
                        >
                            <option value="all">Todos os formatos</option>
                            {availableCalendarFormats.map((format) => (
                                <option key={format} value={format}>{format}</option>
                            ))}
                        </select>
                        <select
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={calendarEditorialLineFilter}
                            onChange={(e) => setCalendarEditorialLineFilter(e.target.value)}
                        >
                            <option value="all">Todas as linhas editoriais</option>
                            {availableCalendarEditorialLines.map((line) => (
                                <option key={line} value={line}>{line}</option>
                            ))}
                        </select>
                        <select
                            className="w-full bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-gray-200 focus:border-primary focus:outline-none"
                            value={calendarStatusFilter}
                            onChange={(e) => setCalendarStatusFilter(e.target.value as 'all' | CalendarPostStatus)}
                        >
                            <option value="all">Todos os status de publicação</option>
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Published">Published</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {availableCalendarFormats.map((format) => {
                            const color = getCalendarFormatColorClasses(format);
                            return (
                                <span key={format} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${color.surface}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${color.pill}`} />
                                    <span className={color.accent}>{format}</span>
                                </span>
                            );
                        })}
                    </div>

                    {calendarWorkspaceTab === 'calendar' && (
                        <div className="mb-6 rounded-[24px] border border-primary/20 bg-primary/5 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary/80 mb-2">Dia em foco</p>
                                    <h3 className="text-lg font-bold text-white">{formatDayLabel(focusedDate)}</h3>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {dailyCalendarItems.length} card(s) neste dia. Use este bloco para criar rápido sem poluir a grade mensal.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {renderCalendarCreateButtons(focusedDate, true)}
                                    <Button
                                        variant="ghost"
                                        className="text-xs"
                                        onClick={() => {
                                            setCalendarWorkspaceTab('agenda');
                                            setCalendarViewDate(focusedDate);
                                        }}
                                    >
                                        Abrir agenda do dia
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {calendarWorkspaceTab === 'calendar' && (
                        contentCalendar.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p>Nenhum conteúdo no calendário.</p>
                                <Button variant="ghost" className="mt-4" onClick={handleBack}>Voltar para Manifesto</Button>
                            </div>
                        ) : calendarViewMode === 'daily' ? (
                            <div className="space-y-4">
                                <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary/80 mb-2">Visão diária</p>
                                            <h3 className="text-2xl font-bold text-white">{formatDayLabel(focusedDate)}</h3>
                                            <p className="text-sm text-gray-400 mt-2">{dailyCalendarItems.length} card(s) neste dia.</p>
                                        </div>
                                        {renderCalendarCreateButtons(focusedDate, true)}
                                    </div>
                                </div>

                                {dailyCalendarItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-[#111] p-6 text-sm text-gray-500">
                                        Nenhum card neste dia. Use o botão acima para inserir um novo conteúdo.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {dailyCalendarItems.map((item) => (
                                            <div key={item.id} className="rounded-[24px] border border-[#222] bg-[#111] p-5">
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-[10px] uppercase tracking-[0.16em] font-bold ${getCalendarFormatColorClasses(item.format).accent}`}>{item.format}</span>
                                                            <span className="text-[10px] text-gray-500">{extractTimeFromScheduledAt(item.scheduledAt)}</span>
                                                            <span className={`text-[10px] font-semibold ${item.approvalStatus === 'Approved' ? 'text-emerald-300' : 'text-amber-300'}`}>
                                                                {item.approvalStatus === 'Approved' ? 'Aprovado' : 'Em revisão'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-white mt-3">{item.theme}</h4>
                                                        <p className="text-xs text-primary mt-2">{item.editorialLine}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openExistingPostModal(item)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeletePost(item.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400">{item.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:grid grid-cols-7 gap-3 mb-3">
                                    {Array.from({ length: 7 }, (_, index) => addDays(calendarViewStart, index)).map((date) => (
                                        <div key={date.toISOString()} className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                                            {formatWeekdayLabel(date)}
                                        </div>
                                    ))}
                                </div>

                                <div className="hidden md:grid grid-cols-7 gap-3">
                                    {calendarDays.map((date) => {
                                        const items = getCalendarItemsForDate(date);
                                        const isCurrentMonth = date.getMonth() === calendarViewDate.getMonth();
                                        const isFocusedDay = formatDateInput(date) === calendarFocusedDayKey;
                                        const visibleItems = items.slice(0, maxVisibleItemsPerDay);

                                        return (
                                        <div
                                            key={date.toISOString()}
                                            className={`rounded-[24px] border p-3 transition-all ${
                                                isFocusedDay
                                                    ? 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_rgba(143,67,246,0.18)]'
                                                    : isCurrentMonth
                                                        ? 'border-[#222] bg-[#111]'
                                                        : 'border-[#171717] bg-[#0d0d0d]'
                                            } ${draggingCalendarDayKey === formatDateInput(date) ? 'ring-2 ring-primary/40' : ''} ${calendarViewMode === 'weekly' ? 'min-h-[300px]' : 'min-h-[200px]'}`}
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                setDraggingCalendarDayKey(formatDateInput(date));
                                            }}
                                            onDragLeave={() => setDraggingCalendarDayKey((current) => current === formatDateInput(date) ? null : current)}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                                const postId = event.dataTransfer.getData('text/plain') || draggingCalendarPostId;
                                                if (postId) {
                                                    moveCalendarPostToDate(postId, date);
                                                }
                                                setDraggingCalendarPostId(null);
                                                setDraggingCalendarDayKey(null);
                                            }}
                                        >
                                                <div className="flex items-start justify-between mb-3 gap-2">
                                                    <button
                                                        className="text-left"
                                                        onClick={() => {
                                                            setCalendarFocusedDayKey(formatDateInput(date));
                                                            setCalendarViewDate(date);
                                                        }}
                                                    >
                                                        <p className={`text-sm font-semibold ${isCurrentMonth ? 'text-white' : 'text-gray-600'}`}>{date.getDate()}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1">{items.length} card(s)</p>
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {isFocusedDay && (
                                                            <button
                                                                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary hover:bg-primary/15"
                                                                onClick={() => {
                                                                    void openNewAiCardModal(date);
                                                                }}
                                                            >
                                                                IA
                                                            </button>
                                                        )}
                                                        <button
                                                            className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                                                                isFocusedDay
                                                                    ? 'border-white/10 text-gray-400 hover:text-white'
                                                                    : 'border-white/8 bg-black/20 text-gray-500 hover:text-white'
                                                            }`}
                                                            onClick={() => openNewPostModal(date)}
                                                        >
                                                            {isFocusedDay ? '+ card' : '+'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {visibleItems.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            draggable
                                                            onDragStart={(event) => {
                                                                event.dataTransfer.setData('text/plain', item.id);
                                                                setDraggingCalendarPostId(item.id);
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggingCalendarPostId(null);
                                                                setDraggingCalendarDayKey(null);
                                                            }}
                                                            className={`rounded-xl border p-2 transition-colors ${item.approvalStatus === 'Approved' ? 'border-emerald-500/20 bg-emerald-500/8' : `${getCalendarFormatColorClasses(item.format).surface} hover:border-primary/30`}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="min-w-0 text-left flex-1"
                                                                    onClick={() => {
                                                                        setAgendaPreviewPostId(item.id);
                                                                        openExistingPostModal(item);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${getCalendarFormatColorClasses(item.format).accent}`}>{item.format}</span>
                                                                        <span className="text-[10px] text-gray-500">{extractTimeFromScheduledAt(item.scheduledAt)}</span>
                                                                    </div>
                                                                    <p className="text-xs font-semibold text-white truncate mt-1">{item.theme}</p>
                                                                    {isFocusedDay ? (
                                                                        <p className="text-[10px] text-gray-500 truncate mt-1">{item.editorialLine}</p>
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-600 truncate mt-1">{item.approvalStatus === 'Approved' ? 'Aprovado para criação' : 'Em revisão'}</p>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`mt-0.5 rounded-full p-1.5 transition-colors ${item.approvalStatus === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        handleApprovePosts([item.id], 'production');
                                                                    }}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {items.length > maxVisibleItemsPerDay && (
                                                        <button
                                                            type="button"
                                                            className="text-[11px] text-primary px-1"
                                                            onClick={() => {
                                                                setCalendarFocusedDayKey(formatDateInput(date));
                                                                setCalendarWorkspaceTab('agenda');
                                                            }}
                                                        >
                                                            +{items.length - maxVisibleItemsPerDay} card(s) neste dia
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="md:hidden space-y-4">
                                    {calendarDays.map((date) => {
                                        const items = getCalendarItemsForDate(date);

                                        return (
                                            <div key={date.toISOString()} className={`rounded-2xl border p-4 ${formatDateInput(date) === calendarFocusedDayKey ? 'border-primary/30 bg-primary/5' : 'border-[#222] bg-[#111]'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <button type="button" className="text-left" onClick={() => setCalendarFocusedDayKey(formatDateInput(date))}>
                                                        <p className="text-sm font-semibold text-white">{formatDayLabel(date)}</p>
                                                        <p className="text-xs text-gray-500">{items.length} card(s)</p>
                                                    </button>
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <Button variant="secondary" className="text-xs" onClick={() => {
                                                            void openNewAiCardModal(date);
                                                        }}>
                                                            <BrainCircuit size={14} className="mr-1" /> IA
                                                        </Button>
                                                        <Button variant="ghost" className="text-xs" onClick={() => openNewPostModal(date)}>
                                                            <Plus size={14} className="mr-1" /> Manual
                                                        </Button>
                                                    </div>
                                                </div>
                                                {items.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-3 text-xs text-gray-500">
                                                        Dia livre. Clique em card para inserir conteúdo.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {items.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            className={`w-full rounded-xl border p-3 text-left ${getCalendarFormatColorClasses(item.format).surface}`}
                                                            onClick={() => openExistingPostModal(item)}
                                                        >
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${getCalendarFormatColorClasses(item.format).accent}`}>{item.format}</span>
                                                                <span className={`text-[10px] font-semibold ${item.approvalStatus === 'Approved' ? 'text-emerald-300' : 'text-gray-400'}`}>
                                                                    {item.approvalStatus === 'Approved' ? 'Aprovado' : 'Em revisão'}
                                                                </span>
                                                            </div>
                                                                <p className="text-[10px] text-primary/80 mb-1">{item.editorialLine}</p>
                                                                <p className="text-sm font-semibold text-white">{item.theme}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )
                    )}
                </Card>

                {calendarWorkspaceTab === 'agenda' && (
                    <Card className="border-border bg-[#0A0A0A] p-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Agenda do dia</p>
                                <h3 className="text-xl font-bold text-white">{formatDayLabel(focusedDate)}</h3>
                                <p className="text-sm text-gray-500 mt-1">{focusedCalendarItems.length} card(s) no recorte atual</p>
                            </div>
                            <Badge variant="secondary">{filteredCalendarItems.length} visíveis</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {renderCalendarCreateButtons(focusedDate, true)}
                            <Button variant="ghost" className="text-xs" onClick={() => setSelectedCalendarPostIds(focusedCalendarItems.map((item) => item.id))} disabled={focusedCalendarItems.length === 0}>
                                Selecionar dia
                            </Button>
                            <Button variant="ghost" className="text-xs" onClick={() => handleApprovePosts(focusedCalendarItems.map((item) => item.id), 'production')} disabled={focusedCalendarItems.length === 0}>
                                Aprovar dia
                            </Button>
                        </div>

                        {focusedCalendarItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#222] bg-[#111] p-5 text-sm text-gray-500">
                                Nenhum card neste dia para os filtros atuais. Clique no dia desejado no calendário ou adicione um novo card.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_360px] gap-4">
                                <div className="space-y-4 max-h-[760px] overflow-y-auto pr-1">
                                    {focusedCalendarItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`rounded-[24px] border p-4 cursor-pointer transition-colors ${
                                                agendaPreviewItem?.id === item.id
                                                    ? 'border-primary/30 bg-primary/5'
                                                    : selectedCalendarPostIds.includes(item.id)
                                                        ? 'border-primary/20 bg-primary/5'
                                                        : 'border-[#222] bg-[#111]'
                                            }`}
                                            onClick={() => setAgendaPreviewPostId(item.id)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCalendarPostIds.includes(item.id)}
                                                        onChange={() => toggleCalendarPostSelection(item.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-[10px] uppercase tracking-[0.16em] font-bold ${getCalendarFormatColorClasses(item.format).accent}`}>{item.format}</span>
                                                            <span className={`text-[10px] font-semibold ${item.approvalStatus === 'Approved' ? 'text-emerald-300' : 'text-amber-300'}`}>
                                                                {item.approvalStatus === 'Approved' ? 'Aprovado' : 'Em revisão'}
                                                            </span>
                                                            <span className={`text-[10px] font-semibold ${item.status === 'Published' ? 'text-primary' : item.status === 'Scheduled' ? 'text-sky-300' : 'text-gray-500'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-white mt-2 truncate">{item.theme}</h4>
                                                        <p className="text-xs text-primary mt-2 truncate">{item.editorialLine}</p>
                                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={(event) => { event.stopPropagation(); openExistingPostModal(item); }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={(event) => { event.stopPropagation(); handleDeletePost(item.id); }} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-1">Agendamento</p>
                                                    <p className="text-sm text-white">{item.scheduledAt ? extractTimeFromScheduledAt(item.scheduledAt) : 'Sem hora'}</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-1">Instagram</p>
                                                    <p className="text-sm text-white truncate">{item.instagramStatus}</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-1">Mover para</p>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary focus:outline-none"
                                                        value={extractDateFromScheduledAt(item.scheduledAt) || getCalendarDayKey(item.day)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onChange={(event) => {
                                                            const nextDate = event.target.value;
                                                            if (!nextDate) return;
                                                            moveCalendarPostToDate(item.id, new Date(`${nextDate}T00:00:00`));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <aside className="rounded-[24px] border border-white/10 bg-[#111] p-4 xl:sticky xl:top-4 h-max">
                                    {agendaPreviewItem ? (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary/80 mb-2">Preview resumido</p>
                                                <h4 className="text-xl font-bold text-white">{agendaPreviewItem.theme}</h4>
                                                <p className="text-xs text-primary mt-2">{agendaPreviewItem.editorialLine || 'Sem linha editorial'}</p>
                                            </div>

                                            {agendaPreviewItem.imageUrl && !agendaPreviewItem.imageUrl.startsWith('data:') ? (
                                                <div className="rounded-[20px] overflow-hidden border border-white/10 bg-black/20">
                                                    <img src={agendaPreviewItem.imageUrl} alt={agendaPreviewItem.theme} className="w-full h-44 object-cover" />
                                                </div>
                                            ) : agendaPreviewItem.imageUrl?.startsWith('data:') ? (
                                                <div className="rounded-[20px] border border-red-500/30 bg-red-500/5 h-44 flex flex-col items-center justify-center text-xs text-red-400 text-center px-6 gap-2">
                                                    <AlertTriangle size={18} />
                                                    <span>Imagem local (data URL) — não publicável no Instagram.<br/>Exporte o PNG na Etapa 8, hospede e cole a URL no card.</span>
                                                </div>
                                            ) : (
                                                <div className="rounded-[20px] border border-dashed border-white/10 bg-black/20 h-44 flex items-center justify-center text-xs text-gray-500 text-center px-6">
                                                    Sem imagem pública vinculada ao card.
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-1">Status</p>
                                                    <p className="text-sm text-white">{agendaPreviewItem.status}</p>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-1">Hora</p>
                                                    <p className="text-sm text-white">{agendaPreviewItem.scheduledAt ? extractTimeFromScheduledAt(agendaPreviewItem.scheduledAt) : 'Sem hora'}</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-2">Resumo da legenda</p>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    {agendaPreviewItem.description || 'Sem descrição preenchida para este card.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                <Button variant="ghost" className="w-full text-xs" onClick={() => openExistingPostModal(agendaPreviewItem)}>
                                                    <Edit size={12} className="mr-1" /> Editar card
                                                </Button>
                                                <Button variant={agendaPreviewItem.approvalStatus === 'Approved' ? 'primary' : 'secondary'} className="w-full text-xs" onClick={() => handleApprovePosts([agendaPreviewItem.id], 'production')}>
                                                    <CheckCircle2 size={14} className="mr-2" /> {agendaPreviewItem.approvalStatus === 'Approved' ? 'Aprovado para criação' : 'Aprovar para criação'}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="w-full text-xs"
                                                    onClick={() => handlePublishToInstagram(agendaPreviewItem)}
                                                    isLoading={isLoading}
                                                    disabled={
                                                        !agendaPreviewItem.scheduledAt ||
                                                        agendaPreviewItem.status === 'Published' ||
                                                        !agendaPreviewItem.imageUrl?.trim() ||
                                                        agendaPreviewItem.imageUrl.startsWith('data:')
                                                    }
                                                    title={
                                                        !agendaPreviewItem.imageUrl?.trim() ? 'Adicione uma URL pública de imagem no card.' :
                                                        agendaPreviewItem.imageUrl.startsWith('data:') ? 'Data URL não é aceita. Exporte o PNG (Etapa 8), hospede e cole a URL.' :
                                                        !agendaPreviewItem.scheduledAt ? 'Defina a data de postagem.' : undefined
                                                    }
                                                >
                                                    <Instagram size={14} className="mr-2" />
                                                    {agendaPreviewItem.status === 'Published' ? 'Publicado no Instagram' : 'Programar no Instagram'}
                                                </Button>
                                                {generatedPrompts[agendaPreviewItem.format] ? (
                                                    <div className="bg-black/50 p-3 rounded-2xl text-xs text-gray-300 font-mono">
                                                        {generatedPrompts[agendaPreviewItem.format]}
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" className="w-full text-xs" onClick={() => handleGeneratePrompt(agendaPreviewItem.format)}>
                                                        <Bot size={12} className="mr-1" /> Gerar Prompt para {agendaPreviewItem.format}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </aside>
                            </div>
                        )}
                    </Card>
                )}

                {calendarWorkspaceTab === 'agent' && (
                    <Card className="border-border bg-[#0A0A0A] p-6">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Agente do Calendário</h3>
                                <p className="text-sm text-gray-500 mt-1">Ajuste e salve o prompt responsável por estruturar a pauta sem comprimir a grade do calendário.</p>
                            </div>
                            <Badge variant="secondary">{calendarViewMode === 'monthly' ? 'Grid mensal' : calendarViewMode === 'weekly' ? 'Grade semanal' : 'Visão diária'}</Badge>
                        </div>

                        <textarea
                            className="w-full h-40 bg-[#141414] border border-[#222] rounded-xl p-4 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none"
                            value={calendarPrompt}
                            onChange={(e) => setCalendarPrompt(e.target.value)}
                            placeholder="Ajuste o prompt do agente responsável pelo calendário"
                        />
                        <div className="mt-4 flex gap-2">
                            <Button variant="ghost" className="text-xs" onClick={handleSaveCalendarPrompt} isLoading={isSavingCalendarPrompt}>
                                <Save size={14} className="mr-2" /> Salvar
                            </Button>
                            <Button variant="ghost" className="text-xs" onClick={handleResetCalendarPrompt} isLoading={isSavingCalendarPrompt}>
                                <RefreshCw size={14} className="mr-2" /> Resetar
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
            
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    <Button variant="ghost" onClick={handleBack}>
                        <ChevronLeft size={16} className="mr-2" /> Voltar
                    </Button>
                    <Button variant="primary" onClick={contentCalendar.length > 0 ? openApprovedProductionQueue : handleNext}>
                        {contentCalendar.length > 0 ? 'Continuar para Content Studio' : 'Continuar para Formato'} <ChevronRight size={16} className="ml-2" />
                    </Button>
                </div>

            {/* Edit Modal */}
            {isModalOpen && editingPost && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm"
                    onClick={closeCalendarPostModal}
                    aria-hidden="true"
                >
                    <div className="flex min-h-full items-start justify-center p-3 sm:p-4 lg:justify-end lg:p-6">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="calendar-modal-title"
                            className="w-full max-w-5xl lg:max-w-[760px] max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.45)] flex flex-col"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="sticky top-0 z-20 border-b border-white/10 bg-[#141414]/95 backdrop-blur px-4 py-4 sm:px-5 lg:px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-2">Editor de card</p>
                                        <h3 id="calendar-modal-title" className="text-lg sm:text-xl font-bold text-white">
                                            {editingPost.id ? 'Editar card' : calendarCardGenerationMode === 'ai' ? 'Novo card com IA' : 'Novo card manual'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Fluxo redesenhado para manter contexto, formulário e ação principal visíveis mesmo em telas menores.
                                        </p>
                                    </div>
                                    <button onClick={closeCalendarPostModal} aria-label="Fechar editor de card" className="shrink-0 rounded-full border border-white/10 bg-black/20 p-2 text-gray-500 hover:text-white">
                                        <X size={18} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
                                    <aside className="space-y-4 lg:sticky lg:top-0 self-start">
                                        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary/80 mb-2">Modo de criação</p>
                                                    <p className="text-sm text-white">
                                                        {calendarCardGenerationMode === 'ai'
                                                            ? 'A IA usa manifesto, linha editorial e data para sugerir o card.'
                                                            : 'Monte a base manualmente e chame a IA só quando precisar acelerar.'}
                                                    </p>
                                                </div>
                                                <div className="inline-flex w-full rounded-2xl border border-[#222] bg-[#111] p-1">
                                                    <button
                                                        type="button"
                                                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarCardGenerationMode === 'ai' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                                                        onClick={() => setCalendarCardGenerationMode('ai')}
                                                    >
                                                        Com IA
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${calendarCardGenerationMode === 'manual' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                                        onClick={() => setCalendarCardGenerationMode('manual')}
                                                    >
                                                        Do zero
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`rounded-[24px] border p-4 ${getCalendarFormatColorClasses(editingPost.format).surface}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${getCalendarFormatColorClasses(editingPost.format).accent}`}>{editingPost.format || 'Formato livre'}</span>
                                                <span className="text-[10px] text-gray-500">{extractDateFromScheduledAt(editingPost.scheduledAt) || getCalendarDayKey(editingPost.day)}</span>
                                                <span className="text-[10px] text-gray-500">{extractTimeFromScheduledAt(editingPost.scheduledAt)}</span>
                                            </div>
                                            <p className="text-sm text-white font-semibold mt-3">{editingPost.theme || 'Defina um tema para este card'}</p>
                                            <p className="text-xs text-primary/80 mt-2">{editingPost.editorialLine || 'Sem linha editorial vinculada'}</p>
                                            <p className="text-xs text-gray-500 mt-3">
                                                Sugestões usam manifesto da marca, linha editorial selecionada e a data do card como contexto.
                                            </p>
                                        </div>

                                        <div className="rounded-[24px] border border-white/10 bg-[#101010] p-4">
                                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400 mb-3">Ações rápidas</p>
                                            <div className="grid gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="w-full text-xs"
                                                    onClick={() => {
                                                        setCalendarCardGenerationMode('ai');
                                                        void handleGenerateCalendarCardSuggestion();
                                                    }}
                                                    isLoading={isGeneratingCalendarCardSuggestion}
                                                >
                                                    <BrainCircuit size={14} className="mr-2" />
                                                    {calendarCardGenerationMode === 'ai' ? 'Atualizar com IA' : 'Gerar sugestão com IA'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-xs"
                                                    onClick={() => setEditingPost({
                                                        ...editingPost,
                                                        theme: '',
                                                        description: '',
                                                    })}
                                                >
                                                    Limpar texto
                                                </Button>
                                            </div>
                                        </div>
                                    </aside>

                                    <div className="space-y-4">
                                        <section className="rounded-[24px] border border-white/10 bg-[#111] p-4 sm:p-5">
                                            <div className="flex items-center justify-between gap-3 mb-4">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Planejamento</p>
                                                    <p className="text-xs text-gray-500 mt-1">Defina data, formato e linha editorial antes de lapidar a copy.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={extractDateFromScheduledAt(editingPost.scheduledAt) || (parseCalendarItemDate(editingPost.day) ? formatDateInput(parseCalendarItemDate(editingPost.day) as Date) : '')}
                                                        onChange={e => {
                                                            const nextDate = e.target.value;
                                                            setEditingPost({
                                                                ...editingPost,
                                                                day: nextDate ? formatDayLabel(new Date(`${nextDate}T00:00:00`)) : editingPost.day,
                                                                scheduledAt: nextDate ? buildScheduledAt(nextDate, extractTimeFromScheduledAt(editingPost.scheduledAt)) : editingPost.scheduledAt,
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora de postagem</label>
                                                    <input 
                                                        type="time" 
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={extractTimeFromScheduledAt(editingPost.scheduledAt)}
                                                        onChange={e => {
                                                            const nextDate = extractDateFromScheduledAt(editingPost.scheduledAt) || formatDateInput(new Date());
                                                            setEditingPost({
                                                                ...editingPost,
                                                                scheduledAt: buildScheduledAt(nextDate, e.target.value),
                                                                instagramStatus: 'Ready',
                                                            });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Formato</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={editingPost.format}
                                                        onChange={e => setEditingPost({...editingPost, format: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Linha editorial</label>
                                                    <select
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={editingPost.editorialLine}
                                                        onChange={e => setEditingPost({...editingPost, editorialLine: e.target.value})}
                                                    >
                                                        <option value="">Selecione uma linha</option>
                                                        {selectedEditorialLines.map((line) => (
                                                            <option key={line.id} value={line.content}>{line.content}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-[24px] border border-white/10 bg-[#111] p-4 sm:p-5">
                                            <div className="mb-4">
                                                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Conteúdo do card</p>
                                                <p className="text-xs text-gray-500 mt-1">Tema primeiro, legenda depois. Assim o fluxo de criação fica mais rápido e previsível.</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tema</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={editingPost.theme}
                                                        onChange={e => setEditingPost({...editingPost, theme: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição / Legenda</label>
                                                    <textarea 
                                                        className="w-full min-h-[200px] bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none resize-y"
                                                        value={editingPost.description}
                                                        onChange={e => setEditingPost({...editingPost, description: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">URL pública da imagem</label>
                                                    <input
                                                        type="url"
                                                        className={`w-full bg-[#0A0A0A] border rounded-lg p-3 text-white focus:outline-none ${editingPost.imageUrl?.startsWith('data:') ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-primary'}`}
                                                        value={editingPost.imageUrl || ''}
                                                        onChange={e => setEditingPost({...editingPost, imageUrl: e.target.value, instagramStatus: e.target.value && !e.target.value.startsWith('data:') ? 'Ready' : 'Not Synced'})}
                                                        placeholder="https://..."
                                                    />
                                                    {editingPost.imageUrl?.startsWith('data:') ? (
                                                        <p className="text-xs text-red-400 mt-1.5">⚠ Data URL não é aceita pelo Instagram. Exporte o PNG (Etapa 8), hospede em CDN ou storage público e cole a URL aqui.</p>
                                                    ) : !editingPost.imageUrl?.trim() ? (
                                                        <p className="text-xs text-gray-500 mt-1.5">Instagram exige URL pública acessível. Exporte o PNG na Etapa 8 → hospede → cole a URL.</p>
                                                    ) : (
                                                        <p className="text-xs text-emerald-500 mt-1.5">✓ URL definida — card pronto para publicação.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-[24px] border border-white/10 bg-[#111] p-4 sm:p-5">
                                            <div className="mb-4">
                                                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Operação</p>
                                                <p className="text-xs text-gray-500 mt-1">Estado do card e status editorial em um bloco separado para evitar erro operacional.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status do card</label>
                                                    <select
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={editingPost.status || 'Draft'}
                                                        onChange={e => setEditingPost({...editingPost, status: e.target.value as CalendarPostStatus})}
                                                    >
                                                        <option value="Draft">Draft</option>
                                                        <option value="Scheduled">Scheduled</option>
                                                        <option value="Published">Published</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aprovação editorial</label>
                                                    <select
                                                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                        value={editingPost.approvalStatus || 'Needs Review'}
                                                        onChange={e => setEditingPost({...editingPost, approvalStatus: e.target.value as CalendarApprovalStatus})}
                                                    >
                                                        <option value="Needs Review">Em revisão</option>
                                                        <option value="Approved">Aprovado para criação</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[#141414]/95 backdrop-blur px-4 py-4 sm:px-5 lg:px-6">
                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-gray-500">
                                        Ação principal fixa no rodapé para continuar acessível durante toda a edição.
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button variant="ghost" onClick={closeCalendarPostModal} className="w-full sm:w-auto">Cancelar</Button>
                                        <Button variant="primary" onClick={handleSavePost} className="w-full sm:min-w-[160px]">Salvar card</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        );
    };

    const renderAssetSelection = () => {
        const ASSETS = [
            { id: 'Carousel', label: 'Carrossel', icon: Layers, desc: 'Estrutura em slides com base pronta para edição profissional em HTML/CSS.' },
            { id: 'Ads', label: 'Ads Criativo', icon: Zap, desc: 'Foco em conversão e clique.' },
            { id: 'Post', label: 'Post Único', icon: StickyNote, desc: 'Mensagem direta e visual.' },
            { id: 'Slide', label: 'Slide Deck', icon: Monitor, desc: 'Apresentação corporativa.' }
        ];
        const queueItems = activeProductionItems;
        const recommendedAsset = queueItems[0] ? resolveAssetFromCalendarFormat(queueItems[0].format) : selectedAsset;
        const sourceCards = [
            {
                id: 'planned' as ContentStudioSourceMode,
                title: 'Planejado no calendário',
                description: contentCalendar.length > 0
                    ? 'Use cards já planejados no calendário como briefing principal de criação. Cards aprovados seguem como recomendação.'
                    : 'Crie cards no calendário para usar esta origem.',
                badge: approvedCalendarItems.length > 0
                    ? `${approvedCalendarItems.length} aprovado(s) / ${contentCalendar.length} planejado(s)`
                    : `${contentCalendar.length} planejado(s)`,
                disabled: contentCalendar.length === 0,
            },
            {
                id: 'knowledge' as ContentStudioSourceMode,
                title: 'Ingestão de conhecimento',
                description: 'Crie a partir de artigos, livros, YouTube, vídeos, PDFs, DOCX e anotações.',
                badge: activeSource,
                disabled: false,
            },
            {
                id: 'title' as ContentStudioSourceMode,
                title: 'Título ou ideia do zero',
                description: 'Digite um título, direção criativa e deixe a IA desenvolver o conteúdo.',
                badge: contentStudioTitle.trim() ? 'Título preenchido' : 'Começar do zero',
                disabled: false,
            },
        ];

        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-2">Content Studio</h2>
                    <p className="text-gray-400">
                        Escolha primeiro a origem do conteúdo e depois o formato de saída. O carrossel será o formato-base desta wave,
                        com foco em edição profissional e futura renderização HTML/CSS.
                    </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#111] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-2">1. Escolha a origem</p>
                            <h3 className="text-xl font-bold text-white">De onde esse conteúdo vai nascer?</h3>
                            <p className="text-sm text-gray-400 mt-2">Tudo continua ancorado no manifesto e nas linhas editoriais ativas.</p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 max-w-sm">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-1">Grounding ativo</p>
                            <p className="text-xs text-gray-300">
                                {manifestoName || 'Manifesto atual'}{selectedEditorialLines.length > 0 ? ` + ${selectedEditorialLines.length} linha(s) editorial(is)` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sourceCards.map((source) => {
                            const isSelected = contentStudioSourceMode === source.id;
                            return (
                                <button
                                    key={source.id}
                                    type="button"
                                    disabled={source.disabled}
                                    onClick={() => {
                                        if (source.disabled) return;
                                        setContentStudioSourceMode(source.id);
                                        if (source.id === 'planned' && queueItems.length > 0) {
                                            setContextText('');
                                            setContentStudioTitle(queueItems[0]?.theme || '');
                                        }
                                        if (source.id === 'knowledge' && !contextText.trim()) {
                                            setActiveSource('article');
                                        }
                                    }}
                                    className={`rounded-[24px] border p-5 text-left transition-all ${
                                        source.disabled
                                            ? 'border-white/5 bg-black/20 text-gray-600 cursor-not-allowed'
                                            : isSelected
                                                ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(143,67,246,0.18)]'
                                                : 'border-white/10 bg-black/20 hover:border-primary/30'
                                    }`}
                                >
                                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-3">{source.badge}</p>
                                    <h4 className="text-lg font-bold text-white">{source.title}</h4>
                                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">{source.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {contentCalendar.length > 0 && (
                    <div className="rounded-[28px] border border-primary/20 bg-primary/5 p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-2">Fila de produção</p>
                                <h3 className="text-xl font-bold text-white">{queueItems.length} card(s) seguindo para criação</h3>
                                <p className="text-sm text-gray-400 mt-2">Cards aprovados aparecem primeiro como recomendação editorial. Cards apenas planejados continuam disponíveis para criação quando fizer sentido.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" className="text-xs" onClick={() => setSelectedProductionPostIds(approvedCalendarItems.map((item) => item.id))} disabled={approvedCalendarItems.length === 0}>
                                    Selecionar aprovados
                                </Button>
                                <Button variant="ghost" className="text-xs" onClick={() => setSelectedProductionPostIds(contentCalendar.map((item) => item.id))}>
                                    Selecionar todos planejados
                                </Button>
                                <Button variant="ghost" className="text-xs" onClick={() => setSelectedProductionPostIds([])}>
                                    Usar recomendação automática
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {approvedCalendarItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-300">Aprovados para criação</p>
                                            <p className="text-xs text-gray-500 mt-1">Prioridade recomendada para seguir no fluxo de conteúdo.</p>
                                        </div>
                                        <Badge variant="secondary">{approvedCalendarItems.length}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {approvedCalendarItems.map((item) => {
                                            const isSelected = selectedProductionPostIds.includes(item.id) || (selectedProductionPostIds.length === 0 && queueItems.some((queueItem) => queueItem.id === item.id));

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => toggleProductionPostSelection(item.id)}
                                                    className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(143,67,246,0.18)]' : 'border-emerald-500/20 bg-emerald-500/8 hover:border-primary/30'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">{item.format}</span>
                                                        <span className="text-[10px] text-gray-500">{item.day}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <span className="text-[10px] font-semibold text-emerald-300">Aprovado para criação</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white">{item.theme}</h4>
                                                    <p className="text-xs text-primary mt-2">{item.editorialLine}</p>
                                                    <p className="text-xs text-gray-400 mt-2 max-h-16 overflow-hidden">{item.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {pendingCalendarItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-amber-300">Planejados sem aprovação</p>
                                            <p className="text-xs text-gray-500 mt-1">Disponíveis para criação, mas ainda sem sinal editorial de prioridade.</p>
                                        </div>
                                        <Badge variant="secondary">{pendingCalendarItems.length}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {pendingCalendarItems.map((item) => {
                                            const isSelected = selectedProductionPostIds.includes(item.id) || (selectedProductionPostIds.length === 0 && queueItems.some((queueItem) => queueItem.id === item.id));

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => toggleProductionPostSelection(item.id)}
                                                    className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(143,67,246,0.18)]' : 'border-white/10 bg-black/20 hover:border-primary/30'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">{item.format}</span>
                                                        <span className="text-[10px] text-gray-500">{item.day}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <span className="text-[10px] font-semibold text-amber-300">Planejado</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white">{item.theme}</h4>
                                                    <p className="text-xs text-primary mt-2">{item.editorialLine}</p>
                                                    <p className="text-xs text-gray-400 mt-2 max-h-16 overflow-hidden">{item.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="rounded-[28px] border border-white/10 bg-[#111] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-2">2. Escolha o formato</p>
                            <h3 className="text-xl font-bold text-white">Qual ativo vamos construir agora?</h3>
                            <p className="text-sm text-gray-400 mt-2">
                                O carrossel é o formato prioritário desta wave e será o primeiro a ganhar editor visual avançado.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 max-w-sm">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-300 mb-1">Próxima entrega</p>
                            <p className="text-xs text-gray-300">Slides editáveis, tipografia, imagens e estilos por card em uma base HTML/CSS.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {ASSETS.map(asset => {
                            const Icon = asset.icon;
                            const isRecommended = recommendedAsset === asset.id;
                            return (
                                <div 
                                    key={asset.id}
                                    onClick={() => {
                                        setSelectedAsset(asset.id);
                                        handleNext();
                                    }}
                                    className={`
                                        p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]
                                        ${selectedAsset === asset.id 
                                        ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(143,67,246,0.1)]' 
                                        : 'border-[#222] bg-[#141414] hover:border-gray-600'}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${selectedAsset === asset.id ? 'bg-primary text-white' : 'bg-[#222] text-gray-500'}`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{asset.label}</h3>
                                    <p className="text-xs text-gray-500 font-serif leading-relaxed">{asset.desc}</p>
                                    {isRecommended && approvedCalendarItems.length > 0 && (
                                        <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                            Recomendado para a fila
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderIngestion = () => {
        const inputSources = [
            { id: 'article', label: 'Artigo', icon: FileText, hint: 'Link, resumo ou pontos-chave', placeholder: 'Título ou link do artigo:\n\nResumo, insights e trechos relevantes:' },
            { id: 'book', label: 'Livro', icon: BookOpen, hint: 'Resumo ou lições principais', placeholder: 'Título:\nAutor:\n\nPrincipais lições ou resumo:' },
            { id: 'youtube', label: 'YouTube', icon: Video, hint: 'Link, transcrição ou takeaways', placeholder: 'Link do vídeo:\nCanal:\n\nTakeaways principais:' },
            { id: 'podcast', label: 'Podcast', icon: Mic, hint: 'Transcrição ou insight', placeholder: 'Nome do podcast:\nConvidado:\n\nInsight principal:' },
            { id: 'quote', label: 'Frase', icon: Quote, hint: 'Citação impactante', placeholder: 'A frase:\n\nPor que isso importa para sua marca?' },
            { id: 'file', label: 'PDF / DOCX', icon: UploadCloud, hint: 'Material-base importado', placeholder: 'Cole aqui o resumo do arquivo, pontos-chave ou trechos relevantes.' },
            { id: 'thought', label: 'Dump mental', icon: Lightbulb, hint: 'Pensamento livre', placeholder: 'Despeje seus pensamentos aqui sem filtro...' },
        ];
        const sourceModeLabel = contentStudioSourceMode === 'planned'
            ? 'Calendário aprovado'
            : contentStudioSourceMode === 'title'
                ? 'Título com IA'
                : 'Ingestão de conhecimento';

        return (
            <div className="max-w-5xl mx-auto px-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-[#1A1A1A] rounded-full border border-[#333] mb-4">
                        <UploadCloud size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-white">Preparação do briefing</h2>
                    <p className="text-gray-400 text-lg">Monte a base do conteúdo antes de enviar para a IA estruturar o ativo.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-[28px] border border-white/10 bg-[#141414] p-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-2">Origem ativa</p>
                                    <h3 className="text-xl font-bold text-white">{sourceModeLabel}</h3>
                                </div>
                                <Badge variant="secondary">{selectedAsset}</Badge>
                            </div>

                            {contentStudioSourceMode === 'planned' && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="text-sm text-white font-semibold">{activeProductionItems.length} card(s) aprovados alimentando a criação</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            O briefing principal nasce do calendário, com manifesto e linhas editoriais como grounding adicional.
                                        </p>
                                    </div>
                                    {activeProductionItems.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {activeProductionItems.slice(0, 4).map((item) => (
                                                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${getCalendarFormatColorClasses(item.format).accent}`}>{item.format}</span>
                                                        <span className="text-[10px] text-gray-500">{item.day}</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-white">{item.theme}</p>
                                                    <p className="text-xs text-primary/80 mt-2">{item.editorialLine}</p>
                                                    <p className="text-xs text-gray-500 mt-2 line-clamp-3">{item.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        className="w-full h-48 bg-[#0A0A0A] border border-[#222] rounded-xl p-4 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none font-serif leading-relaxed"
                                        placeholder="Adicione observações extras para a criação: CTA, gancho, oferta, nuance de tom, restrições visuais."
                                        value={contextText}
                                        onChange={(e) => setContextText(e.target.value)}
                                    />
                                </div>
                            )}

                            {contentStudioSourceMode === 'title' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título-base</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none"
                                            placeholder="Ex: 7 erros que fazem sua marca parecer genérica"
                                            value={contentStudioTitle}
                                            onChange={(e) => setContentStudioTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Direção adicional</label>
                                        <textarea
                                            className="w-full h-48 bg-[#0A0A0A] border border-[#222] rounded-xl p-4 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none font-serif leading-relaxed"
                                            placeholder="Explique o contexto, objetivo, CTA, oferta, público ou ângulo desejado."
                                            value={contextText}
                                            onChange={(e) => setContextText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {contentStudioSourceMode === 'knowledge' && (
                                <div className="space-y-4">
                                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {inputSources.map(source => (
                                            <button
                                                key={source.id}
                                                onClick={() => handleSourceSelect(source.id, source.placeholder)}
                                                className={`
                                                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0
                                                    ${activeSource === source.id 
                                                        ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(143,67,246,0.3)]' 
                                                        : 'bg-[#141414] text-gray-400 border-[#222] hover:border-gray-600 hover:text-white'}
                                                `}
                                            >
                                                <source.icon size={14} />
                                                {source.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-[#141414] border border-[#1A1A1A] p-6 rounded-2xl flex flex-col gap-4 focus-within:border-primary/50 transition-all shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            {inputSources.find(s => s.id === activeSource)?.icon &&
                                                React.createElement(inputSources.find(s => s.id === activeSource)!.icon, { size: 120 })
                                            }
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-500 mb-2 relative z-10">
                                            {React.createElement(inputSources.find(s => s.id === activeSource)?.icon || BrainCircuit, { size: 20, className: 'text-primary' })}
                                            <span className="text-sm font-medium">
                                                {inputSources.find(s => s.id === activeSource)?.hint}
                                            </span>
                                        </div>

                                        <textarea
                                            className="w-full h-64 bg-[#0A0A0A] border border-[#222] rounded-xl p-4 text-sm text-gray-300 focus:border-primary focus:outline-none resize-none font-serif leading-relaxed relative z-10"
                                            placeholder={inputSources.find(s => s.id === activeSource)?.placeholder}
                                            value={contextText}
                                            onChange={(e) => setContextText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-4">
                                <span className="text-[10px] text-gray-500 bg-[#0A0A0A] px-2 py-1 rounded border border-[#222]">
                                    Conteúdo ancorado em manifesto + linhas editoriais
                                </span>
                                <span className="text-xs text-gray-600">{getContentStudioContext().length} caracteres de contexto composto</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#141414] border border-[#1A1A1A] rounded-2xl p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                                <Sparkles size={14} className="text-primary" />
                                Base ativa
                            </h3>

                            <div className="space-y-4">
                                <div className="rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] p-4">
                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-2">Manifesto</p>
                                    <p className="text-sm text-white">{manifestoName || 'Manifesto atual da marca'}</p>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-4">{manifestoContent || 'Nenhum manifesto carregado.'}</p>
                                </div>

                                <div className="rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] p-4">
                                    <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 mb-2">Linhas editoriais</p>
                                    {selectedEditorialLines.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedEditorialLines.slice(0, 4).map((line) => (
                                                <div key={line.id} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs text-gray-300">
                                                    {line.content}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Selecione linhas editoriais para orientar a criação.</p>
                                    )}
                                </div>

                                {contentStudioSourceMode === 'knowledge' && (
                                    <>
                                        <div className="group flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#333] transition-all cursor-pointer" onClick={() => { setContentStudioSourceMode('knowledge'); setActiveSource('book'); setContextText("Livro: A Almanaque de Naval Ravikant\nAutor: Eric Jorgenson\n\nLição 1: Riqueza é ter ativos que ganham enquanto você dorme.\nLição 2: Felicidade é uma habilidade que se treina, não um destino."); }}>
                                            <div className="flex items-center gap-3">
                                                <div className="text-purple-500">
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium truncate w-32 text-gray-300">Resumo: Naval Ravikant</p>
                                                    <p className="text-[10px] text-gray-600 uppercase">Livro • Ontem</p>
                                                </div>
                                            </div>
                                            <button className="text-gray-600 hover:text-white transition-colors">
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>

                                        <div className="group flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#333] transition-all cursor-pointer" onClick={() => { setContentStudioSourceMode('knowledge'); setActiveSource('quote'); setContextText(`"Nós sofremos mais na imaginação do que na realidade." - Sêneca\n\nIsso me tocou porque passei a semana ansioso com o lançamento e nada deu errado.`); }}>
                                            <div className="flex items-center gap-3">
                                                <div className="text-yellow-500">
                                                    <Quote size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium truncate w-32 text-gray-300">Citação: Sêneca</p>
                                                    <p className="text-[10px] text-gray-600 uppercase">Estoicismo</p>
                                                </div>
                                            </div>
                                            <button className="text-gray-600 hover:text-white transition-colors">
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                            <div className="flex gap-3">
                                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    <strong className="text-white">Wave 1 do Content Studio:</strong> nesta fase a IA já gera o conteúdo a partir do manifesto, linhas editoriais e da origem escolhida. Na próxima wave entra o editor visual avançado do carrossel em HTML/CSS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-end border-t border-[#1A1A1A] pt-8">
                    <Button 
                        onClick={handleNext} 
                        disabled={!hasContentStudioInput}
                        className="h-12 px-10 rounded-2xl text-base shadow-lg shadow-primary/20"
                    >
                        Definir estratégia <ChevronRight size={16} className="ml-2"/>
                    </Button>
                </div>
            </div>
        );
    };

    const renderDecomposition = () => (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-white mb-2">Estratégia de criação</h3>
                <p className="text-gray-400">Defina a lente criativa antes de mandar o briefing para a IA estruturar o conteúdo.</p>
            </div>

            {contentStudioError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {contentStudioError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. A Lente (Arquétipo) */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <User size={16} className="text-primary"/> 1. Escolha sua Lente
                    </h4>
                    <div className="space-y-3">
                        {ARCHETYPES.map(arch => (
                            <div 
                                key={arch.id}
                                onClick={() => setSelectedArchetype(arch.id)}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                    selectedArchetype === arch.id 
                                    ? `bg-[#0A0A0A] border-primary shadow-[0_0_20px_rgba(143,67,246,0.1)]` 
                                    : 'bg-[#141414] border-[#222] hover:border-gray-600'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${arch.bg} ${arch.color}`}>
                                    <User size={18} />
                                </div>
                                <div>
                                    <span className={`font-bold text-sm block ${selectedArchetype === arch.id ? 'text-white' : 'text-gray-400'}`}>{arch.name}</span>
                                    <span className="text-[10px] text-gray-600">{arch.trait}</span>
                                </div>
                                {selectedArchetype === arch.id && <CheckCircle2 size={16} className="text-primary ml-auto" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. O Objetivo (Ângulo) */}
                <div className="space-y-4">
                     <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Target size={16} className="text-accent"/> 2. Defina o Objetivo
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'Branding', desc: 'Reforçar autoridade e valores.' },
                            { id: 'Venda Direta', desc: 'Converter para oferta.' },
                            { id: 'Educacional', desc: 'Ensinar um conceito (How-to).' },
                            { id: 'Viral', desc: 'Polemicar ou entreter.' }
                        ].map(obj => (
                            <button
                                key={obj.id}
                                onClick={() => setSelectedObjective(obj.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    selectedObjective === obj.id 
                                    ? 'bg-primary/10 border-primary text-white' 
                                    : 'bg-[#141414] border-[#222] text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                <div className="text-sm font-bold mb-0.5">{obj.id}</div>
                                <div className="text-[10px] text-gray-500">{obj.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#222] text-center">
                <Button 
                    variant="primary" 
                    className="h-14 px-12 text-lg rounded-full shadow-[0_0_30px_rgba(143,67,246,0.3)] hover:scale-105 transition-transform" 
                    onClick={handleRunEngine} 
                    disabled={!selectedObjective || !hasContentStudioInput}
                    isLoading={isLoading}
                >
                    <BrainCircuit size={20} className="mr-3"/> Gerar estrutura do conteúdo
                </Button>
                <p className="text-[10px] text-gray-600 mt-4">A IA combinará manifesto, linhas editoriais e a origem escolhida para montar o primeiro draft.</p>
            </div>
        </div>
    );

    const renderConstruction = () => {
        // Parse score
        const scoreVal = critique ? parseInt(critique.score_de_autenticidade.replace('%', '')) : 0;
        
        return (
        <div className="h-full flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-right-8">
            {/* LADO ESQUERDO: EDITOR FOCUS MODE (Redator) */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Edit3 size={20} className="text-primary" />
                        <h2 className="text-xl font-bold text-white">Construção do Ativo</h2>
                    </div>
                    <Badge variant="soft" color="neutral" className="gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${agentStatus === 'ILLUSTRATOR' ? 'bg-purple-400' : 'bg-green-500'}`}></div>
                        {agentStatus === 'ILLUSTRATOR' ? 'Agente Ilustrador: Gerando imagens...' : 'Agente Redator: Ativo'}
                    </Badge>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                     {generatedSlides.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                             <BrainCircuit size={48} className={`mb-4 ${isLoading || agentStatus === 'ILLUSTRATOR' ? 'animate-pulse text-primary' : 'opacity-20'}`}/>
                             <p>{agentStatus === 'ILLUSTRATOR' ? 'Gerando imagens dos slides...' : isLoading ? 'Construindo narrativa...' : 'Aguardando início do motor.'}</p>
                        </div>
                    ) : (
                        generatedSlides.map((slide) => {
                            const feedback = critique?.ajustes_sugeridos.find(a => a.slide === slide.id);
                            const hasIssue = !!feedback;

                            return (
                                <div key={slide.id} className="bg-[#141414] border border-[#222] rounded-2xl p-6 transition-all hover:border-[#333] group focus-within:border-primary/50">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Slide {slide.id}</span>
                                        {hasIssue ? 
                                            <div className="flex items-center gap-1 text-action text-[10px] font-bold">
                                                <AlertTriangle size={12} /> Revisão Sugerida
                                            </div> : 
                                            <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                                                <CheckCircle2 size={12} /> Aprovado
                                            </div>
                                        }
                                    </div>
                                    
                                    <input 
                                        className="bg-transparent text-xl font-bold text-white w-full mb-2 outline-none focus:text-primary transition-colors placeholder-gray-700"
                                        value={slide.title}
                                        onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                                    />
                                    <textarea 
                                        className="bg-transparent text-gray-400 w-full text-sm leading-relaxed outline-none min-h-[80px] resize-none focus:text-gray-200"
                                        value={slide.body}
                                        onChange={(e) => updateSlide(slide.id, 'body', e.target.value)}
                                    />
                                    
                                    <div className="mt-4 pt-4 border-t border-[#222] flex items-center gap-2">
                                        <ImageIcon size={12} className="text-gray-600" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Prompt Visual:</span>
                                        <p className="text-[10px] text-primary italic truncate flex-1">{slide.visualPrompt}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* LADO DIREITO: DASHBOARD DO VALIDADOR (Crítico) */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
                 {generatedSlides.length > 0 && (
                    <div className="bg-[#141414] border border-[#222] rounded-2xl p-6 sticky top-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-[#222] pb-4">
                            <ShieldAlert size={20} className="text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Validador de IA</h3>
                        </div>

                        {/* Score de Autenticidade */}
                        <div className="mb-8 text-center relative">
                            {/* SVG Circle Logic */}
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle className="text-[#222]" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                                    <circle 
                                        className={`${scoreVal > 80 ? 'text-green-500' : scoreVal > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                                        strokeWidth="8" 
                                        strokeDasharray={364} 
                                        strokeDashoffset={364 - (364 * scoreVal) / 100} 
                                        strokeLinecap="round" 
                                        stroke="currentColor" 
                                        fill="transparent" 
                                        r="58" cx="64" cy="64" 
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-bold text-white">{scoreVal}%</span>
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Autenticidade</span>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Críticas do Agente */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Análise Crítica:</p>
                                <Badge variant="soft" color={critique?.status === 'APROVADO' ? 'success' : 'action'}>{critique?.status || 'PENDENTE'}</Badge>
                            </div>
                            
                            {critique?.analise_critica && (
                                <p className="text-xs text-gray-400 font-serif italic">"{critique.analise_critica}"</p>
                            )}

                            {critique?.ajustes_sugeridos.length ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                    {critique.ajustes_sugeridos.map((adj, i) => (
                                        <div key={i} className="p-3 bg-red-900/10 border border-red-900/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle size={10} className="text-red-400" />
                                                <strong className="text-[10px] text-red-200">Slide {adj.slide}</strong>
                                            </div>
                                            <p className="text-[10px] text-gray-400 line-through mb-1 opacity-50">{adj.antes}</p>
                                            <p className="text-[10px] text-green-400 font-medium">{adj.depois}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 bg-green-900/10 border border-green-900/20 rounded-xl flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span className="text-xs text-green-300">Nenhum ajuste crítico necessário.</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                             <Button 
                                variant="secondary"
                                onClick={handleRunEngine}
                                className="w-full text-xs h-10 border-[#333] hover:border-primary hover:text-primary"
                                disabled={isLoading}
                            >
                                <Sparkles size={14} className="mr-2" />
                                Regenerar estrutura
                            </Button>

                            <Button 
                                variant="ghost"
                                onClick={handleRunCritique}
                                className="w-full text-xs h-10 border-[#333] hover:border-primary hover:text-primary"
                                disabled={isCritiquingContent}
                            >
                                <ShieldAlert size={14} className="mr-2" />
                                {isCritiquingContent ? 'Rodando crítica...' : 'Rodar crítica de copy'}
                            </Button>
                            
                            <Button 
                                variant="primary" 
                                className="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20"
                                onClick={handleNext}
                            >
                                Aprovar e Embalar
                                <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        );
    };

    const renderPackaging = () => {
        const currentSlide = clampSlideTypographyForTemplate(generatedSlides[selectedSlideIndex] || {
            id: 0,
            title: 'No Slide',
            body: 'Generate content first.',
            visualPrompt: 'Abstract',
            imageUrl: '',
            templateId: PREMIUM_BRANDING_ROTATION[0] as BrandingTemplateId,
            ...createSlideDesignDefaultsFromIdentity(brandVisualIdentity),
        });
        const currentSlideImage = currentSlide.id ? resolveSlideImage(currentSlide) : '';
        const currentSlideImagePlacement = resolveSlideImagePlacement(currentSlide);
        const titleFontFamily = currentSlide.titleFontFamily === 'sans' ? '"Inter", "Segoe UI", sans-serif' : '"Georgia", "Times New Roman", serif';
        const bodyFontFamily = currentSlide.bodyFontFamily === 'sans' ? '"Inter", "Segoe UI", sans-serif' : '"Georgia", "Times New Roman", serif';
        const previewTitleStyle = {
            fontSize: `${currentSlide.titleFontSize}px`,
            fontFamily: titleFontFamily,
            textAlign: currentSlide.textAlign,
            lineHeight: currentSlide.titleFontSize >= 56 ? '0.98' : '1.06',
            letterSpacing: '-0.03em',
        } as const;
        const previewBodyStyle = {
            fontSize: `${currentSlide.bodyFontSize}px`,
            fontFamily: bodyFontFamily,
            textAlign: currentSlide.textAlign,
            lineHeight: 1.62,
        } as const;
        const previewAccentStyle = { color: currentSlide.accentColor } as const;
        const previewSecondaryStyle = { color: currentSlide.secondaryColor } as const;
        const previewAccentBackgroundStyle = { backgroundColor: currentSlide.accentColor } as const;
        const previewSecondaryBackgroundStyle = { backgroundColor: currentSlide.secondaryColor } as const;
        const previewFrameStyle = { backgroundColor: currentSlide.backgroundColor, color: currentSlide.textColor } as const;
        const previewSurfaceStyle = { backgroundColor: currentSlide.surfaceColor } as const;
        const previewImageStyle = {
            objectFit: currentSlide.imageFit,
            transform: `scale(${currentSlide.imageScale / 100})`,
        } as const;
        const currentSlideNumber = selectedSlideIndex + 1;
        const textBlockAlignmentClass = currentSlide.textAlign === 'center'
            ? 'items-center text-center'
            : currentSlide.textAlign === 'right'
                ? 'items-end text-right'
                : 'items-start text-left';
        const alignedWidthClass = currentSlide.textAlign === 'center'
            ? 'mx-auto'
            : currentSlide.textAlign === 'right'
                ? 'ml-auto'
                : '';
        const renderPreviewBrandBadge = () => (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-black/35 backdrop-blur">
                {carouselBrandProfile.profileImageUrl ? (
                    <img src={carouselBrandProfile.profileImageUrl} alt="Perfil" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={previewAccentBackgroundStyle}>
                        @
                    </div>
                )}
                <span className="tracking-[0.08em] text-[10px] font-bold" style={previewAccentStyle}>{carouselBrandProfile.brandName}</span>
            </div>
        );

        // Ensure index is valid
        if (generatedSlides.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <BrainCircuit size={48} className="mb-4 opacity-20" />
                    <p>Gere o conteúdo primeiro na etapa anterior.</p>
                    <Button variant="secondary" className="mt-4" onClick={handleBack}>Voltar</Button>
                </div>
            );
        }

        const currentTemplateId = normalizeBrandingTemplateForEditor(currentSlide.templateId);
        const normalizedCurrentSlide = currentTemplateId === currentSlide.templateId
            ? currentSlide
            : { ...currentSlide, templateId: currentTemplateId };
        const selectedTemplateLabel = TEMPLATE_OPTIONS.find((template) => template.id === currentTemplateId)?.name || currentTemplateId;
        const readabilityGuide = getSlideReadabilityGuide(currentTemplateId);
        const premiumPreviewMarkup = buildPremiumBrandingSlideMarkup({
            ...normalizedCurrentSlide,
            brandName: carouselBrandProfile.brandName,
            brandHandle: carouselBrandProfile.brandHandle,
            brandStudioLabel: carouselBrandProfile.studioLabel,
            profileImageUrl: carouselBrandProfile.profileImageUrl,
        }) || buildPackagingPreviewFallbackMarkup({
            title: normalizedCurrentSlide.title,
            body: normalizedCurrentSlide.body,
            eyebrow: normalizedCurrentSlide.eyebrow,
            footerLabel: normalizedCurrentSlide.footerLabel,
            templateLabel: selectedTemplateLabel,
            brandHandle: carouselBrandProfile.brandHandle,
            accentColor: normalizedCurrentSlide.accentColor,
            secondaryColor: normalizedCurrentSlide.secondaryColor,
            backgroundColor: normalizedCurrentSlide.backgroundColor,
            textColor: normalizedCurrentSlide.textColor,
            titleFontSize: normalizedCurrentSlide.titleFontSize,
            bodyFontSize: normalizedCurrentSlide.bodyFontSize,
            textAlign: normalizedCurrentSlide.textAlign,
            titleFontFamily: normalizedCurrentSlide.titleFontFamily,
            bodyFontFamily: normalizedCurrentSlide.bodyFontFamily,
        });
        const brandingPlugin = localPlugins.find((plugin) => plugin.name === 'branding-os');
        const brandingSlideSkill = brandingPlugin?.skills.find((skill) => skill.name === 'slide-creator');
        const brandingSkillPrompt = brandingSlideSkill?.defaultPrompt
            || 'Use $slide-creator to create branded slides in HTML/CSS and render them with Playwright.';
        const editorSections: Array<{ id: PackagingEditorPanel; label: string; icon: React.ElementType; hint: string }> = [
            { id: 'brand', label: 'Marca', icon: Palette, hint: 'perfil e identidade' },
            { id: 'content', label: 'Texto', icon: Edit3, hint: 'copy do slide' },
            { id: 'slides', label: 'Slides', icon: Layers, hint: 'ordem e estrutura' },
            { id: 'layout', label: 'Layout', icon: Layout, hint: 'template visual' },
            { id: 'typography', label: 'Tipo', icon: FileText, hint: 'fontes e tamanho' },
            { id: 'media', label: 'Mídia', icon: ImageIcon, hint: 'imagem e cores' },
            { id: 'ai', label: 'IA', icon: Bot, hint: 'copiloto visual' },
        ];

        const handleCopySkillPrompt = async () => {
            try {
                await navigator.clipboard.writeText(brandingSkillPrompt);
                setCopiedSkillPrompt(brandingSkillPrompt);
                window.setTimeout(() => {
                    setCopiedSkillPrompt((current) => current === brandingSkillPrompt ? '' : current);
                }, 1800);
            } catch (error) {
                console.error('Failed to copy skill prompt', error);
            }
        };

        const renderEditorPanelContent = () => {
            if (packagingEditorPanel === 'brand') {
                return (
                    <div className="space-y-5">
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Base visual ativa</p>
                            <p className="text-sm text-white">{brandVisualIdentity.brandName} <span className="text-gray-500">{brandVisualIdentity.brandHandle}</span></p>
                            <p className="text-xs text-gray-500 mt-1">{brandVisualIdentity.brandStudioLabel}</p>
                            <p className="text-xs text-gray-500 mt-2">Essa identidade pode ser reaplicada ao pack atual a qualquer momento.</p>
                            <Button variant="ghost" className="w-full text-[10px] h-10 mt-3" onClick={handleApplyBrandIdentityToCurrentCarousel}>
                                <Palette size={12} className="mr-1" /> Reaplicar identidade da marca
                            </Button>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="Nome da marca"
                                value={carouselBrandProfile.brandName}
                                onChange={(e) => {
                                    setCarouselBrandProfile((current) => ({ ...current, brandName: e.target.value }));
                                    updateBrandVisualIdentityField('brandName', e.target.value);
                                }}
                            />
                            <input
                                type="text"
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="@perfil"
                                value={carouselBrandProfile.brandHandle}
                                onChange={(e) => {
                                    setCarouselBrandProfile((current) => ({ ...current, brandHandle: e.target.value }));
                                    updateBrandVisualIdentityField('brandHandle', e.target.value);
                                }}
                            />
                            <input
                                type="text"
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="Assinatura da marca"
                                value={carouselBrandProfile.studioLabel}
                                onChange={(e) => {
                                    setCarouselBrandProfile((current) => ({ ...current, studioLabel: e.target.value }));
                                    updateBrandVisualIdentityField('brandStudioLabel', e.target.value);
                                }}
                            />
                            <input
                                type="url"
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="URL da foto do perfil"
                                value={carouselBrandProfile.profileImageUrl}
                                onChange={(e) => {
                                    setCarouselBrandProfile((current) => ({ ...current, profileImageUrl: e.target.value }));
                                    updateBrandVisualIdentityField('profileImageUrl', e.target.value);
                                }}
                            />
                            <label className="block">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Foto do perfil</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-[10px] text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-primary"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            if (typeof reader.result === 'string') {
                                                setCarouselBrandProfile((current) => ({ ...current, profileImageUrl: reader.result as string }));
                                                updateBrandVisualIdentityField('profileImageUrl', reader.result);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                        e.currentTarget.value = '';
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                );
            }

            if (packagingEditorPanel === 'content') {
                return (
                    <div className="space-y-3">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-300">Guardrail de leitura</p>
                            <p className="text-[11px] text-gray-300 mt-2">
                                Template atual: {readabilityGuide.formatLabel}. Mire títulos curtos e corpo enxuto para sustentar mínimo de {readabilityGuide.titleMin}px no título e {readabilityGuide.bodyMin}px no corpo.
                            </p>
                        </div>
                        <input
                            type="text"
                            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                            placeholder="Eyebrow / rótulo superior"
                            value={currentSlide.eyebrow}
                            onChange={(e) => updateSlideDesign(currentSlide.id, { eyebrow: e.target.value })}
                        />
                        <textarea
                            className="w-full min-h-[90px] bg-[#0A0A0A] border border-[#222] rounded-xl p-3 text-sm text-white focus:border-primary focus:outline-none resize-none"
                            placeholder="Título do slide"
                            value={currentSlide.title}
                            onChange={(e) => updateSlide(currentSlide.id, 'title', e.target.value)}
                        />
                        <textarea
                            className="w-full min-h-[170px] bg-[#0A0A0A] border border-[#222] rounded-xl p-3 text-xs text-gray-300 focus:border-primary focus:outline-none resize-none"
                            placeholder="Texto principal do slide"
                            value={currentSlide.body}
                            onChange={(e) => updateSlide(currentSlide.id, 'body', e.target.value)}
                        />
                        <input
                            type="text"
                            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                            placeholder="Rótulo do rodapé"
                            value={currentSlide.footerLabel}
                            onChange={(e) => updateSlideDesign(currentSlide.id, { footerLabel: e.target.value })}
                        />
                    </div>
                );
            }

            if (packagingEditorPanel === 'slides') {
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-500 mb-2">Slide ativo</p>
                            <p className="text-sm font-semibold text-white">Slide {currentSlideNumber} de {generatedSlides.length}</p>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{currentSlide.title || 'Sem título'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" className="text-[10px] h-10" onClick={() => insertSlideAfter(selectedSlideIndex)}>
                                <Plus size={12} className="mr-1" /> Novo
                            </Button>
                            <Button variant="ghost" className="text-[10px] h-10" onClick={() => duplicateSlideAt(selectedSlideIndex)}>
                                Duplicar
                            </Button>
                            <Button variant="ghost" className="text-[10px] h-10" onClick={() => moveSlideAt(selectedSlideIndex, 'left')} disabled={selectedSlideIndex === 0}>
                                <ChevronLeft size={12} className="mr-1" /> Subir
                            </Button>
                            <Button variant="ghost" className="text-[10px] h-10" onClick={() => moveSlideAt(selectedSlideIndex, 'right')} disabled={selectedSlideIndex === generatedSlides.length - 1}>
                                Descer <ChevronRight size={12} className="ml-1" />
                            </Button>
                        </div>
                        <Button variant="ghost" className="w-full text-[10px] h-10 text-red-300 hover:text-red-200" onClick={() => removeSlideAt(selectedSlideIndex)}>
                            <Trash2 size={12} className="mr-1" /> Remover slide
                        </Button>
                        <p className="text-xs text-gray-500">Use a trilha inferior para navegar entre os slides e reorganizar o pack com mais velocidade.</p>
                    </div>
                );
            }

            if (packagingEditorPanel === 'layout') {
                return (
                    <div className="space-y-5">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold block mb-3">Presets com IA</p>
                            <div className="space-y-2">
                                {CAROUSEL_STYLE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyCarouselStylePresetToPack(preset.id)}
                                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                                            carouselStylePreset === preset.id
                                                ? 'border-primary bg-primary/10 text-white'
                                                : 'border-[#222] bg-[#0A0A0A] text-gray-400 hover:border-primary'
                                        }`}
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{preset.label}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold block mb-3">Templates HTML/CSS</p>
                            <div className="grid grid-cols-2 gap-2">
                                {TEMPLATE_OPTIONS.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => updateSlideDesign(currentSlide.id, { templateId: template.id })}
                                        className={`p-3 border rounded-xl transition-all text-[10px] ${
                                            currentSlide.templateId === template.id
                                                ? 'border-primary bg-primary/10 text-white'
                                                : 'border-[#222] bg-[#0A0A0A] hover:border-primary text-gray-400'
                                        }`}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            if (packagingEditorPanel === 'typography') {
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-500">Mínimos ativos</p>
                            <p className="text-xs text-gray-300 mt-2">{readabilityGuide.formatLabel}</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                                <div className="rounded-lg border border-[#222] bg-[#111] px-2 py-2">Título<br /><span className="text-white font-bold">{readabilityGuide.titleMin}px+</span></div>
                                <div className="rounded-lg border border-[#222] bg-[#111] px-2 py-2">Corpo<br /><span className="text-white font-bold">{readabilityGuide.bodyMin}px+</span></div>
                                <div className="rounded-lg border border-[#222] bg-[#111] px-2 py-2">Caption<br /><span className="text-white font-bold">{readabilityGuide.captionMin}px+</span></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                                <span>Tamanho do título</span>
                                <span>{currentSlide.titleFontSize}px</span>
                            </div>
                            <input type="range" min={readabilityGuide.titleMin} max="80" step="1" value={currentSlide.titleFontSize} onChange={(e) => updateSlideDesign(currentSlide.id, { titleFontSize: Number(e.target.value) })} className="w-full" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                                <span>Tamanho do corpo</span>
                                <span>{currentSlide.bodyFontSize}px</span>
                            </div>
                            <input type="range" min={readabilityGuide.bodyMin} max="48" step="1" value={currentSlide.bodyFontSize} onChange={(e) => updateSlideDesign(currentSlide.id, { bodyFontSize: Number(e.target.value) })} className="w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { titleFontFamily: 'serif', bodyFontFamily: 'serif' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.titleFontFamily === 'serif' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Serif</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { titleFontFamily: 'sans', bodyFontFamily: 'sans' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.titleFontFamily === 'sans' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Sans</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { textAlign: 'left' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.textAlign === 'left' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Alinhar à esquerda</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { textAlign: 'center' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.textAlign === 'center' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Centralizar</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { textAlign: 'right' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.textAlign === 'right' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Alinhar à direita</button>
                        </div>
                    </div>
                );
            }

            if (packagingEditorPanel === 'media') {
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Cor de fundo</label>
                                <input type="color" value={currentSlide.backgroundColor} onChange={(e) => updateSlideDesign(currentSlide.id, { backgroundColor: e.target.value })} className="h-11 w-full rounded-xl border border-[#222] bg-[#0A0A0A] p-1" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Cor de superfície</label>
                                <input type="color" value={currentSlide.surfaceColor} onChange={(e) => updateSlideDesign(currentSlide.id, { surfaceColor: e.target.value })} className="h-11 w-full rounded-xl border border-[#222] bg-[#0A0A0A] p-1" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Cor de destaque</label>
                                <input type="color" value={currentSlide.accentColor} onChange={(e) => updateSlideDesign(currentSlide.id, { accentColor: e.target.value })} className="h-11 w-full rounded-xl border border-[#222] bg-[#0A0A0A] p-1" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Cor secundária</label>
                                <input type="color" value={currentSlide.secondaryColor} onChange={(e) => updateSlideDesign(currentSlide.id, { secondaryColor: e.target.value })} className="h-11 w-full rounded-xl border border-[#222] bg-[#0A0A0A] p-1" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Cor do texto</label>
                                <input type="color" value={currentSlide.textColor} onChange={(e) => updateSlideDesign(currentSlide.id, { textColor: e.target.value })} className="h-11 w-full rounded-xl border border-[#222] bg-[#0A0A0A] p-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { imageFit: 'cover' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.imageFit === 'cover' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Imagem cover</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { imageFit: 'contain' })} className={`rounded-lg border px-3 py-2 text-[10px] ${currentSlide.imageFit === 'contain' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Imagem contain</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { imagePlacement: 'background' })} className={`rounded-lg border px-3 py-2 text-[10px] ${resolveSlideImagePlacement(currentSlide) === 'background' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Imagem como fundo</button>
                            <button type="button" onClick={() => updateSlideDesign(currentSlide.id, { imagePlacement: 'half' })} className={`rounded-lg border px-3 py-2 text-[10px] ${resolveSlideImagePlacement(currentSlide) === 'half' ? 'border-primary bg-primary/10 text-white' : 'border-[#222] bg-[#0A0A0A] text-gray-400'}`}>Imagem em metade</button>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                                <span>Escala da imagem</span>
                                <span>{currentSlide.imageScale}%</span>
                            </div>
                            <input type="range" min="80" max="140" step="5" value={currentSlide.imageScale} onChange={(e) => updateSlideDesign(currentSlide.id, { imageScale: Number(e.target.value) })} className="w-full" />
                        </div>
                        <textarea
                            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl p-3 text-[11px] text-gray-400 outline-none focus:border-primary min-h-[110px] resize-none"
                            placeholder="Descreva a imagem para este slide..."
                            value={currentSlide.visualPrompt}
                            onChange={(e) => updateSlide(currentSlide.id, 'visualPrompt', e.target.value)}
                        />
                        <input
                            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-[11px] text-gray-400 outline-none focus:border-primary"
                            placeholder="Cole aqui a URL de uma imagem da internet"
                            value={currentSlide.imageUrl || ''}
                            onChange={(e) => updateSlide(currentSlide.id, 'imageUrl', e.target.value)}
                        />
                        <label className="block">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Upload de imagem</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-[10px] text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-primary"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    void handleSlideImageUpload(currentSlide.id, file);
                                    e.currentTarget.value = '';
                                }}
                            />
                        </label>
                        <p className="text-[10px] text-gray-500">
                            Alguns templates respeitam a imagem como fundo, outros como bloco lateral. O editor adapta a posição sem quebrar a estrutura do slide.
                        </p>
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Copiloto do slide</p>
                        <p className="text-sm text-white">A IA usa manifesto, linhas editoriais e identidade visual para refinar este slide.</p>
                        <p className="text-xs text-gray-500 mt-2">Layout atual: {selectedTemplateLabel}</p>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">Skill BrandingOS</p>
                                <p className="text-sm text-white mt-2">{brandingSlideSkill?.displayName || 'BrandingOS Slide Creator'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {brandingSlideSkill?.shortDescription || 'Fluxo recomendado para gerar slides em HTML/CSS e renderizar PNG com Playwright.'}
                                </p>
                            </div>
                            <Badge variant="secondary">{brandingPlugin?.displayName || 'branding-os'}</Badge>
                        </div>
                        <div className="mt-3 rounded-lg border border-[#222] bg-[#111] px-3 py-3 text-[11px] text-gray-300">
                            {brandingSkillPrompt}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <Button variant="secondary" className="text-[10px] h-9" onClick={() => void handleCopySkillPrompt()}>
                                <Copy size={12} className="mr-1" /> Copiar prompt da skill
                            </Button>
                            <Button variant="ghost" className="text-[10px] h-9" onClick={() => window.open('/api/plugins/local', '_blank')}>
                                Ver catálogo local
                            </Button>
                        </div>
                        {copiedSkillPrompt === brandingSkillPrompt && (
                            <p className="text-[10px] text-emerald-300 mt-2">Prompt copiado.</p>
                        )}
                        {localPluginsError && (
                            <p className="text-[10px] text-amber-300 mt-2">{localPluginsError}</p>
                        )}
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-300 mb-2">Regras de render</p>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            Export atual respeita preset do template, força legibilidade mínima em {readabilityGuide.formatLabel} e preserva títulos/corpo acima de {readabilityGuide.titleMin}px / {readabilityGuide.bodyMin}px.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => handleGenerateSlideImage(currentSlide.id, currentSlide.visualPrompt)}
                        disabled={generatingImgId === currentSlide.id}
                    >
                        {generatingImgId === currentSlide.id ? 'Gerando imagem...' : 'Gerar imagem deste slide'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={handleRunCritique}
                        disabled={isCritiquingContent}
                    >
                        {isCritiquingContent ? 'Rodando crítica...' : 'Rodar crítica de copy'}
                    </Button>
                    {critique && (
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2">Última leitura crítica</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{critique.summary}</p>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col xl:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full xl:w-[88px] shrink-0 rounded-[2rem] border border-[#222] bg-[#141414] p-3 flex xl:flex-col gap-2">
                    {editorSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = packagingEditorPanel === section.id;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setPackagingEditorPanel(section.id)}
                                title={section.label}
                                className={`flex-1 xl:flex-none rounded-2xl border px-3 py-3 transition-all text-left ${
                                    isActive ? 'border-primary bg-primary/10 text-white shadow-[0_0_12px_rgba(153,0,255,0.16)]' : 'border-[#222] bg-[#0A0A0A] text-gray-500 hover:border-[#333] hover:text-white'
                                }`}
                            >
                                <div className="flex xl:flex-col items-center xl:items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary/15 text-primary' : 'bg-[#151515] text-gray-500'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="min-w-0 xl:hidden">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] truncate">{section.label}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 truncate">{section.hint}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="w-full xl:w-[390px] shrink-0 rounded-[2rem] border border-[#222] bg-[#141414] p-6 flex flex-col gap-5">
                    <div className="rounded-[1.5rem] border border-[#222] bg-[#101010] p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Drafts do carrossel</p>
                                <p className="text-xs text-gray-500 mt-1">Salve versões do pack, recarregue layouts e continue depois sem perder o canvas.</p>
                            </div>
                            <Badge variant="secondary">{savedCarouselDrafts.length}</Badge>
                        </div>
                        <div className="mt-4 space-y-3">
                            <input
                                type="text"
                                className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-3 py-3 text-xs text-white focus:border-primary focus:outline-none"
                                placeholder="Nome do draft"
                                value={carouselDraftName}
                                onChange={(e) => setCarouselDraftName(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="secondary" className="text-[10px] h-10" onClick={saveCarouselDraft} disabled={isSavingCarouselDraft || generatedSlides.length === 0}>
                                    <Save size={12} className="mr-1" /> {isSavingCarouselDraft ? 'Salvando...' : selectedCarouselDraftId ? 'Atualizar draft' : 'Salvar draft'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-[10px] h-10"
                                    onClick={() => {
                                        setSelectedCarouselDraftId(null);
                                        setCarouselDraftName(getDefaultCarouselDraftName());
                                        setCarouselDraftNotice('Pronto para salvar uma nova versão do pack atual.');
                                        setCarouselDraftError('');
                                    }}
                                >
                                    <Plus size={12} className="mr-1" /> Novo draft
                                </Button>
                            </div>
                            {carouselDraftError && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                    {carouselDraftError}
                                </div>
                            )}
                            {carouselDraftNotice && (
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                    {carouselDraftNotice}
                                </div>
                            )}
                            <div className="max-h-48 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                {isLoadingCarouselDrafts ? (
                                    <p className="text-xs text-gray-500">Carregando drafts...</p>
                                ) : savedCarouselDrafts.length === 0 ? (
                                    <p className="text-xs text-gray-500">Nenhum draft salvo ainda. O pack atual pode virar a primeira versão.</p>
                                ) : (
                                    savedCarouselDrafts.map((draft) => (
                                        <div
                                            key={draft.id}
                                            className={`rounded-xl border px-3 py-3 ${
                                                selectedCarouselDraftId === draft.id
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-[#222] bg-[#0A0A0A]'
                                            }`}
                                        >
                                            <button type="button" className="w-full text-left" onClick={() => loadCarouselDraft(draft.id)}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-white truncate">{draft.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            {draft.slides.length} slide(s) · {new Date(draft.updatedAt).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    {selectedCarouselDraftId === draft.id && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                </div>
                                            </button>
                                            <div className="mt-3 flex gap-2">
                                                <Button variant="ghost" className="text-[10px] h-9 flex-1" onClick={() => loadCarouselDraft(draft.id)}>
                                                    Carregar
                                                </Button>
                                                <Button variant="ghost" className="text-[10px] h-9 text-red-300 hover:text-red-200" onClick={() => deleteCarouselDraftRecord(draft.id)}>
                                                    Excluir
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-2">Editor contextual</p>
                            <h3 className="text-lg font-bold text-white">
                                {editorSections.find((section) => section.id === packagingEditorPanel)?.label}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {editorSections.find((section) => section.id === packagingEditorPanel)?.hint}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#222] bg-[#0A0A0A] px-3 py-2 text-right">
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-500">Slide ativo</p>
                            <p className="text-sm text-white font-semibold mt-1">{currentSlideNumber}/{generatedSlides.length}</p>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {renderEditorPanelContent()}
                    </div>
                </div>

                {/* CENTRO: PREVIEW REAL-TIME (Canvas) */}
                <div className="flex-1 min-w-0 flex flex-col bg-[#0A0A0A] border border-[#222] rounded-[2rem] p-5 xl:p-6 relative overflow-hidden group">
                    {/* Liquid Gold / Spotlight Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative z-10 w-full flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary mb-2">Preview ao vivo</p>
                            <h3 className="text-lg font-bold text-white">Slide {currentSlideNumber} de {generatedSlides.length}</h3>
                            <p className="text-xs text-gray-500 mt-1">Edite texto, visual, ordem e estilo sem sair da prévia.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="text-xs" onClick={() => duplicateSlideAt(selectedSlideIndex)}>
                                Duplicar
                            </Button>
                            <Button variant="secondary" className="text-xs" onClick={() => insertSlideAfter(selectedSlideIndex)}>
                                <Plus size={12} className="mr-1" /> Novo slide
                            </Button>
                        </div>
                    </div>
                    
                    {/* Representação do Slide (Layering) */}
                    <div className={`relative z-10 w-full max-w-md ${getPreviewAspectClass(currentSlide.templateId)} overflow-hidden rounded-3xl border border-[#222] shadow-2xl`} style={previewFrameStyle}>
                        {generatedImages[currentSlide.id] && !currentSlide.imageUrl ? (
                            <img
                                src={generatedImages[currentSlide.id]}
                                alt={`Slide ${currentSlide.id}`}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : premiumPreviewMarkup ? (
                            <iframe
                                title={`Preview ${selectedTemplateLabel}`}
                                srcDoc={premiumPreviewMarkup}
                                className="h-full w-full border-0 bg-transparent"
                                sandbox="allow-same-origin"
                            />
                        ) : (
                            <>
                        {currentSlide.templateId === 'spotlight' && (
                            <div className="relative w-full h-full flex items-center justify-center p-10 text-center">
                                {currentSlideImage ? (
                                    <img src={currentSlideImage} alt="Slide background" className="absolute inset-0 w-full h-full opacity-40" style={previewImageStyle} />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,0,255,0.16),transparent_38%),linear-gradient(180deg,#101010,#0a0a0a)]" />
                                )}
                                <div className="absolute inset-0 bg-black/45" />
                                <div className="absolute w-[72%] aspect-square rounded-full border border-white/10 bg-[#101010]/65 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.35)]" />
                                <div className="relative z-10 max-w-[80%]" style={{ textAlign: currentSlide.textAlign }}>
                                    {renderPreviewBrandBadge()}
                                    <p className="mt-4 text-[10px] uppercase tracking-[0.24em] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                    <h2 className="font-bold leading-none mt-5 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <p className="text-gray-300 leading-relaxed mt-4" style={previewBodyStyle}>{currentSlide.body}</p>
                                    <span className="block text-[10px] text-gray-500 font-bold tracking-[0.08em] mt-6">{carouselBrandProfile.brandHandle}</span>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'split' && (
                            <div className={`${currentSlideImagePlacement === 'half' ? 'grid grid-cols-[1.08fr_0.92fr]' : 'relative'} h-full`}>
                                {currentSlideImagePlacement === 'background' && currentSlideImage && (
                                    <img src={currentSlideImage} alt="Slide background" className="absolute inset-0 w-full h-full opacity-25" style={previewImageStyle} />
                                )}
                                <div className={`relative overflow-hidden ${currentSlideImagePlacement === 'half' ? '' : 'hidden'}`}>
                                    {currentSlideImage && currentSlideImagePlacement === 'half' ? (
                                        <img src={currentSlideImage} alt="Slide background" className="absolute inset-0 w-full h-full" style={previewImageStyle} />
                                    ) : (
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(153,0,255,0.2),transparent_35%),linear-gradient(135deg,#181818,#090909)]" />
                                    )}
                                    <div className="absolute inset-0 bg-black/25" />
                                    <div className="absolute left-6 bottom-6 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">Entrelaç[OS]</div>
                                </div>
                                <div className={`relative p-7 flex flex-col justify-between ${currentSlideImagePlacement === 'half' ? 'border-l border-white/5' : ''}`} style={previewFrameStyle}>
                                    <div className={`flex flex-col ${textBlockAlignmentClass}`}>
                                        {renderPreviewBrandBadge()}
                                        <p className="mt-4 text-[10px] uppercase tracking-[0.24em] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                        <h2 className="font-bold leading-none mt-5 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                        <p className="text-gray-300 leading-relaxed mt-4" style={previewBodyStyle}>{currentSlide.body}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-4">
                                        <span className="text-[10px] text-gray-500 font-bold tracking-[0.08em]">{carouselBrandProfile.brandHandle}</span>
                                            <div className="flex gap-1">
                                                {generatedSlides.map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === selectedSlideIndex ? '' : 'bg-[#333]'}`} style={i === selectedSlideIndex ? previewAccentBackgroundStyle : undefined} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'editorial' && (
                            <div className="relative w-full h-full p-10 flex flex-col justify-between overflow-hidden">
                                <div className="absolute inset-0 pointer-events-none">
                                    {currentSlideImage ? (
                                        <img src={currentSlideImage} alt="Generated content" className="w-full h-full opacity-55" style={previewImageStyle} />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-900/10 blur-3xl scale-150 transform translate-x-1/2 opacity-20" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-[#141414]/50" />
                                </div>

                                <div className="relative" style={{ textAlign: currentSlide.textAlign }}>
                                    {renderPreviewBrandBadge()}
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] mt-6 mb-6" style={previewAccentStyle}>{currentSlide.eyebrow}</h4>
                                    <h2 className="font-bold leading-tight mb-4 italic text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <div className="h-1 w-12 mb-6" style={previewAccentBackgroundStyle} />
                                    <p className="text-gray-300 leading-relaxed" style={previewBodyStyle}>{currentSlide.body}</p>
                                </div>

                                    <div className="relative flex items-center justify-between border-t border-[#333] pt-6">
                                        <span className="text-[10px] text-gray-500 font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <div className="flex gap-1">
                                            {generatedSlides.map((_, i) => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${i === selectedSlideIndex ? '' : 'bg-[#333]'}`} style={i === selectedSlideIndex ? previewAccentBackgroundStyle : undefined} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'story' && (
                            <div className="relative w-full h-full overflow-hidden">
                                {currentSlideImage ? (
                                    <img src={currentSlideImage} alt="Story background" className="absolute inset-0 w-full h-full" style={previewImageStyle} />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,0,255,0.2),transparent_28%),linear-gradient(180deg,#121212,#050505)]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/85" />
                                <div className="absolute top-7 left-7 right-7 flex gap-2">
                                    <div className="h-1.5 rounded-full flex-1" style={previewAccentBackgroundStyle} />
                                    <div className="h-1.5 rounded-full bg-white/20 flex-1" />
                                    <div className="h-1.5 rounded-full bg-white/20 flex-1" />
                                </div>
                                <div className="relative z-10 h-full flex flex-col justify-end p-8" style={{ textAlign: currentSlide.textAlign }}>
                                    {renderPreviewBrandBadge()}
                                    <span className="inline-flex w-max mt-5 px-3 py-1 rounded-full border border-white/10 bg-black/35 uppercase tracking-[0.3em] text-[9px] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</span>
                                    <h2 className="font-bold leading-none mt-5 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <p className="text-gray-300 leading-relaxed mt-4" style={previewBodyStyle}>{currentSlide.body}</p>
                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <span className="text-[10px] text-gray-500 tracking-[0.08em] font-bold">{currentSlide.footerLabel}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'reel' && (
                            <div className="relative w-full h-full overflow-hidden">
                                {currentSlideImage ? (
                                    <img src={currentSlideImage} alt="Reel cover background" className="absolute inset-0 w-full h-full" style={previewImageStyle} />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,0,255,0.14),transparent_30%),linear-gradient(180deg,#141414,#020202)]" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/90" />
                                <div className="absolute top-8 right-8 px-4 py-2 rounded-full border border-white/10 bg-black/40 uppercase tracking-[0.24em] text-[9px] font-bold text-white">Reel</div>
                                <div className="relative z-10 h-full flex flex-col justify-end p-8" style={{ textAlign: currentSlide.textAlign }}>
                                    {renderPreviewBrandBadge()}
                                    <p className="text-[10px] uppercase tracking-[0.32em] font-bold mt-4 mb-4" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                    <h2 className="font-bold leading-none text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <p className="text-gray-300 leading-relaxed mt-4" style={previewBodyStyle}>{currentSlide.body}</p>
                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <span className="text-[10px] text-gray-500 tracking-[0.08em] font-bold">{currentSlide.footerLabel}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'carousel-cover' && (
                            <div className="relative w-full h-full p-5">
                                <div className="relative h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                    {currentSlideImage ? (
                                        <img src={currentSlideImage} alt="Carousel cover background" className="absolute inset-0 w-full h-full" style={previewImageStyle} />
                                    ) : (
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(153,0,255,0.2),transparent_30%),linear-gradient(135deg,#151515,#060606)]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/85" />
                                    <div className="relative z-10 h-full flex flex-col justify-between p-8" style={{ textAlign: currentSlide.textAlign }}>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                            {renderPreviewBrandBadge()}
                                            <h2 className="font-bold leading-none mt-6 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                            <p className="text-gray-300 leading-relaxed mt-4 max-w-[85%]" style={previewBodyStyle}>{currentSlide.body}</p>
                                        </div>
                                        <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                            <div className="flex gap-1">
                                                <div className="w-4 h-1 rounded-full" style={previewAccentBackgroundStyle} />
                                                <div className="w-1 h-1 rounded-full bg-white/25" />
                                                <div className="w-1 h-1 rounded-full bg-white/25" />
                                                <div className="w-1 h-1 rounded-full bg-white/25" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'entrelacos-orbit' && (
                            <div className="relative w-full h-full overflow-hidden" style={previewFrameStyle}>
                                {currentSlideImage && currentSlideImagePlacement === 'background' && (
                                    <img src={currentSlideImage} alt="Entrelaços orbit visual" className="absolute inset-0 w-full h-full opacity-20" style={previewImageStyle} />
                                )}
                                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at top right, ${currentSlide.accentColor}22, transparent 24%), radial-gradient(circle at bottom left, ${currentSlide.secondaryColor}20, transparent 26%)` }} />
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[120%] h-[55%] rounded-b-[100%] border border-white/10 opacity-35" />
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[84%] h-[40%] rounded-b-[100%] border border-white/10 opacity-20" />
                                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                                    <div className="flex items-center justify-between text-[10px] tracking-[0.08em] font-bold" style={{ color: `${currentSlide.textColor}aa` }}>
                                        <span>{carouselBrandProfile.brandHandle}</span>
                                        <span>{carouselBrandProfile.studioLabel}</span>
                                    </div>
                                    <div className={`flex flex-col ${textBlockAlignmentClass}`}>
                                        {renderPreviewBrandBadge()}
                                        <p className="mt-8 text-[10px] uppercase tracking-[0.4em] font-bold" style={previewSecondaryStyle}>{currentSlide.eyebrow}</p>
                                        <h2 className={`font-bold leading-none mt-5 max-w-[86%] ${alignedWidthClass}`} style={{ ...previewTitleStyle, color: currentSlide.textColor }}>{currentSlide.title}</h2>
                                        <p className={`leading-relaxed mt-5 max-w-[74%] ${alignedWidthClass}`} style={{ ...previewBodyStyle, color: `${currentSlide.textColor}cc` }}>{currentSlide.body}</p>
                                    </div>
                                    <div className="flex items-center justify-between rounded-[2rem] border border-white/10 px-5 py-4" style={previewSurfaceStyle}>
                                        <span className="text-[10px] tracking-[0.08em] font-bold" style={{ color: `${currentSlide.textColor}aa` }}>{currentSlide.footerLabel}</span>
                                        <div className="h-10 w-10 rounded-full" style={{ background: `linear-gradient(135deg, ${currentSlide.accentColor}, ${currentSlide.secondaryColor})` }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'entrelacos-ribbon' && (
                            <div className="relative w-full h-full overflow-hidden" style={previewFrameStyle}>
                                {currentSlideImage && currentSlideImagePlacement === 'background' && (
                                    <img src={currentSlideImage} alt="Entrelaços ribbon background" className="absolute inset-0 w-full h-full opacity-18" style={previewImageStyle} />
                                )}
                                <div className="absolute inset-x-0 top-0 h-20" style={{ background: `linear-gradient(90deg, ${currentSlide.accentColor}, ${currentSlide.secondaryColor})` }} />
                                <div className="absolute right-0 top-24 w-[38%] h-[56%] rounded-l-[3rem]" style={{ backgroundColor: `${currentSlide.secondaryColor}1d` }} />
                                <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                                    <div className={`flex flex-col ${textBlockAlignmentClass}`}>
                                        <span className="inline-flex px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold" style={{ backgroundColor: `${currentSlide.accentColor}22`, color: currentSlide.accentColor, border: `1px solid ${currentSlide.accentColor}33` }}>{currentSlide.eyebrow}</span>
                                        <h2
                                            className={`font-bold mt-10 max-w-[36rem] ${alignedWidthClass}`}
                                            style={{ ...previewTitleStyle, fontSize: `${Math.min(currentSlide.titleFontSize, 54)}px`, lineHeight: '1.02', color: currentSlide.textColor }}
                                        >
                                            {currentSlide.title}
                                        </h2>
                                        <p
                                            className={`mt-6 max-w-[31rem] ${alignedWidthClass}`}
                                            style={{ ...previewBodyStyle, color: `${currentSlide.textColor}cc` }}
                                        >
                                            {currentSlide.body}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-[1.1fr_0.9fr] gap-4 items-stretch">
                                        <div className="rounded-[2rem] p-5 border border-white/10 flex flex-col justify-between" style={previewSurfaceStyle}>
                                            <p className="text-[10px] tracking-[0.08em] font-bold" style={previewAccentStyle}>{carouselBrandProfile.brandName}</p>
                                            <p className="text-sm mt-3 leading-[1.55]" style={{ color: `${currentSlide.textColor}cc` }}>Família editorial da Entrelaços com blocos, fitas e contraste sofisticado, mantendo leitura limpa entre headline, apoio e mídia.</p>
                                        </div>
                                        <div className="rounded-[2rem] overflow-hidden border border-white/10 min-h-[220px]" style={previewSurfaceStyle}>
                                            {currentSlideImage && currentSlideImagePlacement === 'half' ? (
                                                <img src={currentSlideImage} alt="Entrelaços ribbon visual" className="w-full h-full" style={previewImageStyle} />
                                            ) : (
                                                <div className="w-full h-full" style={{ background: `radial-gradient(circle at center, ${currentSlide.secondaryColor}26, transparent 35%), linear-gradient(180deg, ${currentSlide.surfaceColor}, ${currentSlide.backgroundColor})` }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'entrelacos-mosaic' && (
                            <div className="relative w-full h-full overflow-hidden" style={previewFrameStyle}>
                                {currentSlideImage && currentSlideImagePlacement === 'background' && (
                                    <img src={currentSlideImage} alt="Entrelaços mosaic background" className="absolute inset-0 w-full h-full opacity-15" style={previewImageStyle} />
                                )}
                                <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${currentSlide.accentColor}14, transparent 28%), linear-gradient(315deg, ${currentSlide.secondaryColor}16, transparent 24%)` }} />
                                <div className="relative z-10 h-full p-8 grid grid-cols-[1fr_1fr] grid-rows-[auto_1fr_auto] gap-4">
                                    <div className="col-span-2 flex items-center justify-between">
                                        {renderPreviewBrandBadge()}
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={previewSecondaryStyle}>{currentSlide.eyebrow}</span>
                                    </div>
                                    <div className={`rounded-[2rem] p-6 border border-white/10 flex flex-col ${textBlockAlignmentClass}`} style={previewSurfaceStyle}>
                                        <h2 className="font-bold leading-none" style={{ ...previewTitleStyle, color: currentSlide.textColor }}>{currentSlide.title}</h2>
                                        <p className="mt-5 leading-relaxed" style={{ ...previewBodyStyle, color: `${currentSlide.textColor}cc` }}>{currentSlide.body}</p>
                                    </div>
                                    <div className="rounded-[2rem] overflow-hidden border border-white/10" style={previewSurfaceStyle}>
                                        {currentSlideImage && currentSlideImagePlacement === 'half' ? (
                                            <img src={currentSlideImage} alt="Entrelaços mosaic visual" className="w-full h-full" style={previewImageStyle} />
                                        ) : (
                                            <div className="w-full h-full" style={{ background: `radial-gradient(circle at top right, ${currentSlide.accentColor}28, transparent 28%), radial-gradient(circle at bottom left, ${currentSlide.secondaryColor}24, transparent 30%), linear-gradient(180deg, ${currentSlide.surfaceColor}, ${currentSlide.backgroundColor})` }} />
                                        )}
                                    </div>
                                    <div className="col-span-2 rounded-[2rem] border border-white/10 px-5 py-4 flex items-center justify-between" style={previewSurfaceStyle}>
                                        <span className="text-[10px] tracking-[0.08em] font-bold" style={{ color: `${currentSlide.textColor}aa` }}>{carouselBrandProfile.brandHandle}</span>
                                        <div className="flex gap-2">
                                            <div className="h-3 w-3 rounded-full" style={previewAccentBackgroundStyle} />
                                            <div className="h-3 w-3 rounded-full" style={previewSecondaryBackgroundStyle} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'memo' && (
                            <div className={`${currentSlideImagePlacement === 'half' ? 'grid grid-cols-[0.95fr_1.05fr]' : 'relative'} h-full`}>
                                {currentSlideImagePlacement === 'background' && currentSlideImage && (
                                    <img src={currentSlideImage} alt="Memo slide background" className="absolute inset-0 w-full h-full opacity-20" style={previewImageStyle} />
                                )}
                                <div className={`relative overflow-hidden ${currentSlideImagePlacement === 'half' ? 'border-r border-white/10' : 'hidden'}`} style={{ backgroundColor: `${currentSlide.accentColor}18` }}>
                                    {currentSlideImage && currentSlideImagePlacement === 'half' ? (
                                        <img src={currentSlideImage} alt="Memo slide visual" className="absolute inset-0 w-full h-full" style={previewImageStyle} />
                                    ) : (
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(153,0,255,0.18),transparent_35%),linear-gradient(180deg,#1a1a1a,#0a0a0a)]" />
                                    )}
                                    <div className="absolute inset-0 bg-black/12" />
                                    <div className="absolute left-5 bottom-5 right-5 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur">
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">Espaço visual</p>
                                        <p className="text-xs text-gray-400 mt-2 leading-[1.5]">Imagem editável por slide para sustentar a ideia central com composição limpa.</p>
                                    </div>
                                </div>
                                <div className="relative p-8 flex flex-col justify-between" style={previewFrameStyle}>
                                    <div className={`flex flex-col ${textBlockAlignmentClass}`}>
                                        {renderPreviewBrandBadge()}
                                        <span className="inline-flex mt-5 px-3 py-1 rounded-full border border-white/10 bg-black/20 uppercase tracking-[0.25em] text-[9px] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</span>
                                        <h2
                                            className={`font-bold mt-5 text-white max-w-[34rem] ${alignedWidthClass}`}
                                            style={{ ...previewTitleStyle, fontSize: `${Math.min(currentSlide.titleFontSize, 52)}px`, lineHeight: '1.04' }}
                                        >
                                            {currentSlide.title}
                                        </h2>
                                        <p
                                            className={`text-gray-300 mt-5 max-w-[30rem] ${alignedWidthClass}`}
                                            style={previewBodyStyle}
                                        >
                                            {currentSlide.body}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                        <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <span className="text-[10px] text-gray-500 tracking-[0.08em] font-bold">{currentSlide.footerLabel}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'twitter-comment' && (
                            <div className="relative w-full h-full p-6" style={previewFrameStyle}>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%)]" />
                                <div className="relative h-full rounded-[28px] border border-white/10 bg-[#0f1419] p-6 shadow-2xl flex flex-col">
                                    <div className="flex items-start gap-4">
                                        {carouselBrandProfile.profileImageUrl ? (
                                            <img src={carouselBrandProfile.profileImageUrl} alt="Perfil" className="h-12 w-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-black" style={previewAccentBackgroundStyle}>@</div>
                                        )}
                                        <div className={`flex-1 min-w-0 flex flex-col ${textBlockAlignmentClass}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-white">{carouselBrandProfile.brandName}</span>
                                                <span className="text-xs text-gray-500">{carouselBrandProfile.brandHandle}</span>
                                            </div>
                                            <p className="mt-4 text-[10px] uppercase tracking-[0.24em] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                            <h2
                                                className={`font-bold mt-4 text-white max-w-[34rem] ${alignedWidthClass}`}
                                                style={{ ...previewTitleStyle, fontSize: `${Math.min(currentSlide.titleFontSize, 42)}px`, lineHeight: '1.08' }}
                                            >
                                                {currentSlide.title}
                                            </h2>
                                            <p
                                                className={`text-gray-300 mt-4 max-w-[32rem] ${alignedWidthClass}`}
                                                style={previewBodyStyle}
                                            >
                                                {currentSlide.body}
                                            </p>
                                            {currentSlideImage && (
                                                <div className={`mt-5 rounded-2xl overflow-hidden border border-white/10 w-full ${currentSlideImagePlacement === 'background' ? 'max-w-[34rem]' : 'max-w-[30rem]'} ${alignedWidthClass}`}>
                                                    <img src={currentSlideImage} alt="Comment visual" className="w-full h-48" style={previewImageStyle} />
                                                </div>
                                            )}
                                            <div className="mt-auto pt-5 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 w-full">
                                                <span>9:41 AM · Mar 28, 2026</span>
                                                <span style={previewAccentStyle}>{currentSlide.footerLabel}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSlide.templateId === 'quote-card' && (
                            <div className="relative w-full h-full p-8 flex flex-col justify-between" style={previewFrameStyle}>
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%)]" />
                                <div className="relative z-10">
                                    {renderPreviewBrandBadge()}
                                    <p className="mt-6 text-[10px] uppercase tracking-[0.24em] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                    <div className="mt-6 text-6xl leading-none" style={previewAccentStyle}>“</div>
                                    <h2 className="font-bold leading-tight mt-4 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <p className="text-gray-300 leading-relaxed mt-5" style={previewBodyStyle}>{currentSlide.body}</p>
                                </div>
                                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5">
                                        <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <span className="text-[10px] text-gray-500 tracking-[0.08em] font-bold">{currentSlide.footerLabel}</span>
                                </div>
                            </div>
                        )}

                        {currentTemplateId === 'checklist' && (
                            <div className="relative w-full h-full p-8 flex flex-col justify-between" style={previewFrameStyle}>
                                <div className="relative z-10">
                                    {renderPreviewBrandBadge()}
                                    <p className="mt-5 text-[10px] uppercase tracking-[0.24em] font-bold" style={previewAccentStyle}>{currentSlide.eyebrow}</p>
                                    <h2 className="font-bold leading-tight mt-5 text-white" style={previewTitleStyle}>{currentSlide.title}</h2>
                                    <div className="mt-6 space-y-3">
                                        {currentSlide.body.split('\n').filter(Boolean).slice(0, 5).map((line, index) => (
                                            <div key={`${line}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0" style={previewAccentBackgroundStyle}>
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm text-gray-200 leading-relaxed">{line}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5">
                                    <span className="text-[10px] text-gray-400 tracking-[0.08em] font-bold">{carouselBrandProfile.brandHandle}</span>
                                        <span className="text-[10px] text-gray-500 tracking-[0.08em] font-bold">{currentSlide.footerLabel}</span>
                                </div>
                            </div>
                        )}
                            </>
                        )}
                    </div>

                    <div className="relative z-10 mt-6 rounded-[1.5rem] border border-[#222] bg-[#111] p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Filmstrip do carrossel</p>
                                <p className="text-xs text-gray-500 mt-1">Navegue, reorganize e revise o pack sem perder o canvas de vista.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 bg-[#141414] border border-[#222] rounded-full text-gray-400 hover:text-primary transition-colors" onClick={() => moveSlideAt(selectedSlideIndex, 'left')} disabled={selectedSlideIndex === 0}>
                                    <ChevronLeft size={18} />
                                </button>
                                <button className="p-3 bg-[#141414] border border-[#222] rounded-full text-gray-400 hover:text-primary transition-colors" onClick={() => moveSlideAt(selectedSlideIndex, 'right')} disabled={selectedSlideIndex === generatedSlides.length - 1}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {generatedSlides.map((slide, i) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    draggable
                                    onClick={() => setSelectedSlideIndex(i)}
                                    onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', String(i));
                                        setDraggingSlideIndex(i);
                                    }}
                                    onDragEnd={() => setDraggingSlideIndex(null)}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const rawIndex = event.dataTransfer.getData('text/plain');
                                        const fromIndex = rawIndex ? Number(rawIndex) : draggingSlideIndex;
                                        if (typeof fromIndex === 'number' && Number.isFinite(fromIndex)) {
                                            moveSlideToIndex(fromIndex, i);
                                        }
                                        setDraggingSlideIndex(null);
                                    }}
                                    className={`min-w-[220px] rounded-2xl border p-4 text-left transition-all ${
                                        i === selectedSlideIndex
                                            ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(153,0,255,0.18)]'
                                            : draggingSlideIndex === i
                                                ? 'border-primary/50 bg-primary/5'
                                                : 'border-[#222] bg-[#0A0A0A] hover:border-[#333]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <GripVertical size={14} className="text-gray-500 shrink-0" />
                                            <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Slide {i + 1}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500">{TEMPLATE_OPTIONS.find((template) => template.id === normalizeBrandingTemplateForEditor(slide.templateId))?.name || normalizeBrandingTemplateForEditor(slide.templateId)}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-white truncate">{slide.title}</p>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{slide.body}</p>
                                    <p className="text-[10px] text-gray-600 mt-3">Arraste para reordenar</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO: EXPORT & PIPELINE */}
                <div className="w-full xl:w-[300px] shrink-0 flex flex-col gap-4">
                    <div className="bg-[#141414] border border-[#222] rounded-2xl p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
                            <Monitor size={14} className="text-primary" />
                            Mesa do Slide
                        </h3>
                        <div className="space-y-4">
                            <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-500">Ativo agora</p>
                                <p className="text-sm font-semibold text-white mt-2">Slide {currentSlideNumber}</p>
                                <p className="text-xs text-gray-500 mt-2">{selectedTemplateLabel}</p>
                            </div>
                            <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-500">Marca aplicada</p>
                                <p className="text-sm text-white mt-2">{brandVisualIdentity.brandName}</p>
                                <p className="text-xs text-gray-500 mt-1">{brandVisualIdentity.brandHandle}</p>
                            </div>
                            <div className="rounded-xl border border-[#222] bg-[#0A0A0A] p-4">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-gray-500">Ações rápidas</p>
                                <div className="grid grid-cols-1 gap-2 mt-3">
                                    <Button variant="ghost" className="text-[10px] h-10" onClick={() => duplicateSlideAt(selectedSlideIndex)}>
                                        Duplicar slide
                                    </Button>
                                    <Button variant="ghost" className="text-[10px] h-10" onClick={() => setPackagingEditorPanel('ai')}>
                                        Abrir copiloto IA
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                        <Button 
                            variant="secondary"
                            className="w-full py-4 h-auto rounded-2xl font-bold text-xs justify-center"
                            onClick={handleExportCurrentSlide}
                            disabled={isExportingCurrent}
                        >
                            <Download size={16} />
                            {isExportingCurrent ? 'Renderizando PNG...' : 'Exportar PNG High-Res'}
                        </Button>
                        <button 
                            className="w-full bg-[#F9F9F9] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                            onClick={handleNext}
                        >
                            Revisar entrega
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderExport = () => (
        <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Entrega do Ativo</h2>
            <p className="text-gray-500 mb-4 font-serif">Os exportes implementados ficam disponíveis aqui. Ações ainda não integradas aparecem como indisponíveis.</p>

            <div className="flex gap-4">
                <Button variant="secondary" className="w-48 h-12 text-sm" disabled>
                    <FileText size={18} className="mr-2"/> PDF em breve
                </Button>
                <Button variant="primary" className="w-48 h-12 text-sm" onClick={handleDownloadPngPack} disabled={isExportingPack}>
                    <Download size={18} className="mr-2"/> {isExportingPack ? 'Renderizando...' : 'Download PNG Pack'}
                </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-[#222] w-full max-w-lg text-center">
                <p className="text-xs text-gray-600 uppercase font-bold tracking-widest mb-4">Salvar no Ecossistema</p>
                <div className="flex justify-center gap-4">
                    <Button variant="ghost" className="text-xs" disabled>Drive em breve</Button>
                    <Button variant="ghost" className="text-xs" disabled>Notion em breve</Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">Use o pack PNG para entrega imediata. Integrações externas serão liberadas quando concluídas.</p>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="shrink-0 mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Mind to App (Branding OS)</h2>
                    <p className="text-gray-500 text-sm font-serif">Ingestão, Decomposição e Construção de Ativos.</p>
                </div>
                {currentStep > 0 && currentStep < STEPS.length - 1 && (
                     <Button variant="ghost" onClick={handleBack} className="text-xs"><ChevronLeft size={14} className="mr-1"/> Voltar</Button>
                )}
            </div>

            {renderStepper()}

            <div className="flex-1 min-h-0 overflow-hidden relative">
                {currentStep === 0 && renderManifesto()}
                {currentStep === 1 && renderEditorialLines()}
                {currentStep === 2 && renderCalendar()}
                {currentStep === 3 && renderAssetSelection()}
                {currentStep === 4 && renderIngestion()}
                {currentStep === 5 && renderDecomposition()}
                {currentStep === 6 && renderConstruction()}
                {currentStep === 7 && renderPackaging()}
                {currentStep === 8 && renderExport()}
            </div>
        </div>
    );
};
