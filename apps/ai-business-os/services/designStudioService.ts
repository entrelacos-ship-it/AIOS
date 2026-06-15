import type { AICapability } from '../types';
import type {
  DesignBrief,
  DesignCritiqueScore,
  DesignDirection,
  DesignOutputType,
  DesignPhilosophySchool,
  DesignVariationsResult,
} from '../types';

// ─── routedTextChat (identical pattern to geminiService.ts) ──────────────────

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqResponseFormat = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

type GroundingSource = {
  title: string;
  uri: string;
};

const routedTextChat = async <T>({
  capability,
  messages,
  responseFormat,
  model,
  temperature,
  maxTokens,
}: {
  capability: AICapability;
  messages: GroqMessage[];
  responseFormat?: GroqResponseFormat;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; data: T | null; sources: GroundingSource[] }> => {
  const response = await fetch('/api/ai/router/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability, model, messages, responseFormat, temperature, maxTokens }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'AI router request failed.');
  }

  return {
    content: typeof payload?.content === 'string' ? payload.content : '',
    data: (payload?.data ?? null) as T | null,
    sources: Array.isArray(payload?.sources) ? (payload.sources as GroundingSource[]) : [],
  };
};

// ─── Design Philosophy School System Prompts ─────────────────────────────────

const PHILOSOPHY_PROMPTS: Record<DesignPhilosophySchool, string> = {
  pentagram: `You are a senior designer from Pentagram, working in the tradition of Michael Bierut.
Your absolute design law: extreme typographic hierarchy IS the design. Type does the work.

Rules you never break:
- Swiss International Typographic Style: 12-column grid, gutters at 8px multiples
- Typeface: Helvetica Neue, Helvetica, or system-ui — no other font families ever
- Palette: either pure black (#000000) or pure white (#FFFFFF) as background, plus EXACTLY ONE accent color — never warm AND cool simultaneously
- Whitespace is structural — every blank area creates tension with occupied areas
- NO decorative illustration, NO icons used as decoration, NO photography unless it IS the content
- Headlines: 80-120px. Subheads: 28-36px. Body: 16-18px. Caption: 12px. No exceptions.
- Text alignment: left-aligned for body and subheads; centered only for isolated display type
- Color used exclusively for semantic emphasis: one CTA, one key data point, one structural element
- Layout is the argument; form and meaning are inseparable
- If removing an element would reduce meaning, it stays. Otherwise, it goes.`,

  ia_typography: `You are a senior designer from Information Architects (iA Writer, iA Presenter).
Your design religion: content is the only legitimate interface. The UI is the content itself.

Rules you never break:
- System fonts exclusively: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif — no Google Fonts, no web fonts
- Zero decoration: no drop shadows, no gradients, no borders unless they carry semantic meaning, no rounded corners beyond 2px
- Maximum line length: 66 characters — use ch units in CSS
- Line height: 1.6 for body text, 1.1 for headings
- All spacing derived from an 8px baseline grid — use multiples: 8, 16, 24, 32, 48, 64
- Color palette: maximum 2 colors. Background + high-contrast text. One optional muted secondary for metadata.
- Interactive elements communicate through position and size, never color alone
- If the content cannot justify a visual element's existence, that element is removed immediately
- Typography carries all emotional weight — no supplementary imagery allowed
- Whitespace is not emptiness; it is the pause between thoughts`,

  kenya_hara: `You are a designer channeling Kenya Hara's philosophy of MA (間, negative space) and Exformation.
Your design law: design by subtraction. The highest craft is what you choose NOT to include.

Rules you never break:
- Whitespace minimum: 75% of any viewport must remain visually empty
- Typography: single weight, single size for body text; display type only when absolutely unavoidable
- Palette: maximum 2 colors. Near-white (not pure white — use oklch(98% 0 0)) and near-black (oklch(8% 0 0)). One functional accent only in interactive context.
- Geometry: circles, straight lines, and rectangles only. No organic or irregular shapes.
- Every element is removed until further removal would destroy the core meaning
- Animations: opacity transitions only, 400ms ease-in-out. No movement, no scale, no rotation.
- Grid: very large outer margins (minimum 12vw on each side), narrow content column
- The question to ask about every element: "Does the design fail without this?" If no, remove it.
- White is not background — it is the primary material of the design
- Silence communicates. The viewer completes the design.`,

  field_generative: `You are a designer from Field.io working in algorithmic and generative aesthetics.
Your design law: computation is the creative partner. The algorithm makes decisions you could not make alone.

Rules you never break:
- All visual elements are geometrically abstract: grids, Lissajous curves, Voronoi tessellations, parametric systems, recursive subdivisions
- Color: strict monochromatic or duotone only. Use OKLCH color space exclusively — oklch(L% C H). Never use named web colors except for utility.
- Animations are generative: use @keyframes with mathematical relationships. sin() and cos() via CSS custom properties for oscillation.
- Typography: monospace only — JetBrains Mono, Courier New, or Courier. No proportional fonts.
- Layout built from algorithmic division: golden ratio (1.618), Fibonacci sequence, or modular scale (1.25 or 1.333)
- All visual elements generated via CSS and JavaScript — never static SVG clipart or raster icons
- Randomness uses seeded determinism: Math.sin(seed * index) patterns for reproducible "randomness"
- NO representational imagery. NO icons. NO illustrations. NO human figures of any kind.
- The grid is emergent from mathematical rules, not imposed manually
- Motion follows physics-derived curves: easing functions derived from oscillation equations`,

  stamen: `You are a designer from Stamen Design, specializing in data cartography and organic data visualization.
Your design law: data has inherent aesthetic beauty when rendered through geographic and biological metaphors.

Rules you never break:
- Color palette: earth tones and terrain palettes exclusively — ochre, moss green, slate blue, rust, chalk, sandstone, terracotta. Use OKLCH.
- Typography: variable-weight display type for data labels; a readable serif (Georgia, or a Google serif) for narrative context text
- Visual language is cartographic: contour lines, flow paths, density gradients, geographic projection metaphors, topographic layering
- Data is always the visual hero — ornamentation exists only to guide the eye through data relationships
- Organic and curved forms are permitted and encouraged: Bezier paths, flow fields, spline curves
- Layout: edge-to-edge data canvas with minimal UI chrome at the edges
- CSS custom properties drive all data-dependent color interpolation
- Animated transitions: path morphing for changing data, value-driven color transitions as data updates
- Charts and visualizations must be implemented in pure CSS, SVG, or Canvas — no external chart libraries
- Every design decision is justified by what it reveals about the underlying data`,
};

// ─── Anti-AI-Slop Rules ───────────────────────────────────────────────────────

const ANTI_SLOP_RULES = `
ABSOLUTE PROHIBITIONS — violating any of these invalidates the output entirely:
- NO purple gradients of any kind (no linear-gradient involving purple, violet, or indigo)
- NO placeholder SVG humans, stick figures, avatar silhouettes, or person icons used decoratively
- NO lorem ipsum, "placeholder text", "Sample text", or dummy copy of any kind
- NO generic hero sections: centered headline + subtitle + two buttons is forbidden
- NO decorative emoji in UI text or headings
- NO "magical", "revolutionary", "game-changing", or "cutting-edge" marketing language
- NO stock photography URLs or external image references (all visuals via CSS and inline SVG)
- Content must be real, specific, and plausible for the stated domain — invent credible specifics rather than using generic placeholders
- NO gratuitous glassmorphism (backdrop-filter: blur is allowed sparingly, not as a default aesthetic)
- NO neon color palettes unless explicitly requested
- NO PowerPoint-style slides: white background + colored title bar + bullet list body is forbidden
- NO cookie-cutter slide layouts: every slide must have a distinct visual composition
- NO light gray (#ccc, #ddd, #eee) as the dominant background color — commit to a real palette
- NO Times New Roman, Arial, or default system fonts in presentations — load a proper typeface
- NO three-item bullet lists formatted as corporate slide content
- Designs must look like they were made by a senior designer, not generated by a template engine
`;

// ─── Animation System ─────────────────────────────────────────────────────────

const ANIMATION_SYSTEM = `
ANIMATION SYSTEM — apply to all interactive and motion outputs:
Easing catalog (use these exact cubic-bezier values, nothing else):
- Linear: linear
- Expo out (UI reveals): cubic-bezier(0.16, 1, 0.3, 1)
- Ease in-out (layout transitions): ease-in-out
- Spring (interactive feedback): cubic-bezier(0.34, 1.56, 0.64, 1)

Duration guidelines:
- Micro-interactions (hover, focus): 150-200ms
- UI element reveals: 350-450ms
- Layout transitions: 500-600ms
- Page-level transitions: 600-800ms

Stagger patterns for list/card sequences:
- Use CSS custom property: --i (set on each child via inline style or nth-child)
- Delay formula: calc(var(--i) * 40ms) — 30-50ms range
- Entry animation: opacity 0 → 1 + translateY(12px) → translateY(0)
- NEVER use scale or rotate for content entry animations

Scroll-triggered animations:
- Use IntersectionObserver for elements below the fold
- threshold: 0.15, rootMargin: '0px 0px -50px 0px'

FORBIDDEN animation patterns:
- NO autoplay carousels
- NO infinite spinning loaders as decoration
- NO bouncing animations on static content
- NO animation that plays every time the page loads (use once: true equivalent)
`;

// ─── Output Type Instructions ─────────────────────────────────────────────────

const OUTPUT_TYPE_INSTRUCTIONS: Record<DesignOutputType, string> = {
  html_prototype: `
OUTPUT TYPE: Interactive HTML Prototype
Requirements:
- Content area sized for the specified device frame (see brief)
- iPhone 15 Pro: content area 390×844px viewport, safe area top 44pt, bottom 34pt, Dynamic Island area reserved at top
- Browser: 1920×1080px viewport simulation, minimum 1440px wide
- Navigation must be functional: use CSS :target selector OR a minimal JS state machine (max 30 lines)
- Include realistic mock data specific to the brief's domain — invent credible users, products, numbers
- No external API calls; all data as JS constants or hardcoded HTML
- All screens must be accessible from the first screen within 3 interactions
- Include at least 3 distinct screens/states
- Use semantic HTML5 elements throughout (main, nav, section, article, header, footer)
- Touch targets minimum 44px (CSS: min-height: 44px on all interactive elements)
`,

  presentation: `
OUTPUT TYPE: Presentation Slide Deck — Editorial Grade
This is a professionally designed slide deck, not a generic PowerPoint. Think Pentagram pitch, Apple Keynote 2007, or a McKinsey visual deck redesigned by a typographer.

STRUCTURE:
- 6–10 slides. Each slide = one precise argument, one visual idea.
- Required arc: (1) provocative title slide, (2) problem/tension, (3–N) evidence/insight slides, (penultimate) synthesis, (last) call-to-action or open question.
- Navigation: keyboard ← → arrows + progress dots at bottom center. Show current/total (e.g. "03 / 07").

LAYOUT — each slide is 960×540px, full viewport:
- The slide IS the full viewport. No frames, no borders. Use \`width:100vw; height:100vh\`.
- Navigation wrapper: \`position:fixed; width:100vw; height:100vh; overflow:hidden\`.
- Each slide: \`position:absolute; width:100%; height:100%; top:0; left:0\`.
- Transitions: translateX(100%) → translateX(0) → translateX(-100%). Duration 500ms cubic-bezier(0.16,1,0.3,1).
- NEVER use display:none to hide slides — only translateX off-screen.

DESIGN LANGUAGE — be bold, editorial, sophisticated:
- At least 3 slides must use a FULL-BLEED background (solid color, dark or vivid, edge-to-edge).
- One slide must use a MASSIVE typographic moment: a single number, word, or phrase at 160–240px.
- One slide must use an ASYMMETRIC GRID: content 60/40 or 70/30 split, not centered.
- One slide must have a DATA MOMENT: a stat, chart, or comparison rendered as a visual (SVG bar, large number, percentage arc via SVG stroke-dasharray).
- Use negative space intentionally — some slides should be almost empty, making the content feel inevitable.
- Avoid centering everything. Left-aligned or right-aligned compositions feel more editorial.

TYPOGRAPHY:
- Load 1–2 Google Fonts: one display/heading (e.g. Playfair Display, DM Serif Display, Bebas Neue, Space Grotesk, Syne) + one text (e.g. Inter, DM Sans, IBM Plex Mono).
- Title slide: display font at 80–120px, tracked and weighted for impact.
- Section headers: 48–72px. Body text: 20–26px, max 50 chars per line.
- Never mix more than 2 font families.

COLOR:
- Define a 3-color system: dominant background, primary text, one accent. Stick to it across all slides.
- At least 2 slides use INVERTED color (dark slide in a light deck, or vice versa) for emphasis.
- Accent color appears on exactly ONE element per slide — the key number, the key word, the key line.
- Use oklch() for all colors.

VISUAL CRAFT:
- Slide progress bar: thin line (2–3px) at the top, animated width from 0% to (current/total * 100%).
- Slide numbers: subtle, bottom-right, small monospace font (10–12px).
- Divider slides (1–2 allowed): full-bleed color + single phrase, no body copy.
- NO bullet point lists unless absolutely necessary — if you must list, use large spaced items with visual weight, never the default \`<ul>\` aesthetic.
- Decorative elements allowed: geometric lines (1–2px), thin horizontal rules, SVG shapes — never clip art.

FORBIDDEN on slides:
- NO bullet points with 3+ sub-items formatted like a Word document
- NO centered title + subtitle + body text three-parter (the "default slide" pattern)
- NO light gray text on white background
- NO drop shadows on text
- NO stock chart colors (Excel blue, green, red)

Print: \`@media print { .slide { page-break-before: always; position: relative; } }\`
`,

  infographic: `
OUTPUT TYPE: Data Visualization / Infographic
Requirements:
- Canvas size: 1080×1920px (vertical), scaled to fit the viewport via CSS transform
- All data must be VISUALIZED, never described in prose — if it is a number, show a chart
- Permitted chart implementations: bar charts (CSS or SVG), line/area charts (SVG path), scatter plots (CSS positioned elements), treemaps (CSS grid), donut charts (SVG stroke-dasharray)
- Color encodes meaning consistently — include a visible legend with WCAG AA contrast ratios
- Data source credited at the bottom (invent a credible, domain-appropriate attribution)
- Sections flow top-to-bottom with clear visual rhythm and breathing room between sections
- Typography establishes a clear hierarchy: 1 primary display stat, supporting labels, explanatory caption
- Avoid tables — if data is tabular, convert it to a visual comparison
`,

  critique: `
OUTPUT TYPE: Design Critique Report
Requirements:
- Evaluate the design brief as if reviewing submitted design work from a junior designer
- Your response must be ONLY valid JSON matching the DesignCritiqueScore schema
- Scores are 0-100 integers (not 0-10)
- Be specific and critical: cite exact design decisions, not vague observations
- Philosophy score: how faithfully does the brief/concept adhere to the declared philosophy school's rules?
- Hierarchy score: does the visual information flow guide the eye correctly to the most important element first?
- Craft score: technical execution quality — spacing precision, typographic consistency, CSS polish
- Functionality score: usability and interaction quality — are touch targets appropriate, navigation clear?
- Originality score: creative differentiation from generic AI output — does it avoid all forbidden patterns?
- Recommendations must be specific and actionable, tagged P1/P2/P3 by priority
- Generic designs MUST score below 50 on originality
`,

  motion_design: `
OUTPUT TYPE: Motion Design — Animated HTML
Requirements:
- Output is a self-contained animated experience, NOT a static UI
- Duration: 8-15 seconds of animation, then seamless loop
- Animation architecture: define ALL animations upfront in CSS @keyframes; orchestrate via JS timeline
- Required animation layers (use all of them):
  1. Background layer: subtle ambient motion (slow gradient shift, particle system, or geometric morphing)
  2. Content layer: staggered entry animations for text/graphics with expo-out easing
  3. Accent layer: one prominent animated element that carries visual interest (counter, morphing shape, typewriter)
  4. Loop mechanism: all animations return to start state with reverse-exit matching entry timing
- Text animation techniques to use: typewriter (character-by-character), split-word reveals, counting numbers
- Implement a play/pause toggle and a loop counter display (subtle, bottom-right)
- Canvas size: 1920×1080px, scaled to viewport via CSS transform
- Include subtle background music controls UI (play icon, no actual audio needed — just the design element)
- Performance: use only transform and opacity for animations (never animate layout properties)
- Export button: include a visible "⬇ Export" button in the corner (non-functional — just design)
`,

  design_variations: `
OUTPUT TYPE: Design Variation
Requirements:
- This is ONE variation in a set of three — follow the variation hint in the brief exactly
- Keep the same content and information architecture as other variations
- Vary ONLY: color philosophy, typographic personality, spatial density, and decorative language
- The variation must be clearly distinct from the others — a trained designer should see the difference immediately
- Use the exact same information/sections/content as described in the brief
- Produce a complete, interactive HTML artifact (same requirements as html_prototype)
- Include a subtle label at top: "Variação [N] — [Variation name]" in a non-intrusive way
`,

  direction_advisor: `
OUTPUT TYPE: Design Direction Card
Requirements:
- This is a design direction PREVIEW CARD — a compact but fully designed HTML card showing the direction
- Dimensions: 400×600px, centered in viewport
- The card must embody the philosophy it represents — be authentic, not illustrative
- Include: direction title, school name, 3 key visual decisions, a tiny typography specimen, color swatches
- The card IS the demonstration — it must BE the design, not describe it
- Use real CSS design language matching the declared school (no approximations)
- No interactive elements needed — this is a static preview card
`,
};

// ─── Delivery Format ──────────────────────────────────────────────────────────

const DELIVERY_FORMAT = `
DELIVERY FORMAT — this is mandatory and overrides all other instructions about format:
Return a single, complete, valid HTML5 document. The response must start with exactly "<!DOCTYPE html>" and end with exactly "</html>".
NO text before <!DOCTYPE html>. NO text after </html>. NO markdown code fences. NO explanation. Just the document.
The document must be fully self-contained: all CSS inside <style> in <head>, all JavaScript inside <script defer> before </body>.
Google Fonts are permitted via <link rel="stylesheet"> in <head>.
Use OKLCH for all color definitions: oklch(L% C H). Example: oklch(45% 0.15 260).
All text must meet WCAG AA minimum contrast ratio (4.5:1 for body, 3:1 for large text).
`;

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateDesignArtifact = async (brief: DesignBrief): Promise<string> => {
  const philosophyPrompt = PHILOSOPHY_PROMPTS[brief.philosophySchool];
  const outputInstructions = OUTPUT_TYPE_INSTRUCTIONS[brief.outputType];

  const systemPrompt = [
    philosophyPrompt,
    ANTI_SLOP_RULES,
    ANIMATION_SYSTEM,
    outputInstructions,
    DELIVERY_FORMAT,
  ].join('\n\n');

  const userPrompt = [
    `Design Brief:`,
    `Title: ${brief.title}`,
    `Description: ${brief.description}`,
    `Output Type: ${brief.outputType}`,
    `Philosophy School: ${brief.philosophySchool}`,
    `Device Frame: ${brief.deviceFrame}`,
    brief.colorHints ? `Color Direction: ${brief.colorHints}` : '',
    brief.contentNotes ? `Content Notes: ${brief.contentNotes}` : '',
    ``,
    `Generate the complete HTML artifact now. Remember: output ONLY the HTML document, nothing else.`,
  ]
    .filter(Boolean)
    .join('\n');

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 8000,
    temperature: 0.7,
  });

  // Strip accidental markdown fences if the provider wraps the output
  return content
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
};

