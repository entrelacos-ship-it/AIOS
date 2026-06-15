import type {
  AdsPlatform, AdsIndustry, AdsCampaignGoal, AdsCopyFramework,
  AdsAuditRecord, AdsCopyRecord, AdsStrategyRecord,
  AdsCategoryScore, AdsQuickWin, AdsCopyVariant, AdsCampaignConcept,
} from '../types.js';

export type SseEmit = (event: string, data: unknown) => void;

// ─── Platform audit config ────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<AdsPlatform, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads (Facebook/Instagram)',
  youtube: 'YouTube Ads',
  linkedin: 'LinkedIn Ads',
  tiktok: 'TikTok Ads',
  microsoft: 'Microsoft Advertising (Bing)',
  apple: 'Apple Search Ads',
};

const PLATFORM_CATEGORIES: Record<AdsPlatform, Array<{ name: string; weight: number }>> = {
  google: [
    { name: 'Conversion Tracking', weight: 25 },
    { name: 'Wasted Spend', weight: 20 },
    { name: 'Account Structure', weight: 15 },
    { name: 'Keywords & Quality Score', weight: 15 },
    { name: 'Ads & Assets', weight: 15 },
    { name: 'Settings & Targeting', weight: 10 },
  ],
  meta: [
    { name: 'Pixel & CAPI Health', weight: 30 },
    { name: 'Creative Diversity & Fatigue', weight: 30 },
    { name: 'Account Structure', weight: 20 },
    { name: 'Audience & Targeting', weight: 20 },
  ],
  youtube: [
    { name: 'Conversion Tracking', weight: 25 },
    { name: 'Creative Quality', weight: 30 },
    { name: 'Audience Targeting', weight: 25 },
    { name: 'Campaign Structure', weight: 20 },
  ],
  linkedin: [
    { name: 'Audience Targeting', weight: 30 },
    { name: 'Ad Format Diversity', weight: 25 },
    { name: 'Conversion Tracking', weight: 25 },
    { name: 'Bid Strategy', weight: 20 },
  ],
  tiktok: [
    { name: 'Pixel & Events', weight: 30 },
    { name: 'Creative Performance', weight: 35 },
    { name: 'Audience Strategy', weight: 20 },
    { name: 'Bid & Budget', weight: 15 },
  ],
  microsoft: [
    { name: 'Conversion Tracking', weight: 25 },
    { name: 'Keyword Quality', weight: 25 },
    { name: 'Ad Copy & Extensions', weight: 25 },
    { name: 'Audience & Targeting', weight: 25 },
  ],
  apple: [
    { name: 'Campaign Structure', weight: 30 },
    { name: 'Creative Sets', weight: 30 },
    { name: 'Audience Refinement', weight: 20 },
    { name: 'Bid Strategy', weight: 20 },
  ],
};

function buildAuditPrompt(
  platform: AdsPlatform,
  industry: AdsIndustry,
  monthlySpend: number,
  goal: AdsCampaignGoal,
  metrics: string,
): string {
  const categories = PLATFORM_CATEGORIES[platform].map((c) => `- ${c.name} (${c.weight}%)`).join('\n');

  return `You are a senior ${PLATFORM_LABELS[platform]} auditor with 10+ years of experience. You are performing a paid ads account audit.

ACCOUNT CONTEXT:
- Platform: ${PLATFORM_LABELS[platform]}
- Industry: ${industry}
- Monthly Ad Spend: $${monthlySpend.toLocaleString()}
- Primary Goal: ${goal}

ACCOUNT DATA / METRICS PROVIDED BY USER:
${metrics}

AUDIT CATEGORIES (with scoring weights):
${categories}

SCORING RULES:
- Health Score 90-100 = Grade A (excellent)
- Health Score 75-89 = Grade B (good)
- Health Score 60-74 = Grade C (needs improvement)
- Health Score 40-59 = Grade D (poor)
- Health Score <40 = Grade F (critical issues)

For each category, evaluate:
- What's passing (good practices in place)
- What needs attention (warnings)
- What's failing or missing (critical issues — apply 5x severity weight)

Quick Wins = issues fixable in under 15 minutes that will immediately improve performance.

Based on the data provided, perform the audit. If data is missing for certain checks, note it as "data not provided" but still assess what you can.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "healthScore": <integer 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "summary": "<2-3 sentence executive summary>",
  "categories": [
    {
      "name": "<category name>",
      "score": <integer 0-100>,
      "weight": <weight integer>,
      "passed": <count>,
      "warnings": <count>,
      "failures": <count>,
      "notes": "<key finding for this category>"
    }
  ],
  "quickWins": [
    {
      "severity": <"critical"|"high"|"medium">,
      "issue": "<specific issue identified>",
      "action": "<exact action to take>",
      "estimatedTime": "<e.g. 5 min>"
    }
  ]
}`;
}

