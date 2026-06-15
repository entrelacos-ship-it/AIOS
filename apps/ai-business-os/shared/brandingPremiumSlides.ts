export const PREMIUM_BRANDING_TEMPLATE_OPTIONS = [
  { id: 'entrelacos-premium-cover', name: 'Premium Cover' },
  { id: 'entrelacos-premium-insight', name: 'Premium Insight' },
  { id: 'entrelacos-premium-showcase', name: 'Premium Showcase' },
  { id: 'entrelacos-premium-quote', name: 'Premium Quote' },
] as const;

export const PREMIUM_BRANDING_COVER_TEMPLATE_ID = 'entrelacos-premium-cover';
export const PREMIUM_BRANDING_ROTATION = [
  'entrelacos-premium-insight',
  'entrelacos-premium-showcase',
  'entrelacos-premium-quote',
] as const;

export const SUPPORTED_BRANDING_HTML_TEMPLATE_IDS = [
  'entrelacos-premium-cover',
  'entrelacos-premium-insight',
  'entrelacos-premium-showcase',
  'entrelacos-premium-quote',
  'editorial',
  'spotlight',
  'split',
  'entrelacos-orbit',
  'entrelacos-ribbon',
  'entrelacos-mosaic',
  'memo',
  'twitter-comment',
  'quote-card',
  'checklist',
  'story',
  'reel',
  'carousel-cover',
] as const;

export type PremiumBrandingTemplateId = typeof PREMIUM_BRANDING_TEMPLATE_OPTIONS[number]['id'];
export type BrandingHtmlTemplateId = typeof SUPPORTED_BRANDING_HTML_TEMPLATE_IDS[number];

const LEGACY_BRANDING_TEMPLATE_ID_ALIASES: Record<string, BrandingHtmlTemplateId> = {
  'aiox-neon-hero': 'entrelacos-orbit',
  'aiox-search-panel': 'entrelacos-ribbon',
  'aiox-agent-panel': 'entrelacos-mosaic',
  'aiox-command-glass': 'entrelacos-ribbon',
  'aiox-promo-launch': 'carousel-cover',
  'aiox-prize-list': 'entrelacos-mosaic',
};

export interface BrandingPremiumSlideInput {
  title: string;
  body: string;
  eyebrow?: string;
  footerLabel?: string;
  imageUrl?: string;
  templateId?: string;
  brandName?: string;
  brandHandle?: string;
  brandStudioLabel?: string;
  profileImageUrl?: string;
  accentColor?: string;
  secondaryColor?: string;
  surfaceColor?: string;
  textColor?: string;
  backgroundColor?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  titleFontFamily?: 'serif' | 'sans';
  bodyFontFamily?: 'serif' | 'sans';
  imageFit?: 'cover' | 'contain';
  imageScale?: number;
}

export interface BrandingTypographyGuide {
  formatLabel: string;
  titleMin: number;
  bodyMin: number;
  captionMin: number;
}

type NormalizedSlide = ReturnType<typeof normalizeSlide>;

const DEFAULT_BRAND = 'Entrelaç[OS]';
const DEFAULT_HANDLE = '@entrelacos.ai';
const DEFAULT_STUDIO = 'Entrelaços Studio';
const DEFAULT_ACCENT = '#8b5cf6';
const DEFAULT_SECONDARY = '#f97316';
const DEFAULT_SURFACE = '#161625';
const DEFAULT_TEXT = '#f8fafc';
const DEFAULT_BACKGROUND = '#0a0a0f';
const DEFAULT_EYEBROW = 'Estrutura também é cuidado';
const DEFAULT_FOOTER = 'Carrossel';

const HERO_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'entrelacos-premium-cover',
  'editorial',
  'carousel-cover',
  'entrelacos-orbit',
]);

const INSIGHT_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'entrelacos-premium-insight',
  'spotlight',
  'memo',
  'quote-card',
]);

const SHOWCASE_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'entrelacos-premium-showcase',
  'split',
  'entrelacos-ribbon',
  'entrelacos-mosaic',
]);

const QUOTE_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'entrelacos-premium-quote',
]);

const LIST_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'checklist',
]);

const VERTICAL_TEMPLATES = new Set<BrandingHtmlTemplateId>([
  'story',
  'reel',
]);

