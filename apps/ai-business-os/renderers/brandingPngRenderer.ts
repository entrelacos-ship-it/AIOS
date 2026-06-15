import puppeteer, { Browser } from 'puppeteer';
import {
  buildPremiumBrandingSlideMarkup,
  getBrandingTypographyGuide,
  normalizeBrandingTemplateId,
  type BrandingHtmlTemplateId,
} from '../shared/brandingPremiumSlides.js';

export type BrandingTemplateId = BrandingHtmlTemplateId;

export interface BrandingRenderSlide {
  id: number;
  title: string;
  body: string;
  eyebrow?: string;
  footerLabel?: string;
  imageUrl?: string;
  templateId?: BrandingTemplateId;
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
  imagePlacement?: 'background' | 'half';
  imageScale?: number;
}

interface BrandingRenderOptions {
  width?: number;
  height?: number;
}

interface RenderedBrandingSlide {
  id: number;
  filename: string;
  dataUrl: string;
}

interface TemplatePreset {
  width: number;
  height: number;
}

interface TypographyMinimums {
  title: number;
  body: number;
  caption: number;
}

let browserPromise: Promise<Browser> | null = null;

const TEMPLATE_PRESETS: Record<BrandingTemplateId, TemplatePreset> = {
  'entrelacos-premium-cover': { width: 1080, height: 1350 },
  'entrelacos-premium-insight': { width: 1080, height: 1080 },
  'entrelacos-premium-showcase': { width: 1080, height: 1080 },
  'entrelacos-premium-quote': { width: 1080, height: 1080 },
  editorial: { width: 1080, height: 1080 },
  spotlight: { width: 1080, height: 1080 },
  split: { width: 1080, height: 1080 },
  'entrelacos-orbit': { width: 1080, height: 1350 },
  'entrelacos-ribbon': { width: 1080, height: 1350 },
  'entrelacos-mosaic': { width: 1080, height: 1350 },
  memo: { width: 1080, height: 1080 },
  'twitter-comment': { width: 1080, height: 1080 },
  'quote-card': { width: 1080, height: 1080 },
  checklist: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  reel: { width: 1080, height: 1920 },
  'carousel-cover': { width: 1080, height: 1350 },
};

const normalizeTemplate = (templateId?: string): BrandingTemplateId => {
  return normalizeBrandingTemplateId(templateId) || 'editorial';
};

const getTypographyMinimums = (templateId: BrandingTemplateId): TypographyMinimums => {
  const guide = getBrandingTypographyGuide(templateId);
  return {
    title: guide.titleMin,
    body: guide.bodyMin,
    caption: guide.captionMin,
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  return browserPromise;
};

const buildSlideMarkup = (slide: BrandingRenderSlide) => {
  const templateId = normalizeTemplate(slide.templateId);

  return (
    buildPremiumBrandingSlideMarkup({
      ...slide,
      templateId,
    }) ||
    buildPremiumBrandingSlideMarkup({
      ...slide,
      templateId: 'editorial',
    }) ||
    '<!DOCTYPE html><html lang="pt-BR"><body></body></html>'
  );
};

const getSlideSize = (
  slide: BrandingRenderSlide,
  options: BrandingRenderOptions = {},
): TemplatePreset => {
  const templateId = normalizeTemplate(slide.templateId);
  const preset = TEMPLATE_PRESETS[templateId];

  return {
    width: options.width || preset.width,
    height: options.height || preset.height,
  };
};

const renderSingleSlide = async (
  slide: BrandingRenderSlide,
  options: BrandingRenderOptions = {},
) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const { width, height } = getSlideSize(slide, options);
  const templateId = normalizeTemplate(slide.templateId);

  try {
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    await page.setContent(buildSlideMarkup(slide), {
      waitUntil: 'networkidle0',
    });

    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((image) => image.decode().catch(() => Promise.resolve())),
      );

      if ('fonts' in document) {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
      }
    });

    await page.evaluate((minimums) => {
      const elements = Array.from(document.querySelectorAll('body *'));

      elements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const text = htmlElement.innerText?.trim();
        if (!text) return;

        const computed = window.getComputedStyle(htmlElement);
        if (
          computed.display === 'none' ||
          computed.visibility === 'hidden' ||
          Number(computed.opacity) === 0
        ) {
          return;
        }

        const tag = element.tagName.toLowerCase();
        const classes = (element.getAttribute('class') || '').toLowerCase();
        const role =
          tag === 'h1' ||
          tag === 'h2' ||
          tag === 'h3' ||
          classes.includes('title') ||
          classes.includes('hero')
            ? 'title'
            : classes.includes('eyebrow') ||
                classes.includes('footer') ||
                classes.includes('handle') ||
                classes.includes('caption') ||
                classes.includes('brand-chip') ||
                classes.includes('meta')
              ? 'caption'
              : 'body';
        const fontSize = Number.parseFloat(computed.fontSize || '0');
        const fontWeight = Number.parseInt(computed.fontWeight || '400', 10);

        if (role === 'title' && fontSize < minimums.title) {
          htmlElement.style.fontSize = `${minimums.title}px`;
        } else if (role === 'body' && fontSize < minimums.body) {
          htmlElement.style.fontSize = `${minimums.body}px`;
        } else if (role === 'caption' && fontSize < minimums.caption) {
          htmlElement.style.fontSize = `${minimums.caption}px`;
        }

        if (role === 'title' && fontWeight < 700) {
          htmlElement.style.fontWeight = '700';
        } else if (role !== 'title' && fontWeight < 500) {
          htmlElement.style.fontWeight = '500';
        }
      });
    }, getTypographyMinimums(templateId));

    const pngBuffer = await page.screenshot({
      type: 'png',
    });

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } finally {
    await page.close();
  }
};

export const renderBrandingSlidesToPng = async (
  slides: BrandingRenderSlide[],
  options: BrandingRenderOptions = {},
): Promise<RenderedBrandingSlide[]> => {
  const rendered: RenderedBrandingSlide[] = [];

  for (const slide of slides) {
    const dataUrl = await renderSingleSlide(slide, options);
    const filenameBase = slugify(slide.title || `slide-${slide.id}`) || `slide-${slide.id}`;

    rendered.push({
      id: slide.id,
      filename: `${String(slide.id).padStart(2, '0')}-${filenameBase}.png`,
      dataUrl,
    });
  }

  return rendered;
};