// ─── Audit pipeline (SSE) ─────────────────────────────────────────────────────

export async function runAdsAudit(
  platform: AdsPlatform,
  industry: AdsIndustry,
  monthlySpend: number,
  goal: AdsCampaignGoal,
  metricsRaw: string,
  emit: SseEmit,
): Promise<Omit<AdsAuditRecord, 'id' | 'createdAt'>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  emit('log', { text: `Iniciando auditoria ${PLATFORM_LABELS[platform]}...` });
  emit('stage', { name: 'analyzing' });

  const prompt = buildAuditPrompt(platform, industry, monthlySpend, goal, metricsRaw);

  let fullText = '';

  emit('log', { text: 'Claude analisando métricas e aplicando 250+ verificações...' });

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullText += chunk.delta.text;
      emit('token', { text: chunk.delta.text });
    }
  }

  emit('log', { text: 'Parseando resultados...' });

  const jsonStart = fullText.indexOf('{');
  const jsonEnd = fullText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Resposta inválida do Claude. Tente novamente.');
  }

  const parsed = JSON.parse(fullText.slice(jsonStart, jsonEnd + 1)) as {
    healthScore: number;
    grade: AdsAuditRecord['grade'];
    summary: string;
    categories: AdsCategoryScore[];
    quickWins: AdsQuickWin[];
  };

  const result: Omit<AdsAuditRecord, 'id' | 'createdAt'> = {
    platform,
    industry,
    monthlySpend,
    goal,
    metricsRaw,
    healthScore: parsed.healthScore,
    grade: parsed.grade,
    categories: parsed.categories,
    quickWins: parsed.quickWins,
    summary: parsed.summary,
  };

  emit('result', result);
  emit('log', { text: `Auditoria concluída — Health Score: ${result.healthScore}/100 (${result.grade})` });
  emit('done', {});

  return result;
}

// ─── Copy generation ──────────────────────────────────────────────────────────

const FRAMEWORK_DESCRIPTIONS: Record<AdsCopyFramework, string> = {
  AIDA: 'Attention → Interest → Desire → Action. Hook attention, build interest, create desire, close with CTA.',
  PAS: 'Problem → Agitate → Solution. State pain point, make it visceral, present your solution.',
  BAB: 'Before → After → Bridge. Show current pain, paint the desired future, bridge with your product.',
  '4P': 'Promise → Picture → Proof → Push. Make a bold promise, paint the benefit, add social proof, push CTA.',
  FAB: 'Feature → Advantage → Benefit. Specific feature, why it beats alternatives, tangible user benefit.',
  'Star-Story-Solution': 'Star (character) → Story (narrative arc) → Solution (product as resolution).',
};

const PLATFORM_CHAR_LIMITS: Record<AdsPlatform, { headline: number; primaryText: number; description: number }> = {
  google: { headline: 30, primaryText: 90, description: 90 },
  meta: { headline: 40, primaryText: 125, description: 30 },
  youtube: { headline: 100, primaryText: 150, description: 70 },
  linkedin: { headline: 70, primaryText: 150, description: 70 },
  tiktok: { headline: 100, primaryText: 100, description: 50 },
  microsoft: { headline: 30, primaryText: 90, description: 90 },
  apple: { headline: 30, primaryText: 100, description: 50 },
};