export const isPremiumBrandingTemplate = (templateId?: string): templateId is BrandingHtmlTemplateId =>
  Boolean(templateId) && SUPPORTED_BRANDING_HTML_TEMPLATE_IDS.includes(templateId as BrandingHtmlTemplateId);

export const getBrandingTypographyGuide = (templateId?: string): BrandingTypographyGuide => {
  if (templateId === 'story' || templateId === 'reel') {
    return {
      formatLabel: 'Instagram Story / Reel',
      titleMin: 56,
      bodyMin: 32,
      captionMin: 20,
    };
  }

  return {
    formatLabel: 'Instagram Post / Carousel',
    titleMin: 58,
    bodyMin: 34,
    captionMin: 24,
  };
};

const normalizeTemplateId = (templateId?: string): BrandingHtmlTemplateId | null => {
  if (!templateId) return null;
  const normalizedTemplateId = LEGACY_BRANDING_TEMPLATE_ID_ALIASES[templateId] || templateId;
  return isPremiumBrandingTemplate(normalizedTemplateId) ? normalizedTemplateId : null;
};

export const normalizeBrandingTemplateId = normalizeTemplateId;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toMarkupLines = (value: string, maxLines: number) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);

const getTemplateBadge = (templateId: BrandingHtmlTemplateId) => {
  switch (templateId) {
    case 'story':
      return 'Story';
    case 'reel':
      return 'Reel';
    case 'twitter-comment':
      return 'Social';
    default:
      return 'Entrelaç[OS]';
  }
};

const getDefaultTitleSize = (templateId: BrandingHtmlTemplateId) => {
  if (templateId === 'story' || templateId === 'reel') return 78;
  if (templateId === 'entrelacos-premium-cover' || templateId === 'carousel-cover' || templateId === 'entrelacos-orbit') {
    return 68;
  }
  if (SHOWCASE_TEMPLATES.has(templateId)) {
    return 62;
  }
  return 58;
};

const getDefaultBodySize = (templateId: BrandingHtmlTemplateId) => {
  if (templateId === 'story' || templateId === 'reel') return 36;
  if (templateId === 'twitter-comment') return 32;
  return 34;
};

const getAdaptiveTitleSize = (
  templateId: BrandingHtmlTemplateId,
  title: string,
  requestedSize: number,
) => {
  const length = title.trim().length;
  let adjustedSize = requestedSize;

  if (VERTICAL_TEMPLATES.has(templateId)) {
    if (length > 82) adjustedSize -= 10;
    else if (length > 64) adjustedSize -= 6;
  } else if (HERO_TEMPLATES.has(templateId) || SHOWCASE_TEMPLATES.has(templateId)) {
    if (length > 96) adjustedSize -= 12;
    else if (length > 78) adjustedSize -= 8;
    else if (length > 62) adjustedSize -= 4;
  } else if (length > 84) {
    adjustedSize -= 6;
  }

  return adjustedSize;
};

const normalizeSlide = (slide: BrandingPremiumSlideInput, templateId: BrandingHtmlTemplateId) => {
  const guide = getBrandingTypographyGuide(templateId);
  const imageScale = typeof slide.imageScale === 'number' && Number.isFinite(slide.imageScale)
    ? Math.min(140, Math.max(80, slide.imageScale))
    : 100;

  const title = slide.title || 'Sem título';
  const body = slide.body || 'Adicione uma copy objetiva para este card.';
  const titleSize = getAdaptiveTitleSize(
    templateId,
    title,
    slide.titleFontSize || getDefaultTitleSize(templateId),
  );

  return {
    templateId,
    badge: getTemplateBadge(templateId),
    title: escapeHtml(title),
    body: escapeHtml(body),
    bodyLines: toMarkupLines(body, 6).map(escapeHtml),
    eyebrow: escapeHtml(slide.eyebrow || DEFAULT_EYEBROW),
    footerLabel: escapeHtml(slide.footerLabel || DEFAULT_FOOTER),
    brandName: escapeHtml(slide.brandName || DEFAULT_BRAND),
    brandHandle: escapeHtml(slide.brandHandle || DEFAULT_HANDLE),
    brandStudioLabel: escapeHtml(slide.brandStudioLabel || DEFAULT_STUDIO),
    profileImageUrl: slide.profileImageUrl || '',
    imageUrl: slide.imageUrl || '',
    accentColor: slide.accentColor || DEFAULT_ACCENT,
    secondaryColor: slide.secondaryColor || DEFAULT_SECONDARY,
    surfaceColor: slide.surfaceColor || DEFAULT_SURFACE,
    textColor: slide.textColor || DEFAULT_TEXT,
    backgroundColor: slide.backgroundColor || DEFAULT_BACKGROUND,
    titleFontSize: Math.max(titleSize, guide.titleMin),
    bodyFontSize: Math.max(slide.bodyFontSize || getDefaultBodySize(templateId), guide.bodyMin),
    captionFontSize: guide.captionMin,
    titleFontFamily: slide.titleFontFamily || 'sans',
    bodyFontFamily: slide.bodyFontFamily || 'sans',
    textAlign: slide.textAlign || 'left',
    imageFit: slide.imageFit || 'cover',
    imageScale: imageScale / 100,
  };
};

