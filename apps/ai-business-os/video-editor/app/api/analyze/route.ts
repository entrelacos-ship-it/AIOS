import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import type { ColorPalette, EloCutAnalysis, EloCutProject, EloCutScene, SRTSegment } from '@/lib/types';

export const runtime = 'nodejs';

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const openRouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  : null;

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#FFB800',
  secondary: '#F97316',
  accent: '#FFD86B',
  background: '#050508',
  text: '#F6F1E8',
};

function safeJsonParse(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in AI response');
  }
  return JSON.parse(match[0]) as EloCutAnalysis;
}

function toSentenceCase(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[a-z]/, (char) => char.toUpperCase());
}

function sceneTitleFromText(text: string, fallback: string) {
  const tokens = text
    .replace(/[^A-Za-z0-9À-ÿ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  return toSentenceCase(tokens.join(' ')) || fallback;
}

function pickSceneType(index: number, total: number): EloCutScene['type'] {
  if (index === 0) return 'hook';
  if (index === total - 1) return 'outro';
  return index % 2 === 0 ? 'talking_head' : 'text_reveal';
}

function pickVisualStyle(index: number): EloCutScene['visualStyle'] {
  const styles: EloCutScene['visualStyle'][] = ['energetic', 'kinetic', 'minimal', 'dramatic'];
  return styles[index % styles.length];
}

function pickSentiment(text: string): EloCutScene['sentiment'] {
  const normalized = text.toLowerCase();
  if (/(incrivel|surpresa|wow|demais|perfeito|ganho|cresceu|melhor)/.test(normalized)) return 'excited';
  if (/(calma|sereno|passo|explica|detalhe|tutorial)/.test(normalized)) return 'calm';
  if (/(erro|problema|falha|ruim|crise|perdeu)/.test(normalized)) return 'negative';
  if (/(bom|ótimo|sucesso|vitória|cresceu|positivo)/.test(normalized)) return 'positive';
  return 'neutral';
}

function splitIntoScenes(subtitles: SRTSegment[]) {
  const desiredSceneCount = Math.min(6, Math.max(3, Math.ceil(subtitles.length / 6)));
  const chunkSize = Math.max(1, Math.ceil(subtitles.length / desiredSceneCount));
  const scenes: Array<{ startLeg: number; endLeg: number; subtitles: SRTSegment[] }> = [];

  for (let start = 0; start < subtitles.length; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, subtitles.length - 1);
    scenes.push({
      startLeg: start,
      endLeg: end,
      subtitles: subtitles.slice(start, end + 1),
    });
  }

  return scenes;
}

function buildHeuristicAnalysis(project: EloCutProject): EloCutAnalysis {
  const subtitles = project.subtitles;
  const totalDuration = subtitles[subtitles.length - 1]?.endSeconds ?? 0;

  if (subtitles.length === 0) {
    return {
      title: project.originalFilename.replace(/\.[^.]+$/, ''),
      summary: 'Projeto carregado sem legenda disponível para análise automática.',
      totalDuration,
      narrativeFormat: {
        type: 'educational',
        hook: 'Abrir com a fala mais forte do vídeo.',
        pacing: 'medium',
        tone: 'professional',
      },
      palette: DEFAULT_PALETTE,
      scenes: [
        {
          id: 'scene_1',
          type: 'hook',
          startLeg: 0,
          endLeg: 0,
          title: 'Abrir o vídeo',
          description: 'Tela de abertura com o tema principal do material bruto.',
          visualStyle: 'kinetic',
          backgroundColor: '#10131A',
          accentColor: '#FFB800',
          keywords: ['intro', 'video', 'hook'],
          illustrationPrompt: `Vertical premium editorial frame for "${project.originalFilename}" with golden highlights and cinematic depth`,
          sentiment: 'neutral',
        },
      ],
    };
  }

  const baseScenes = splitIntoScenes(subtitles);
  const scenes: EloCutScene[] = baseScenes.map((sceneGroup, index) => {
    const combinedText = sceneGroup.subtitles.map((item) => item.text).join(' ');
    const keywords = combinedText
      .replace(/[^A-Za-z0-9À-ÿ\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 4);

    return {
      id: `scene_${index + 1}`,
      type: pickSceneType(index, baseScenes.length),
      startLeg: sceneGroup.startLeg,
      endLeg: sceneGroup.endLeg,
      title: sceneTitleFromText(combinedText, `Cena ${index + 1}`),
      description: `Transformar este trecho em um bloco visual vertical com foco em ${keywords[0] ?? 'narrativa'}, reforçando a mensagem principal com ritmo premium e clareza editorial.`,
      visualStyle: pickVisualStyle(index),
      backgroundColor: ['#0F1117', '#13111B', '#111827', '#1A0F12'][index % 4],
      accentColor: ['#FFB800', '#F97316', '#60A5FA', '#F472B6'][index % 4],
      keywords: keywords.length > 0 ? keywords : ['narrativa', 'video', 'edicao'],
      illustrationPrompt: `Create a cinematic vertical illustration for scene "${sceneTitleFromText(combinedText, `Cena ${index + 1}`)}" using ${pickVisualStyle(index)} motion language, dark premium background and golden accent lights`,
      sentiment: pickSentiment(combinedText),
    };
  });

  return {
    title: sceneTitleFromText(subtitles.slice(0, 3).map((item) => item.text).join(' '), 'Novo corte'),
    summary: `Análise heurística montada a partir de ${subtitles.length} legendas para acelerar a revisão do corte.`,
    totalDuration,
    narrativeFormat: {
      type: 'educational',
      hook: subtitles[0]?.text ?? 'Abrir com a primeira frase de maior impacto.',
      pacing: totalDuration < 45 ? 'fast' : totalDuration < 90 ? 'medium' : 'slow',
      tone: /você|vocês|galera|gente/i.test(subtitles.map((item) => item.text).join(' ')) ? 'casual' : 'professional',
    },
    palette: DEFAULT_PALETTE,
    scenes,
  };
}

async function analyzeWithClaude(transcript: string, prompt?: string) {
  if (!openRouter) return null;

  const completion = await openRouter.chat.completions.create({
    model: process.env.CLAUDE_MODEL || 'anthropic/claude-3.5-sonnet',
    temperature: 0.25,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are EloCut, an expert short-form video editor. Return only JSON. Build a premium 9:16 edit plan with scene timing using subtitle indexes, a coherent palette, narrative pacing, emotion tags, and image prompts for each scene.',
      },
      {
        role: 'user',
        content: `Analyze the transcript below and produce this JSON:
{
  "title": "string",
  "summary": "string",
  "totalDuration": number,
  "narrativeFormat": {
    "type": "educational|storytelling|listicle|hook_cta|interview",
    "hook": "string",
    "pacing": "fast|medium|slow",
    "tone": "professional|casual|energetic|emotional"
  },
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "scenes": [
    {
      "id": "scene_1",
      "type": "hook|talking_head|text_reveal|outro",
      "startLeg": 0,
      "endLeg": 5,
      "title": "max 5 words",
      "description": "1-2 short sentences",
      "visualStyle": "kinetic|minimal|dramatic|energetic",
      "backgroundColor": "#hex",
      "accentColor": "#hex",
      "keywords": ["w1", "w2", "w3"],
      "illustrationPrompt": "cinematic vertical image prompt",
      "sentiment": "neutral|positive|negative|excited|calm"
    }
  ]
}

Rules:
- startLeg and endLeg are zero-based subtitle indexes
- keep scenes contiguous and cover the full video
- tailor the edit for 1080x1920 premium dark visuals with gold accents
- output valid JSON only
${prompt ? `- editor direction: ${prompt}` : '' }

TRANSCRIPT:
${transcript}`,
      },
    ],
  });

  return safeJsonParse(completion.choices[0]?.message?.content ?? '');
}