export async function generateAdsCopy(
  platform: AdsPlatform,
  framework: AdsCopyFramework,
  productDescription: string,
  targetAudience: string,
  goal: string,
): Promise<AdsCopyVariant[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const limits = PLATFORM_CHAR_LIMITS[platform];

  const prompt = `You are an expert ${PLATFORM_LABELS[platform]} copywriter specializing in direct-response advertising.

PRODUCT/SERVICE:
${productDescription}

TARGET AUDIENCE:
${targetAudience}

CAMPAIGN GOAL:
${goal}

COPY FRAMEWORK: ${framework}
${FRAMEWORK_DESCRIPTIONS[framework]}

CHARACTER LIMITS FOR ${PLATFORM_LABELS[platform]}:
- Headline: max ${limits.headline} characters
- Primary Text: max ${limits.primaryText} characters
- Description: max ${limits.description} characters

Generate 3 distinct ad copy variants using the ${framework} framework. Each variant should:
- Follow the framework structure precisely
- Stay within character limits (STRICTLY)
- Feel native to ${PLATFORM_LABELS[platform]} (platform tone/style)
- Have a specific, compelling CTA
- Target the audience's pain points and desires

Return ONLY valid JSON (no markdown):
{
  "variants": [
    {
      "headline": "<max ${limits.headline} chars>",
      "primaryText": "<max ${limits.primaryText} chars>",
      "description": "<max ${limits.description} chars>",
      "cta": "<action verb + benefit, 2-5 words>"
    }
  ]
}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as { variants: AdsCopyVariant[] };
  return parsed.variants;
}

// ─── Campaign strategy ────────────────────────────────────────────────────────

export async function generateAdsStrategy(
  brandDescription: string,
  goal: AdsCampaignGoal,
  monthlyBudget: number,
  activePlatforms: AdsPlatform[],
): Promise<{ concepts: AdsCampaignConcept[]; budgetRecommendation: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });

  const platformList = activePlatforms.map((p) => PLATFORM_LABELS[p]).join(', ');

  const prompt = `You are a senior paid advertising strategist. Create a campaign strategy.

BRAND/PRODUCT:
${brandDescription}

PRIMARY GOAL: ${goal}
MONTHLY BUDGET: $${monthlyBudget.toLocaleString()}
ACTIVE PLATFORMS: ${platformList}

Apply the 70/20/10 budget allocation rule:
- 70% to proven/performing channels
- 20% to scaling what works
- 10% to testing new approaches

Generate 3-5 campaign concepts. Each concept must:
- Have a clear hypothesis ("If we show X to Y audience, they will Z because...")
- Identify a specific messaging pillar (one emotional/rational driver)
- Suggest a visual direction
- Recommend a copy framework (AIDA, PAS, BAB, 4P, FAB, or Star-Story-Solution)
- Specify which platforms are best suited
- Define the target audience segment

Also provide a budget recommendation following the 70/20/10 rule with specific platform allocations.

Return ONLY valid JSON (no markdown):
{
  "concepts": [
    {
      "title": "<concept name>",
      "hypothesis": "<if-then-because statement>",
      "messagingPillar": "<core message driver>",
      "visualDirection": "<visual style/direction>",
      "copyFramework": <"AIDA"|"PAS"|"BAB"|"4P"|"FAB"|"Star-Story-Solution">,
      "targetAudience": "<specific segment>",
      "platforms": [<platform keys from: google,meta,youtube,linkedin,tiktok,microsoft,apple>]
    }
  ],
  "budgetRecommendation": "<detailed paragraph with 70/20/10 breakdown and platform allocations>"
}`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
    concepts: AdsCampaignConcept[];
    budgetRecommendation: string;
  };
}