const isTallTemplate = (templateId: BrandingHtmlTemplateId) =>
  templateId === 'story' ||
  templateId === 'reel' ||
  templateId === 'entrelacos-premium-cover' ||
  templateId === 'entrelacos-orbit' ||
  templateId === 'entrelacos-ribbon' ||
  templateId === 'entrelacos-mosaic' ||
  templateId === 'carousel-cover';

const getFormatLabel = (slide: NormalizedSlide) => {
  if (slide.templateId === 'story' || slide.templateId === 'reel') {
    return '1080 × 1920';
  }

  if (isTallTemplate(slide.templateId)) {
    return '1080 × 1350';
  }

  return '1080 × 1080';
};

const getActionLabel = (slide: NormalizedSlide) =>
  slide.templateId === 'story' || slide.templateId === 'reel'
    ? 'Compartilhar agora'
    : 'Quero estruturar minha prática';

const getMediaLabel = (slide: NormalizedSlide) => {
  switch (slide.templateId) {
    case 'twitter-comment':
      return 'Recorte social';
    case 'story':
      return 'Story frame';
    case 'reel':
      return 'Reel cover';
    case 'checklist':
      return 'Checklist visual';
    default:
      return 'Direção editorial';
  }
};

const getPulseValue = (slide: NormalizedSlide) => {
  if (slide.badge === 'Entrelaç[OS]') {
    return 'Premium';
  }

  const firstWord = slide.eyebrow.split(/\s+/).find(Boolean);
  return firstWord ? firstWord.toUpperCase() : slide.badge;
};

