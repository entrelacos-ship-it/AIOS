import { type EditAIWord, type EditAISceneRaw, type EditAITemplate, type EditAIFormatoDestino, type EditAIEditPreset } from '../types.js';
import { buildTemplateHint } from './editaiTemplates.js';
import { recordAIUsageEvent } from './aiUsageRegistry.js';

const PLAN_PROMPT = `Você é um diretor de vídeo especializado em conteúdo educacional para Instagram e YouTube Shorts.

Analise a transcrição abaixo e proponha um PLANO VISUAL em português, no formato exato:

**Formato narrativo detectado**: [tutorial/lista/storytelling/comparativo/motivacional/processo/depoimento]
**Duração estimada após cortes**: [X segundos]
**Paleta sugerida**: [descrição emocional das cores]

**Beats visuais propostos** (cenas em ordem):
Beat 1 — [~Xs]: Tipo [A/B/C+/D/E/F/G/H/I/BONECO] — "[descrição do que aparece na tela]"
Beat 2 — [~Xs]: Tipo [nome] — "[descrição]"
...

**Raciocínio**: [2-3 frases explicando as escolhas]

TIPOS DISPONÍVEIS:
A=Tela cheia (frase impactante) | B=Lower third (contexto) | C+=Split (ponto+descrição)
D=Split vertical (comparação) | E=Card numerado | F=Mensagem de chat
G=Número/estatística | H=Fluxo/etapas | I=CTA | BONECO=Ilustração stick figure

DIREÇÃO VISUAL:
- Inclua punch-ins, overlays, lower thirds, cards, callouts e transições somente quando ajudarem retenção ou clareza.
- Em talking head estático, proponha mudança visual a cada 1.5-3s no Reels.
- Não use efeitos aleatórios: cada efeito precisa reforçar palavra-chave, virada de assunto, dado, lista ou CTA.

Transcrição:
{transcription}`;

const SCENE_PROMPT = `Você é um diretor de vídeo. Com base no plano aprovado, gere APENAS um JSON válido.

ESTRUTURA OBRIGATÓRIA:
{
  "formato": "tutorial|lista|storytelling|comparativo|motivacional|processo|depoimento",
  "paleta": { "primaria": "#hex", "secundaria": "#hex", "acento": "#hex", "texto": "#hex" },
  "cenas": [
    {
      "id": 1,
      "tipo": "A|B|C+|D|E|F|G|H|I|BONECO",
      "startLeg": 0,
      "endLeg": 5,
      "conteudo": {}
    }
  ]
}

CAMPOS conteudo POR TIPO:
A  → { "titulo": "frase impactante (max 8 palavras)" }
B  → { "nome": "contexto breve", "subtitulo": "detalhe" }
C+ → { "titulo": "ponto principal", "descricao": "desenvolvimento (max 20 palavras)" }
D  → { "lado_esq": "opção A", "lado_dir": "opção B", "label_esq": "label", "label_dir": "label" }
E  → { "numero": 1, "titulo": "item", "icone": "emoji único" }
F  → { "remetente": "nome", "mensagem": "texto da mensagem" }
G  → { "numero": "42", "unidade": "%", "descricao": "contexto breve" }
H  → { "passos": ["passo 1", "passo 2", "passo 3"] }
I  → { "acao": "verbo imperativo", "complemento": "complemento do CTA" }
BONECO → { "situacao": "descrição da cena com stick figures", "legenda": "texto" }

REGRAS ABSOLUTAS:
1. startLeg e endLeg são ÍNDICES de palavras — NUNCA calcule segundos, nunca use floats
2. Crie entre 5 e 12 cenas
3. Não repita o mesmo tipo mais de 3x seguidas
4. Respeite rigorosamente o plano aprovado
5. Use cenas para criar overlays, cards, chamadas visuais e transições editoriais quando couber
6. Retorne SOMENTE o JSON — sem markdown, sem explicação, sem \`\`\`

{template_hint}

Plano aprovado:
{approved_plan}

Transcrição:
{transcription}

Palavras numeradas (índice → palavra → início_s):
{numbered_words}`;

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY not configured. Set it in .env to use EditAI planning.');
  return key;
}

async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean; model?: string },
): Promise<string> {
  const apiKey = getOpenAIKey();
  const model = opts.model ?? 'gpt-4o';

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 2000,
  };

  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = (await res.text()).trim().replace(/\s+/g, ' ');
    throw new Error(`OpenAI API failed (${res.status}): ${err}`);
  }

  const json = await res.json() as Record<string, unknown>;
  const content = (json.choices as Array<Record<string, unknown>>)?.[0]?.message as Record<string, unknown>;
  const text = String(content?.content ?? '').trim();

  // Track usage
  const usage = json.usage as Record<string, number> | undefined;
  await recordAIUsageEvent({
    providerId: 'openai',
    model,
    capability: 'structured_text',
    promptTokens: usage?.prompt_tokens ?? null,
    completionTokens: usage?.completion_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
  }).catch(() => undefined);

  return text;
}

function buildNumberedWords(words: EditAIWord[]): string {
  return words
    .map((w) => `${w.index}: "${w.word}" (${w.start.toFixed(2)}s)`)
    .join('\n');
}

