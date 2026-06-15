import OpenAI from 'openai';

const NARRATIVE_FUNCTIONS = [
  'Hook / Capa — parada na rolagem, tese forte ou provocação',
  'Reconhecimento da dor — nomear dor real do público',
  'Tensão oculta — revelar contradição ou padrão invisível',
  'Quebra de crença — desmontar ideia limitante',
  'Reenquadramento — nova forma de enxergar o problema',
  'Estrutura / Método / Sistema — framework ou processo prático',
  'Aplicação prática — como aparece na realidade do público',
  'Síntese salvável — frase, mapa ou checklist para salvar',
  'CTA — convite para ação ética e clara',
  'Manifesto final — frase forte e autoral da marca',
];

const CREATIVE_DIRECTOR_SYSTEM = `You are a Creative Director specialized in premium Instagram carousels.
Your role: transform each slide into a complete visual piece where TEXT and IMAGE are one unified design.

Rules:
- vertical Instagram carousel slide, 1080×1350px
- text integrated INTO the image — not overlaid as an afterthought
- typography: large, clean, high-contrast, readable on mobile
- lots of negative space — sophisticated, editorial, never cluttered
- official brand colors only — no random palette
- premium editorial aesthetic — never generic Canva template
- each slide has ONE central idea
- Portuguese text must be spelled correctly and rendered clearly
- no distorted or unreadable letters
- composition: cinematic, contemporary, autoral

Visual hierarchy:
- dominant headline (title) — large, bold, readable
- supporting body (if any) — smaller, secondary
- brand mark / eyebrow — small, discrete
- background: dark/rich + brand colors + subtle texture or depth

Never: generic stock imagery, cliché visuals, busy backgrounds, decorative clutter.`;

export type SlideImageParams = {
  slideIndex: number;
  totalSlides: number;
  title: string;
  body: string;
  visualPrompt: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  brandName: string;
};

const buildSlidePrompt = (params: SlideImageParams): string => {
  const narrativeFunction =
    NARRATIVE_FUNCTIONS[Math.min(params.slideIndex, NARRATIVE_FUNCTIONS.length - 1)];

  const slideText = [params.title, params.body].filter(Boolean).join('\n');

  return `Slide ${params.slideIndex + 1} of ${params.totalSlides} — ${narrativeFunction}

EXACT TEXT TO INTEGRATE IN THE DESIGN (use correct Portuguese spelling):
"${slideText}"

BRAND COLORS:
- Primary: ${params.primaryColor}
- Background: ${params.backgroundColor}
- Text: ${params.textColor}
- Accent: ${params.accentColor}
- Brand: ${params.brandName}

VISUAL DIRECTION:
${params.visualPrompt}

TECHNICAL SPECS:
- vertical Instagram carousel slide, 1080×1350px
- premium editorial design, sophisticated composition
- text integrated into the image with clean readable typography
- high contrast, lots of negative space
- official brand colors dominant
- no clutter, no generic Canva template
- no distorted letters, no unreadable text
- Use exactly this Portuguese text with correct spelling and clean typography.`;
};

export const generateSlideImageWithOpenAI = async (
  params: SlideImageParams,
): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured.');
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildSlidePrompt(params);

  // Try gpt-image-1 first (highest quality, supports exact text), fallback to dall-e-3
  try {
    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt: `${CREATIVE_DIRECTOR_SYSTEM}\n\n${prompt}`,
      n: 1,
      size: '1024x1536',
      output_format: 'png',
    } as Parameters<typeof client.images.generate>[0]);

    const image = response.data?.[0];
    if (!image) throw new Error('No image returned from gpt-image-1.');

    if ('b64_json' in image && image.b64_json) {
      return `data:image/png;base64,${image.b64_json}`;
    }

    if ('url' in image && image.url) {
      return image.url;
    }

    throw new Error('Image response had no usable data.');
  } catch (primaryError) {
    // Fallback to dall-e-3 if gpt-image-1 fails
    const isModelError =
      primaryError instanceof Error &&
      (primaryError.message.includes('model') || primaryError.message.includes('not found'));

    if (!isModelError) throw primaryError;

    const fallbackResponse = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: '1024x1792',
      quality: 'hd',
      response_format: 'b64_json',
    });

    const fallbackImage = fallbackResponse.data?.[0];
    if (!fallbackImage) throw new Error('No image returned from dall-e-3.');

    if ('b64_json' in fallbackImage && fallbackImage.b64_json) {
      return `data:image/png;base64,${fallbackImage.b64_json}`;
    }

    throw new Error('dall-e-3 fallback had no usable data.');
  }
};