const getBaseCss = (slide: NormalizedSlide) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700;800&family=Syne:wght@700;800&display=swap');

  :root {
    --bg: ${slide.backgroundColor};
    --surface: ${slide.surfaceColor};
    --text: ${slide.textColor};
    --muted: color-mix(in srgb, ${slide.textColor} 78%, rgba(12, 12, 18, 0.9));
    --muted-soft: color-mix(in srgb, ${slide.textColor} 58%, rgba(12, 12, 18, 0.9));
    --accent: ${slide.accentColor};
    --secondary: ${slide.secondaryColor};
    --panel: color-mix(in srgb, ${slide.surfaceColor} 86%, rgba(9, 9, 16, 0.96));
    --panel-soft: color-mix(in srgb, ${slide.surfaceColor} 66%, rgba(9, 9, 16, 0.84));
    --line: rgba(255,255,255,0.1);
    --title-size: ${slide.titleFontSize}px;
    --body-size: ${slide.bodyFontSize}px;
    --caption-size: ${slide.captionFontSize}px;
    --display-font: ${slide.titleFontFamily === 'serif'
      ? '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
      : '"Syne", "Trebuchet MS", "Segoe UI", sans-serif'};
    --body-font: ${slide.bodyFontFamily === 'serif'
      ? '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
      : '"DM Sans", "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif'};
    --align: ${slide.textAlign};
    --image-fit: ${slide.imageFit};
    --image-scale: ${slide.imageScale};
    --radius-xl: 34px;
    --radius-lg: 26px;
    --radius-md: 20px;
    --shadow-soft: 0 18px 48px rgba(0,0,0,0.28);
    --shadow-strong: 0 36px 120px rgba(0,0,0,0.48);
    --shell-padding: ${VERTICAL_TEMPLATES.has(slide.templateId) ? 28 : isTallTemplate(slide.templateId) ? 34 : 30}px;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  body {
    position: relative;
    overflow: hidden;
    color: var(--text);
    font-family: var(--body-font);
    background:
      radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 34%),
      radial-gradient(circle at 86% 82%, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 28%),
      linear-gradient(180deg, color-mix(in srgb, var(--bg) 94%, #050508), #050508 72%, #040406);
  }

  body::before,
  body::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    filter: blur(110px);
    opacity: 0.48;
    pointer-events: none;
  }

  body::before {
    width: 36vw;
    height: 36vw;
    top: -10vw;
    left: -6vw;
    background: color-mix(in srgb, var(--accent) 32%, transparent);
  }

  body::after {
    width: 32vw;
    height: 32vw;
    right: -8vw;
    bottom: -8vw;
    background: color-mix(in srgb, var(--secondary) 28%, transparent);
  }

  .canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  .canvas::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.06), transparent 18%),
      repeating-linear-gradient(
        90deg,
        rgba(255,255,255,0.025) 0,
        rgba(255,255,255,0.025) 1px,
        transparent 1px,
        transparent 88px
      ),
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.018) 0,
        rgba(255,255,255,0.018) 1px,
        transparent 1px,
        transparent 88px
      );
    opacity: 0.34;
    pointer-events: none;
  }

  .shell {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--shell-padding);
  }

  .panel {
    position: relative;
    border-radius: var(--radius-xl);
    border: 1px solid var(--line);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 14%, transparent), transparent 30%),
      color-mix(in srgb, var(--panel) 94%, rgba(4,4,8,0.96));
    box-shadow: var(--shadow-soft);
    overflow: hidden;
  }

  .panel::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, rgba(255,255,255,0.06), transparent 38%);
    pointer-events: none;
  }

  .glass-soft {
    background:
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)),
      color-mix(in srgb, var(--panel-soft) 94%, rgba(4,4,8,0.9));
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .brand-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    width: max-content;
    max-width: 100%;
    padding: 12px 20px 12px 12px;
    border-radius: 999px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--accent) 18%, transparent), transparent 54%),
      rgba(7, 8, 14, 0.74);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.96);
    font-size: var(--caption-size);
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .brand-chip span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-avatar {
    width: calc(var(--caption-size) * 2.1);
    height: calc(var(--caption-size) * 2.1);
    border-radius: 999px;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    color: #09090d;
    font-size: calc(var(--caption-size) * 0.95);
    font-weight: 900;
    flex-shrink: 0;
  }

  .brand-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .eyebrow {
    margin: 0;
    font-size: var(--caption-size);
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--accent) 78%, white);
  }

  .title {
    margin: 0;
    font-family: var(--display-font);
    font-size: var(--title-size);
    line-height: 0.94;
    letter-spacing: -0.05em;
    text-align: var(--align);
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  .body {
    margin: 0;
    font-size: var(--body-size);
    line-height: 1.36;
    color: var(--muted);
    text-align: var(--align);
  }

  .lede {
    color: rgba(255,255,255,0.88);
  }

  .copy-stack {
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .title-stack {
    display: grid;
    gap: 18px;
  }

  .detail-list {
    display: grid;
    gap: 14px;
  }

  .detail-item {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    padding: 18px 20px;
    border-radius: var(--radius-md);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
      rgba(7,8,14,0.54);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .detail-index {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    color: #09090d;
    font-size: calc(var(--caption-size) * 0.98);
    font-weight: 900;
    box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .detail-item p {
    margin: 0;
    min-width: 0;
    font-size: calc(var(--body-size) * 0.88);
    line-height: 1.34;
    color: rgba(255,255,255,0.9);
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .kpi-card {
    padding: 18px;
    border-radius: 22px;
    min-height: 132px;
  }

  .kpi-label {
    display: block;
    font-size: var(--caption-size);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted-soft);
  }

  .kpi-value {
    display: block;
    margin-top: 12px;
    font-family: var(--display-font);
    font-size: calc(var(--body-size) * 1.08);
    line-height: 1;
    color: rgba(255,255,255,0.98);
  }

  .kpi-card p {
    margin: 10px 0 0;
    font-size: calc(var(--caption-size) * 0.94);
    line-height: 1.4;
    color: var(--muted);
  }

  .footer-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding-top: 22px;
    border-top: 1px solid rgba(255,255,255,0.08);
    color: var(--muted-soft);
  }

  .footer-row span {
    font-size: var(--caption-size);
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .footer-mark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .footer-mark::before {
    content: "";
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 36%, transparent);
  }

  .media-stage {
    position: relative;
    min-height: 0;
    border-radius: var(--radius-xl);
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      radial-gradient(circle at 22% 22%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 28%),
      radial-gradient(circle at 80% 82%, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 30%),
      linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015)),
      linear-gradient(180deg, rgba(11,12,18,0.98), rgba(8,8,12,0.92));
    box-shadow: var(--shadow-strong);
  }

  .media-stage::before,
  .media-stage::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    pointer-events: none;
  }

  .media-stage::before {
    width: 82%;
    height: 82%;
    top: -20%;
    right: -12%;
    opacity: 0.18;
  }

  .media-stage::after {
    width: 58%;
    height: 58%;
    bottom: -12%;
    left: -10%;
    opacity: 0.12;
  }

  .media-image,
  .image-fallback {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .media-image {
    object-fit: var(--image-fit);
    transform: scale(var(--image-scale));
    opacity: 0.68;
  }

  .image-fallback {
    background:
      radial-gradient(circle at 18% 24%, color-mix(in srgb, var(--accent) 44%, transparent), transparent 24%),
      radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--secondary) 38%, transparent), transparent 22%),
      radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 48%);
  }

  .media-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(6,6,10,0.12), rgba(6,6,10,0.52) 62%, rgba(6,6,10,0.82)),
      linear-gradient(145deg, rgba(255,255,255,0.08), transparent 28%);
  }

  .media-orbit {
    position: absolute;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.14);
    pointer-events: none;
  }

  .media-orbit.a {
    width: 72%;
    height: 72%;
    right: -10%;
    top: 8%;
    opacity: 0.2;
  }

  .media-orbit.b {
    width: 46%;
    height: 46%;
    left: 12%;
    bottom: -8%;
    opacity: 0.16;
  }

  .media-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
    z-index: 1;
  }

  .media-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .media-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: max-content;
    max-width: 100%;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(7,8,14,0.42);
    font-size: calc(var(--caption-size) * 0.88);
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-label::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
  }

  .media-card {
    width: 100%;
    max-width: 82%;
    padding: 20px 22px;
    border-radius: 24px;
    min-width: 0;
  }

  .media-card strong,
  .meta-card strong,
  .action-card strong {
    display: block;
    font-size: calc(var(--body-size) * 0.88);
    line-height: 1.22;
    color: rgba(255,255,255,0.98);
  }

  .media-card p,
  .meta-card p,
  .action-card p {
    margin: 8px 0 0;
    font-size: calc(var(--caption-size) * 0.94);
    line-height: 1.42;
    color: var(--muted);
  }

  .meta-card {
    padding: 20px 22px;
    border-radius: 24px;
    min-width: 0;
  }

  .meta-label {
    display: block;
    font-size: var(--caption-size);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted-soft);
  }

  .rail-stack {
    display: grid;
    gap: 16px;
    align-content: start;
  }

  .action-card {
    padding: 22px;
    border-radius: 24px;
    display: grid;
    gap: 18px;
    min-width: 0;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 68px;
    padding: 16px 26px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    color: #09090d;
    font-size: calc(var(--caption-size) * 1.02);
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 18px 42px color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .quote-mark {
    margin: 0;
    font-family: var(--display-font);
    font-size: calc(var(--title-size) * 1.18);
    line-height: 0.7;
    color: color-mix(in srgb, var(--accent) 82%, white);
  }

  .feed-card {
    position: relative;
    border-radius: 32px;
    border: 1px solid rgba(255,255,255,0.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)),
      rgba(10, 14, 20, 0.92);
    box-shadow: var(--shadow-soft);
    overflow: hidden;
  }

  .feed-head {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .feed-meta {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .feed-meta strong {
    font-size: calc(var(--body-size) * 0.78);
    color: rgba(255,255,255,0.98);
  }

  .feed-meta span {
    font-size: var(--caption-size);
    color: var(--muted-soft);
  }

  .story-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 38px;
  }

  .story-media {
    position: absolute;
    inset: 0;
  }

  .story-media img,
  .story-media .image-fallback {
    width: 100%;
    height: 100%;
  }

  .story-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--accent) 20%, transparent), transparent 32%),
      linear-gradient(180deg, rgba(8,8,12,0.06), rgba(8,8,12,0.28) 44%, rgba(8,8,12,0.92));
  }

  .story-bars {
    position: absolute;
    left: 28px;
    right: 28px;
    top: 28px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .story-bars span {
    height: 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.2);
  }

  .story-bars span:first-child {
    background: linear-gradient(90deg, var(--accent), var(--secondary));
  }

  .story-card {
    position: absolute;
    left: 28px;
    right: 28px;
    bottom: 28px;
    padding: 28px;
    border-radius: 34px;
    display: grid;
    gap: 20px;
  }

  .story-card .title {
    font-size: min(var(--title-size), 82px);
  }