function buildFormatoDestinoHint(formatoDestino: EditAIFormatoDestino): string {
  if (formatoDestino === 'youtube') {
    return `\nFORMATO DESTINO: YouTube (vídeo longo)\n- Vídeo pode ter 5-20 minutos\n- Estruture cenas em capítulos com progressão lógica\n- Inclua cena de índice/roteiro no início\n- Máximo 12 cenas distribuídas pela duração total\n- Use tipos H (Fluxo) para transições entre capítulos\n`;
  }
  return `\nFORMATO DESTINO: Reels/TikTok/Shorts (vídeo curto)\n- Vídeo de até 90 segundos\n- Cenas rápidas e impactantes\n- Máximo 8 cenas\n- Priorize tipos A, E, G, I para impacto visual rápido\n`;
}

function buildEditPresetHint(editPreset: EditAIEditPreset = 'auto'): string {
  const hints: Record<EditAIEditPreset, string> = {
    auto: `\nPRESET DE EDIÇÃO: Auto\n- Escolha efeitos conforme o conteúdo.\n- Misture punch-ins, lower thirds, cards e transições apenas quando aumentarem clareza ou retenção.\n`,
    clean: `\nPRESET DE EDIÇÃO: Clean Educacional\n- Priorize overlays discretos, lower thirds, cards limpos e transições suaves.\n- Evite excesso de zoom, flash, glitch ou efeitos chamativos.\n- Sensação: premium, clara, autoritativa.\n`,
    kinetic: `\nPRESET DE EDIÇÃO: Kinetic Reels\n- Use ritmo alto, punch-ins frequentes, textos de impacto, cards curtos, callouts e transições energéticas.\n- Mudança visual a cada 1.5-3s em talking head estático.\n- Sensação: CapCut profissional, dinâmico, retenção alta.\n`,
    cinematic: `\nPRESET DE EDIÇÃO: Cinematic Story\n- Use menos overlays, transições suaves, contraste elegante, vinheta, respiros e frases de impacto.\n- Valorize momentos emocionais e evite cortar pausas dramáticas demais.\n- Sensação: filme curto, institucional premium.\n`,
  };
  return hints[editPreset] ?? hints.auto;
}

export async function generatePlanText(
  words: EditAIWord[],
  transcription: string,
  formatoDestino: EditAIFormatoDestino = 'reels',
  editPreset: EditAIEditPreset = 'auto',
): Promise<string> {
  const formatoHint = buildFormatoDestinoHint(formatoDestino);
  const prompt = PLAN_PROMPT.replace('{transcription}', transcription) + formatoHint + buildEditPresetHint(editPreset);

  const text = await callOpenAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, maxTokens: 1200 },
  );

  if (!text) throw new Error('OpenAI returned empty plan text.');
  return text;
}

interface GeneratedSceneJSON {
  formato: string;
  paleta: { primaria: string; secundaria: string; acento: string; texto: string };
  cenas: Array<{
    id: number;
    tipo: string;
    startLeg: number;
    endLeg: number;
    conteudo: Record<string, unknown>;
  }>;
}

export async function generateScenes(
  words: EditAIWord[],
  transcription: string,
  planText: string,
  planApproved: boolean,
  template: EditAITemplate | null,
  formatoDestino: EditAIFormatoDestino = 'reels',
  editPreset: EditAIEditPreset = 'auto',
): Promise<{ formato: string; paleta: GeneratedSceneJSON['paleta']; scenes: EditAISceneRaw[] }> {
  if (!planApproved) {
    throw new Error('Plan must be approved (planApproved === true) before generating scenes. Call /plan/approve first.');
  }

  const templateHint = template ? buildTemplateHint(template) : '';
  const formatoHint = buildFormatoDestinoHint(formatoDestino);
  const presetHint = buildEditPresetHint(editPreset);
  const numberedWords = buildNumberedWords(words);

  // YouTube: allow up to 12 cenas; Reels: cap at 8
  const sceneCountRule = formatoDestino === 'youtube'
    ? '2. Crie entre 8 e 12 cenas distribuídas uniformemente pela duração'
    : '2. Crie entre 5 e 8 cenas (vídeo curto — seja conciso)';

  const prompt = SCENE_PROMPT
    .replace('{approved_plan}', planText)
    .replace('{transcription}', transcription)
    .replace('{numbered_words}', numberedWords)
    .replace('2. Crie entre 5 e 12 cenas por vídeo', sceneCountRule)
    .replace('{template_hint}', templateHint ? `\nTEMPLATE SUGERIDO:\n${templateHint}\n` : '')
    + formatoHint
    + presetHint;

  // json_object mode guarantees valid JSON — no need to strip markdown fences
  const raw = await callOpenAI(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, maxTokens: 3000, jsonMode: true },
  );

  if (!raw) throw new Error('OpenAI returned empty scene JSON.');
  const jsonText = raw;

  let parsed: GeneratedSceneJSON;
  try {
    parsed = JSON.parse(jsonText) as GeneratedSceneJSON;
  } catch {
    throw new Error(`Claude returned invalid JSON for scenes: ${jsonText.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.cenas) || parsed.cenas.length === 0) {
    throw new Error('Claude returned no scenes in JSON response.');
  }

  const scenes: EditAISceneRaw[] = parsed.cenas.map((c) => ({
    id: Number(c.id),
    tipo: c.tipo as EditAISceneRaw['tipo'],
    startLeg: Number(c.startLeg),
    endLeg: Number(c.endLeg),
    conteudo: c.conteudo ?? {},
  }));

  return {
    formato: String(parsed.formato || 'tutorial'),
    paleta: parsed.paleta,
    scenes,
  };
}