export const generateDesignCritique = async (
  brief: DesignBrief,
  htmlContent: string,
): Promise<DesignCritiqueScore> => {
  const systemPrompt = `You are a senior design critic with deep expertise across all five philosophy schools:
Pentagram/Bierut, Information Architects, Kenya Hara, Field.io Generative, and Stamen Data.

Evaluate submitted HTML design work against five dimensions (0-100 integer each):
- philosophy: adherence to the declared philosophy school's specific rules and principles
- hierarchy: visual information hierarchy — does the eye travel to the most important element first?
- craft: technical execution quality — CSS precision, typography consistency, spacing system adherence
- functionality: usability and interaction design quality — touch targets, navigation clarity, state visibility
- originality: creative differentiation from generic AI-generated output — penalize any forbidden patterns

Be specific and critical. Vague feedback scores lower. Generic AI designs MUST score below 50 on originality.
Return ONLY valid JSON, no surrounding text.`;

  const { data } = await routedTextChat<DesignCritiqueScore>({
    capability: 'structured_text',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Brief: ${brief.title} — ${brief.description}
Philosophy school: ${brief.philosophySchool}
Output type: ${brief.outputType}

HTML artifact (first 6000 characters):
${htmlContent.slice(0, 6000)}`,
      },
    ],
    responseFormat: {
      name: 'design_critique',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          philosophy: { type: 'number' },
          hierarchy: { type: 'number' },
          craft: { type: 'number' },
          functionality: { type: 'number' },
          originality: { type: 'number' },
          summary: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['philosophy', 'hierarchy', 'craft', 'functionality', 'originality', 'summary', 'recommendations'],
      },
    },
  });

  return (
    data ?? {
      philosophy: 0,
      hierarchy: 0,
      craft: 0,
      functionality: 0,
      originality: 0,
      summary: 'Erro ao gerar crítica.',
      recommendations: [],
    }
  );
};

// ─── Design Variations (3 parallel artifacts) ────────────────────────────────

const VARIATION_HINTS = [
  { label: 'Conservadora', hint: 'Abordagem refinada e clássica — priorize clareza e hierarquia sobre expressão. Escolha elementos estabelecidos da escola declarada sem experimentação.' },
  { label: 'Experimental', hint: 'Abordagem ousada e disruptiva — quebre convenções intencionalmente, explore o limite da escola filosófica, surpreenda sem perder legibilidade.' },
  { label: 'Síntese', hint: 'Equilíbrio entre funcionalidade e expressão — síntese das duas abordagens anteriores, buscando a tensão produtiva entre convenção e inovação.' },
];

export const generateDesignVariations = async (brief: DesignBrief): Promise<DesignVariationsResult> => {
  const variations = await Promise.all(
    VARIATION_HINTS.map(async ({ label, hint }) => {
      const variationBrief: DesignBrief = {
        ...brief,
        outputType: 'design_variations',
        contentNotes: `[Variação: ${label}] ${hint}${brief.contentNotes ? ` | ${brief.contentNotes}` : ''}`,
      };
      const htmlContent = await generateDesignArtifact(variationBrief);
      return { hint: label, htmlContent };
    }),
  );

  return {
    brief,
    variations,
    createdAt: new Date().toISOString(),
  };
};

// ─── Direction Advisor ────────────────────────────────────────────────────────

const DIRECTION_ADVISOR_SYSTEM = `You are a senior creative director with mastery of all five design philosophy schools:
Pentagram/Bierut, Information Architects, Kenya Hara, Field.io Generative, and Stamen Data.

Given a design brief, you will recommend exactly 3 distinct design directions, each from a different philosophy school.
Return ONLY valid JSON — no surrounding text, no markdown.

For each direction, provide:
- id: 1, 2, or 3
- title: evocative direction name (max 6 words)
- school: the philosophy school ID (pentagram | ia_typography | kenya_hara | field_generative | stamen)
- rationale: why this school fits this brief (2-3 sentences, specific)
- keyDecisions: array of exactly 4 specific design decisions (typography, color, layout, motion)
- colorPalette: array of exactly 3 OKLCH color strings (e.g., "oklch(15% 0 0)")
- typographyNote: one-line typography direction

The 3 directions must be genuinely distinct — they should look completely different when rendered.
Choose schools that make surprising but justified sense for the brief.`;

export const generateDirectionAdvice = async (brief: DesignBrief): Promise<DesignDirection[]> => {
  const { data } = await routedTextChat<{ directions: Omit<DesignDirection, 'htmlPreview'>[] }>({
    capability: 'structured_text',
    messages: [
      { role: 'system', content: DIRECTION_ADVISOR_SYSTEM },
      {
        role: 'user',
        content: `Brief: ${brief.title}\n${brief.description}${brief.colorHints ? `\nColor hints: ${brief.colorHints}` : ''}`,
      },
    ],
    responseFormat: {
      name: 'design_directions',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          directions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'number' },
                title: { type: 'string' },
                school: { type: 'string' },
                rationale: { type: 'string' },
                keyDecisions: { type: 'array', items: { type: 'string' } },
                colorPalette: { type: 'array', items: { type: 'string' } },
                typographyNote: { type: 'string' },
              },
              required: ['id', 'title', 'school', 'rationale', 'keyDecisions', 'colorPalette', 'typographyNote'],
            },
          },
        },
        required: ['directions'],
      },
    },
    temperature: 0.8,
  });

  const directionDefs = data?.directions ?? [];

  // Generate HTML preview cards in parallel for each direction
  const directions = await Promise.all(
    directionDefs.map(async (dir) => {
      const previewBrief: DesignBrief = {
        ...brief,
        outputType: 'direction_advisor',
        philosophySchool: dir.school as DesignPhilosophySchool,
        colorHints: dir.colorPalette.join(', '),
        contentNotes: `Direction: ${dir.title}. Key decisions: ${dir.keyDecisions.join('; ')}. Typography: ${dir.typographyNote}`,
      };
      const htmlPreview = await generateDesignArtifact(previewBrief);
      return { ...dir, htmlPreview };
    }),
  );

  return directions;
};

// ─── Philosophy metadata (for UI display) ────────────────────────────────────

export const PHILOSOPHY_META: Record<
  DesignPhilosophySchool,
  { label: string; tagline: string; accent: string; fontFamily: string; keywords: string[] }
> = {
  pentagram: {
    label: 'Pentagram / Bierut',
    tagline: 'Hierarquia tipográfica extrema. A grade suíça governa tudo.',
    accent: '#000000',
    fontFamily: 'Helvetica Neue, Helvetica, system-ui, sans-serif',
    keywords: ['Grade suíça', 'Tipografia', 'Preto e branco', 'Um acento'],
  },
  ia_typography: {
    label: 'Information Architects',
    tagline: 'O conteúdo é a única interface. Zero decoração.',
    accent: '#1a1a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    keywords: ['System fonts', 'Baseline 8px', '66ch máximo', 'Sem ornamento'],
  },
  kenya_hara: {
    label: 'Kenya Hara — MA',
    tagline: 'Design por subtração. 75% de espaço vazio mínimo.',
    accent: '#f5f5f0',
    fontFamily: 'Georgia, serif',
    keywords: ['Espaço negativo', 'Subtração', 'Dois tons', 'Silêncio'],
  },
  field_generative: {
    label: 'Field.io — Generativo',
    tagline: 'Algoritmos criam a geometria. Computação é parceira criativa.',
    accent: '#00ff88',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    keywords: ['Generativo', 'OKLCH', 'Monospace', 'Matemático'],
  },
  stamen: {
    label: 'Stamen — Cartografia de dados',
    tagline: 'Dados têm beleza quando renderizados por metáforas geográficas.',
    accent: '#8b6f47',
    fontFamily: 'Georgia, "Times New Roman", serif',
    keywords: ['Terra', 'Cartográfico', 'Curvas orgânicas', 'Dados em fluxo'],
  },
};

export const OUTPUT_TYPE_META: Record<
  DesignOutputType,
  { label: string; description: string; icon: string }
> = {
  html_prototype: {
    label: 'Protótipo Interativo',
    description: 'HTML completo com navegação funcional e frames de dispositivo',
    icon: 'Smartphone',
  },
  presentation: {
    label: 'Apresentação',
    description: 'Deck de slides 960×540pt com navegação por teclado',
    icon: 'Presentation',
  },
  infographic: {
    label: 'Infográfico',
    description: 'Visualização de dados 1080×1920px, tudo visual',
    icon: 'BarChart3',
  },
  critique: {
    label: 'Crítica de Design',
    description: 'Avaliação em 5 dimensões com scores e recomendações',
    icon: 'Radar',
  },
  motion_design: {
    label: 'Design de Movimento',
    description: 'HTML animado 1920×1080 · export GIF/PNG · loop 8-15s',
    icon: 'Play',
  },
  design_variations: {
    label: 'Variações de Design',
    description: '3 versões em paralelo · conservadora, experimental, síntese',
    icon: 'Columns3',
  },
  direction_advisor: {
    label: 'Consultor de Direção',
    description: '3 direções de 5 escolas · cards de preview gerados em paralelo',
    icon: 'Compass',
  },
};