`;

const buildBrandChip = (slide: NormalizedSlide) => `
  <div class="brand-chip">
    <div class="brand-avatar">
      ${slide.profileImageUrl
        ? `<img src="${slide.profileImageUrl}" alt="${slide.brandName}" />`
        : `<span>${escapeHtml(slide.brandName.slice(0, 1).toUpperCase() || 'E')}</span>`}
    </div>
    <span>${slide.brandName}</span>
  </div>
`;

const buildFooterRow = (slide: NormalizedSlide) => `
  <div class="footer-row">
    <span class="footer-mark">${slide.brandHandle}</span>
    <span>${slide.footerLabel}</span>
  </div>
`;

const buildBodyItems = (slide: NormalizedSlide, max = 4) =>
  slide.bodyLines.slice(0, max).map((line, index) => `
    <div class="detail-item">
      <div class="detail-index">${index + 1}</div>
      <p>${line}</p>
    </div>
  `).join('');

const buildKpiGrid = (slide: NormalizedSlide) => `
  <div class="kpi-grid">
    <div class="panel glass-soft kpi-card">
      <span class="kpi-label">Formato</span>
      <span class="kpi-value">${getFormatLabel(slide)}</span>
      <p>Proporção pronta para publicação sem improviso visual.</p>
    </div>
    <div class="panel glass-soft kpi-card">
      <span class="kpi-label">Pulso</span>
      <span class="kpi-value">${getPulseValue(slide)}</span>
      <p>Direção editorial alinhada à identidade Entrelaços.</p>
    </div>
    <div class="panel glass-soft kpi-card">
      <span class="kpi-label">Assinatura</span>
      <span class="kpi-value">Studio</span>
      <p>${slide.brandName} com estrutura visual pronta para operar.</p>
    </div>
  </div>