async function analyzeWithGroqFallback(transcript: string, prompt?: string) {
  if (!groq) return null;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.25,
    messages: [
      {
        role: 'system',
        content:
          'You are EloCut, a professional AI video editor. Return only JSON for a vertical 9:16 scene plan with palette, narrative, and scenes using zero-based subtitle indexes.',
      },
      {
        role: 'user',
        content: `Return JSON matching this schema: {"title":"string","summary":"string","totalDuration":0,"narrativeFormat":{"type":"educational|storytelling|listicle|hook_cta|interview","hook":"string","pacing":"fast|medium|slow","tone":"professional|casual|energetic|emotional"},"palette":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex"},"scenes":[{"id":"scene_1","type":"hook|talking_head|text_reveal|outro","startLeg":0,"endLeg":1,"title":"string","description":"string","visualStyle":"kinetic|minimal|dramatic|energetic","backgroundColor":"#hex","accentColor":"#hex","keywords":["a","b","c"],"illustrationPrompt":"string","sentiment":"neutral|positive|negative|excited|calm"}]}.
${prompt ? `Editor notes: ${prompt}` : ''}
Transcript:
${transcript}`,
      },
    ],
    max_tokens: 4096,
  });

  return safeJsonParse(completion.choices[0]?.message?.content ?? '');
}

export async function POST(req: NextRequest) {
  try {
    const { project }: { project: EloCutProject } = await req.json();

    if (project.subtitles.length === 0) {
      return NextResponse.json({ error: 'No subtitles available for analysis' }, { status: 400 });
    }

    const transcript = project.subtitles
      .map((segment, index) => `[${index}] ${segment.startTime} -> ${segment.endTime}: ${segment.text}`)
      .join('\n');

    const prompt = project.userPrompt;
    let analysis: EloCutAnalysis | null = null;

    try {
      analysis = await analyzeWithClaude(transcript, prompt);
    } catch (error) {
      console.warn('[analyze] Claude provider failed, trying fallback:', error);
    }

    if (!analysis) {
      try {
        analysis = await analyzeWithGroqFallback(transcript, prompt);
      } catch (error) {
        console.warn('[analyze] Groq fallback failed, using heuristic analysis:', error);
      }
    }

    if (!analysis) {
      analysis = buildHeuristicAnalysis(project);
    }

    return NextResponse.json({ project: { ...project, analysis } });
  } catch (error) {
    console.error('[analyze]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