`;

const buildMediaStage = (slide: NormalizedSlide, overlay = '') => `
  <div class="media-stage">
    ${slide.imageUrl
      ? `<img class="media-image" src="${slide.imageUrl}" alt="${slide.title}" />`
      : '<div class="image-fallback"></div>'}
    <div class="media-overlay"></div>
    <div class="media-orbit a"></div>
    <div class="media-orbit b"></div>
    <div class="media-content">
      <div class="media-topline">
        <span class="media-label">${getMediaLabel(slide)}</span>
        <span class="media-label">${slide.badge}</span>
      </div>
      ${overlay}
    </div>
  </div>
`;

const buildActionCard = (slide: NormalizedSlide, message: string) => `
  <div class="panel glass-soft action-card">
    <div>
      <strong>${slide.brandStudioLabel}</strong>
      <p>${message}</p>
    </div>
    <div class="action-button">${getActionLabel(slide)}</div>
  </div>
`;

const renderDocument = (slide: NormalizedSlide, styles: string, markup: string) => `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      ${getBaseCss(slide)}
      ${styles}
    </style>
  </head>
  <body>
    ${markup}
  </body>
</html>
`;

const getHeroMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
        gap: 22px;
        height: 100%;
      }

      .copy-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 34px;
      }

      .hero-side {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 16px;
      }

      .lede {
        max-width: 18ch;
      }
    `,
    `
      <main class="canvas">
        <section class="shell">
          <div class="layout">
            <article class="panel copy-panel">
              <div class="copy-stack">
                ${buildBrandChip(slide)}
                <div class="title-stack">
                  <p class="eyebrow">${slide.badge} · ${slide.eyebrow}</p>
                  <h1 class="title">${slide.title}</h1>
                  <p class="body lede">${slide.body}</p>
                </div>
                <div class="detail-list">${buildBodyItems(slide, 3)}</div>
              </div>
              ${buildFooterRow(slide)}
            </article>

            <aside class="hero-side">
              ${buildMediaStage(
                slide,
                `
                  <div></div>
                  <div class="panel glass-soft media-card">
                    <strong>${slide.brandStudioLabel}</strong>
                    <p>Composição editorial premium com profundidade, respiro e contraste legível.</p>
                  </div>
                `,
              )}
              ${buildActionCard(slide, 'Posicionamento, estrutura e clareza para publicar sem layout improvisado.')}
            </aside>
          </div>
        </section>
      </main>
    `,
  );

const getInsightMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        gap: 18px;
        height: 100%;
      }

      .main-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 32px;
      }

      .rail-stack .media-stage {
        min-height: 320px;
      }
    `,
    `
      <main class="canvas">
        <section class="shell">
          <div class="layout">
            <article class="panel main-panel">
              <div class="copy-stack">
                ${buildBrandChip(slide)}
                <div class="title-stack">
                  <p class="eyebrow">${slide.badge} · ${slide.eyebrow}</p>
                  ${QUOTE_TEMPLATES.has(slide.templateId) || slide.templateId === 'quote-card' ? '<p class="quote-mark">“</p>' : ''}
                  <h1 class="title">${slide.title}</h1>
                  <p class="body lede">${slide.body}</p>
                </div>
                <div class="detail-list">${buildBodyItems(slide, 4)}</div>
              </div>
              ${buildFooterRow(slide)}
            </article>

            <aside class="rail-stack">
              <div class="panel glass-soft meta-card">
                <span class="meta-label">Núcleo</span>
                <strong>${slide.brandName}</strong>
                <p>${slide.brandStudioLabel}</p>
              </div>
              <div class="panel glass-soft meta-card">
                <span class="meta-label">Direção</span>
                <strong>${slide.eyebrow}</strong>
                <p>Mensagem com hierarquia limpa, contraste alto e leitura imediata.</p>
              </div>
              ${buildMediaStage(
                slide,
                `
                  <div></div>
                  <div class="panel glass-soft media-card">
                    <strong>${getFormatLabel(slide)}</strong>
                    <p>Canvas calibrado para feed e export pronto em PNG.</p>
                  </div>
                `,
              )}
            </aside>
          </div>
        </section>
      </main>
    `,
  );

const getShowcaseMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .layout {
        display: grid;
        grid-template-columns: minmax(320px, 0.98fr) minmax(0, 1.02fr);
        gap: 20px;
        height: 100%;
      }

      .copy-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 32px;
      }

      .showcase-side {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 16px;
      }
    `,
    `
      <main class="canvas">
        <section class="shell">
          <div class="layout">
            ${buildMediaStage(
              slide,
              `
                <div>${buildBrandChip(slide)}</div>
                <div class="panel glass-soft media-card">
                  <strong>${slide.footerLabel}</strong>
                  <p>Imagem, glow e moldura visual trabalham juntas sem deixar áreas mortas.</p>
                </div>
              `,
            )}

            <div class="showcase-side">
              <article class="panel copy-panel">
                <div class="copy-stack">
                  <p class="eyebrow">${slide.badge} · ${slide.eyebrow}</p>
                  <h1 class="title">${slide.title}</h1>
                  <p class="body lede">${slide.body}</p>
                  ${buildKpiGrid(slide)}
                </div>
                ${buildFooterRow(slide)}
              </article>
              ${buildActionCard(slide, 'Layout de showcase com mídia protagonista e bloco editorial sem ruído visual.')}
            </div>
          </div>
        </section>
      </main>
    `,
  );

const getListMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .card {
        width: 100%;
        height: 100%;
        padding: 32px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
    `,
    `
      <main class="canvas">
        <section class="shell">
          <article class="panel card">
            <div class="copy-stack">
              ${buildBrandChip(slide)}
              <div class="title-stack">
                <p class="eyebrow">${slide.badge} · ${slide.eyebrow}</p>
                <h1 class="title">${slide.title}</h1>
                <p class="body lede">${slide.body}</p>
              </div>
              <div class="detail-list">${buildBodyItems(slide, 5)}</div>
            </div>
            ${buildFooterRow(slide)}
          </article>
        </section>
      </main>
    `,
  );

const getSocialMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .frame {
        width: 100%;
        height: 100%;
        padding: 28px;
      }

      .feed-card {
        width: 100%;
        height: 100%;
        padding: 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 22px;
      }

      .feed-copy {
        display: grid;
        gap: 18px;
      }

      .feed-media {
        min-height: 320px;
      }
    `,
    `
      <main class="canvas">
        <section class="frame">
          <article class="feed-card">
            <div class="feed-copy">
              <div class="feed-head">
                <div class="brand-avatar">
                  ${slide.profileImageUrl
                    ? `<img src="${slide.profileImageUrl}" alt="${slide.brandName}" />`
                    : `<span>${escapeHtml(slide.brandName.slice(0, 1).toUpperCase() || 'E')}</span>`}
                </div>
                <div class="feed-meta">
                  <strong>${slide.brandName}</strong>
                  <span>${slide.brandHandle}</span>
                </div>
              </div>

              <p class="eyebrow">${slide.eyebrow}</p>
              <h1 class="title">${slide.title}</h1>
              <p class="body lede">${slide.body}</p>
            </div>

            ${slide.imageUrl
              ? `<div class="feed-media">${buildMediaStage(
                  slide,
                  `
                    <div></div>
                    <div class="panel glass-soft media-card">
                      <strong>${slide.footerLabel}</strong>
                      <p>Recorte social com imagem integrada e CTA visual contido.</p>
                    </div>
                  `,
                )}</div>`
              : ''}

            ${buildFooterRow({
              ...slide,
              footerLabel: '9:41 AM · Mar 28, 2026',
            })}
          </article>
        </section>
      </main>
    `,
  );

const getVerticalMarkup = (slide: NormalizedSlide) =>
  renderDocument(
    slide,
    `
      .story-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
    `,
    `
      <main class="canvas">
        <section class="story-shell">
          <div class="story-media">
            ${slide.imageUrl
              ? `<img class="media-image" src="${slide.imageUrl}" alt="${slide.title}" />`
              : '<div class="image-fallback"></div>'}
          </div>
          <div class="story-overlay"></div>
          <div class="story-bars"><span></span><span></span><span></span></div>

          <div class="panel glass-soft story-card">
            <div class="copy-stack">
              <div class="story-meta">
                ${buildBrandChip(slide)}
                <span class="media-label">${slide.templateId === 'reel' ? 'Reel cover' : 'Story frame'}</span>
              </div>
              <div class="title-stack">
                <p class="eyebrow">${slide.badge} · ${slide.eyebrow}</p>
                <h1 class="title">${slide.title}</h1>
                <p class="body lede">${slide.body}</p>
              </div>
            </div>

            ${buildFooterRow({
              ...slide,
              footerLabel: slide.templateId === 'reel' ? 'Reel Cover' : slide.footerLabel,
            })}
          </div>
        </section>
      </main>
    `,
  );

export const buildPremiumBrandingSlideMarkup = (input: BrandingPremiumSlideInput): string | null => {
  const templateId = normalizeTemplateId(input.templateId);
  if (!templateId) {
    return null;
  }

  const slide = normalizeSlide(input, templateId);

  if (QUOTE_TEMPLATES.has(templateId)) {
    return getInsightMarkup(slide);
  }

  if (HERO_TEMPLATES.has(templateId)) {
    return getHeroMarkup(slide);
  }

  if (INSIGHT_TEMPLATES.has(templateId)) {
    return getInsightMarkup(slide);
  }

  if (SHOWCASE_TEMPLATES.has(templateId)) {
    return getShowcaseMarkup(slide);
  }

  if (LIST_TEMPLATES.has(templateId)) {
    return getListMarkup(slide);
  }

  if (templateId === 'twitter-comment') {
    return getSocialMarkup(slide);
  }

  if (templateId === 'story' || templateId === 'reel') {
    return getVerticalMarkup(slide);
  }

  return getHeroMarkup(slide);
};
