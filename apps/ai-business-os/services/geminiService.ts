import { AspectRatio, ImageSize, Persona, SWOT, ResearchData, Epic } from "../types";
import type { AICapability } from "../types";
import { interpolatePromptTemplate } from "./aiPromptDefaults";

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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      capability,
      model,
      messages,
      responseFormat,
      temperature,
      maxTokens,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'AI router request failed.');
  }

  return {
    content: typeof payload?.content === 'string' ? payload.content : '',
    data: (payload?.data ?? null) as T | null,
    sources: Array.isArray(payload?.sources) ? payload.sources as GroundingSource[] : [],
  };
};

const routedImageGeneration = async ({
  prompt,
  size,
  ratio,
}: {
  prompt: string;
  size: ImageSize;
  ratio: AspectRatio;
}) => {
  const response = await fetch('/api/ai/router/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      size,
      ratio,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Image generation failed.');
  }

  return Array.isArray(payload?.images) ? payload.images as string[] : [];
};

const routedImageEditing = async ({
  prompt,
  base64Image,
}: {
  prompt: string;
  base64Image: string;
}) => {
  const mimeType = base64Image.match(/^data:(.+?);base64,/)?.[1] || 'image/png';
  const response = await fetch('/api/ai/router/image/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      base64Image,
      mimeType,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Image editing failed.');
  }

  return typeof payload?.image === 'string' ? payload.image : '';
};

const routedVideoGeneration = async ({
  prompt,
  aspectRatio,
}: {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
}) => {
  const response = await fetch('/api/ai/router/video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspectRatio,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Video generation failed.');
  }

  return typeof payload?.videoUrl === 'string' ? payload.videoUrl : null;
};

const extractJsonCandidate = (content: string) => {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced?.trim()) {
    return fenced.trim();
  }

  const firstCurly = content.indexOf('{');
  const lastCurly = content.lastIndexOf('}');
  if (firstCurly >= 0 && lastCurly > firstCurly) {
    return content.slice(firstCurly, lastCurly + 1);
  }

  const firstBracket = content.indexOf('[');
  const lastBracket = content.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return content.slice(firstBracket, lastBracket + 1);
  }

  return '';
};

const safeParseJson = <T>(content: string): T | null => {
  const candidate = extractJsonCandidate(content);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
};

const normalizeStringArray = (values: string[]) =>
  values
    .map((value) => value.trim())
    .filter((value) => value.length > 3)
    .filter((value, index, array) => array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

const compactStringArrayForPrompt = (values: string[], maxItems: number, maxCharsPerItem: number) =>
  normalizeStringArray(values)
    .slice(0, maxItems)
    .map((value) => value.length > maxCharsPerItem ? `${value.slice(0, maxCharsPerItem).trim()}...` : value);

const compactSourceTextForPrompt = (sourceText: string, maxChars: number) => {
  const normalized = sourceText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const headSize = Math.max(2500, Math.floor(maxChars * 0.7));
  const tailSize = Math.max(1200, Math.floor(maxChars * 0.2));

  return [
    normalized.slice(0, headSize).trim(),
    '[trecho intermediario omitido automaticamente para caber no limite do provedor]',
    normalized.slice(-tailSize).trim(),
  ].join('\n\n');
};

const isPayloadTooLargeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('(413)') || /too large|payload|context length/i.test(message);
};

const parseEditorialLinesFallback = (content: string): string[] => {
  const parsedObject = safeParseJson<{ lines?: string[] } | string[]>(content);
  if (Array.isArray(parsedObject)) {
    return normalizeStringArray(parsedObject.filter((item): item is string => typeof item === 'string'));
  }

  if (parsedObject && Array.isArray((parsedObject as { lines?: string[] }).lines)) {
    return normalizeStringArray((parsedObject as { lines: string[] }).lines);
  }

  return normalizeStringArray(
    content
      .split('\n')
      .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, '').trim())
      .filter(Boolean),
  );
};

const parseCalendarEntriesFallback = (content: string): ContentCalendarEntry[] => {
  const parsedObject = safeParseJson<{ entries?: ContentCalendarEntry[] } | ContentCalendarEntry[]>(content);
  const entries = Array.isArray(parsedObject)
    ? parsedObject
    : Array.isArray((parsedObject as { entries?: ContentCalendarEntry[] } | null)?.entries)
      ? (parsedObject as { entries: ContentCalendarEntry[] }).entries
      : [];

  return entries.filter((entry) => (
    entry
    && typeof entry.day === 'string'
    && typeof entry.format === 'string'
    && typeof entry.editorialLine === 'string'
    && typeof entry.theme === 'string'
    && typeof entry.description === 'string'
  ));
};

// 1. Fast Text (Flash Lite)
export const generateFastText = async (prompt: string): Promise<string> => {
  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [{ role: 'user', content: prompt }],
  });
  return content || "";
};

export interface BrandManifestoBrief {
  brandName: string;
  positioning: string;
  audience: string;
  voice: string;
  themes: string;
  objective: string;
  references: string;
}

export const generateBrandManifesto = async (
  brief: BrandManifestoBrief,
  customPrompt?: string,
  currentManifesto?: string,
): Promise<string> => {
  const brandName = brief.brandName.trim() || 'Marca sem nome definido';
  const systemInstruction = customPrompt?.trim()
    ? interpolatePromptTemplate(customPrompt, { brandName })
    : 'Você é um estrategista de branding e deve escrever um manifesto de marca robusto, claro e útil para orientar toda a produção de conteúdo.';

  const userPrompt = [
    'Crie ou refine um manifesto de marca em português do Brasil usando o briefing abaixo.',
    '',
    `Marca: ${brandName}`,
    `Posicionamento: ${brief.positioning || 'Nao informado.'}`,
    `Publico: ${brief.audience || 'Nao informado.'}`,
    `Tom de voz: ${brief.voice || 'Nao informado.'}`,
    `Territorios editoriais desejados: ${brief.themes || 'Nao informado.'}`,
    `Objetivo de negocio/conteudo: ${brief.objective || 'Nao informado.'}`,
    `Referencias e restricoes: ${brief.references || 'Nao informado.'}`,
    '',
    currentManifesto?.trim()
      ? `Manifesto atual para refino:\n${currentManifesto.trim()}\n`
      : 'Nao existe manifesto anterior salvo.',
    '',
    'Entregue um manifesto pronto para ser salvo como base permanente da marca. Estruture em secoes claras e mantenha linguagem estrategica, especifica e operacional.',
  ].join('\n');

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
  });

  return content.trim();
};

// 2. PRD Architecture Generator (Wizard)
export const generateInitialArchitecture = async (
    problem: string,
    persona: string,
    stack: string[],
    rules: string
): Promise<string> => {
    const systemInstruction = `Você é um **Product Manager Sênior e Arquiteto de Soluções**. Sua tarefa é ler os inputs e gerar uma estrutura de documentação técnica (PRD) inicial robusta.

**Diretrizes de Estilo:**
1. Use **Inter Bold** (Markdown **Bold**) para títulos de requisitos e seções.
2. Use **Tabelas Markdown** para definir o Dicionário de Dados.
3. Identifique riscos técnicos e sugira mitigações imediatamente.
4. O tom deve ser técnico, direto e focado em 'Engineering-Ready specs'.

**Estrutura de Saída Esperada:**
Comece com uma 'Visão Geral do Produto'.
Liste os 'Objetivos Principais'.
Crie uma seção de 'Arquitetura & Tech Stack' justificando as escolhas (${stack.join(', ')}).
Liste 5 Épicos Sugeridos para o MVP.`;

    const prompt = `Contexto do Projeto:
    Problema: ${problem}
    Persona Alvo: ${persona}
    Stack Tecnológica: ${stack.join(', ')}
    Regras Inegociáveis: ${rules}
    
    Gere a Arquitetura Inicial do PRD.`;

    const { content } = await routedTextChat<never>({
        capability: 'text_generation',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
        ],
    });

    return content || "";
};

// 3. PRD Refinement (Co-Pilot Chat)
export const refinePRD = async (
    currentPRD: string,
    instruction: string
): Promise<string> => {
    const systemInstruction = `Você é um Co-Pilot de Engenharia de Software. Sua função é editar e refinar documentos de requisitos (PRD) existentes com base em comandos do usuário.
    Mantenha a formatação Markdown existente.
    Seja preciso: altere apenas o que foi pedido, mantendo a coerência do resto do documento.
    Use tabelas para dados estruturados.`;

    const prompt = `DOCUMENTO ATUAL:
    ${currentPRD}
    
    COMANDO DE ALTERAÇÃO:
    ${instruction}
    
    Retorne o documento PRD completo e atualizado.`;

    const { content } = await routedTextChat<never>({
        capability: 'text_generation',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
        ],
    });

    return content || currentPRD;
};

// 4. Ecosystem Analysis (Data Analyst)
export const analyzeEcosystem = async (dataContext: string): Promise<string> => {
    // 3. Prompt de Análise de Dados (O Analista Psicomático)
    const systemInstruction = `Você é um **Cientista de Dados e Psicólogo Cognitivo**. Sua função é analisar o comportamento dos usuários dentro do Entrelaç[OS].
**Objetivo:** Identificar padrões de retenção e 'churn'.
**Visualização:** Suas respostas devem sugerir como os dados devem ser plotados em um **Grafo Radial**.
* Identifique o 'Núcleo' (Funcionalidade mais usada).
* Identifique as 'Periferias' (Funcionalidades esquecidas).
**Insight:** Forneça sempre um insight 'contraintuitivo' baseado nos dados apresentados.
**UI Context:** Lembre-se que o Entrelaç[OS] utiliza a Regra dos 8% de cor (Primary Active) e tipografia Inter/Source Serif 4.`;
    
    const { content } = await routedTextChat<never>({
        capability: 'text_generation',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Analise os seguintes dados e forneça insights: ${dataContext}` },
        ],
    });
    return content || "";
}

// 5. Image Generation (Pro Image)
export const generateImage = async (
  prompt: string,
  size: ImageSize,
  ratio: AspectRatio
): Promise<string[]> => {
  return routedImageGeneration({ prompt, size, ratio });
};

// 6. Image Editing (Flash Image)
export const editImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  return routedImageEditing({ prompt, base64Image });
};

// 7. Video Generation (Veo)
export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string | null> => {
  return routedVideoGeneration({ prompt, aspectRatio });
};

// 8. Educational Script Generation (Course Creator)
export interface ScriptSection {
  type: 'direction' | 'speech';
  text: string;
}

export interface ScriptStructure {
  hook: ScriptSection[];
  content: ScriptSection[];
  cta: ScriptSection[];
}

export const generateLessonScript = async (
  lessonTitle: string,
  persona: Persona
): Promise<ScriptStructure> => {
  const systemInstruction = `Você é um Roteirista Educacional de Elite da Academia Lendária.
Sua missão é criar roteiros de alta conversão usando o framework **10-80-10**.

**Contexto da Persona:**
* Nome: ${persona.name}
* Dor Principal: ${persona.pain_points}
* Estilo de Aprendizado: ${persona.learning_style}
* Nível de Consciência: ${persona.awareness_level}

**Estrutura Obrigatória do JSON:**
Retorne APENAS um objeto JSON com três chaves: 'hook', 'content', 'cta'.
Cada chave deve conter um ARRAY de objetos com:
* 'type': 'direction' (instrução de câmera/cena) ou 'speech' (fala do professor).
* 'text': O conteúdo textual.

**Regras de Roteiro (10-80-10):**
1. **O GANCHO (10%):** Conexão imediata. Use a dor da persona. Quebre uma objeção.
2. **O CONTEÚDO (80%):** Ensino denso.
   - Use o estilo de aprendizado da persona (ex: Visual = pedir para compartilhar tela).
   - Inclua um "Pulo do Gato" (Insight Lendário).
   - Inclua uma citação de autoridade.
3. **O PRÓXIMO PASSO (10%):** Ativação.
   - Tarefa de 24h (Quick Win).
   - Frase de Encerramento (Assinatura).`;

  const sectionSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['direction', 'speech'] },
      text: { type: 'string' },
    },
    required: ['type', 'text'],
  };

  const { data } = await routedTextChat<ScriptStructure>({
    capability: 'structured_text',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Crie um roteiro 10-80-10 para a aula: "${lessonTitle}"` },
    ],
    responseFormat: {
      name: 'lesson_script',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          hook: { type: 'array', items: sectionSchema },
          content: { type: 'array', items: sectionSchema },
          cta: { type: 'array', items: sectionSchema },
        },
        required: ['hook', 'content', 'cta'],
      },
    },
  });

  return data || { hook: [], content: [], cta: [] };
};

// 9. SWOT & Market Analysis (PRD Studio)
export const generateSWOT = async (
  project: string,
  competitors: string[]
): Promise<SWOT> => {
  const systemInstruction = `Atue como um Analista de Mercado Sênior. Sua tarefa é criar uma análise SWOT tática para um produto digital.
  
  **INSTRUÇÃO CRÍTICA:**
  Você DEVE usar a ferramenta 'googleSearch' para pesquisar informações atualizadas sobre os concorrentes fornecidos e o mercado atual. Não invente dados.
  
  **Entrada:** Descrição do Projeto e URLs/Nomes dos Concorrentes.
  
  **Formato de Saída (JSON):**
  Retorne um objeto JSON limpo.
  {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."],
    "usp": "Uma frase única e poderosa de diferenciação.",
    "viabilityScore": 0-100
  }
  `;

  const { data, sources } = await routedTextChat<Omit<SWOT, 'sources'>>({
    capability: 'search_grounded_text',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Projeto: ${project}. Concorrentes a pesquisar: ${competitors.join(', ')}. Compare e gere o SWOT.` },
    ],
    responseFormat: {
      name: 'swot_analysis',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          threats: { type: 'array', items: { type: 'string' } },
          usp: { type: 'string' },
          viabilityScore: { type: 'number' },
        },
        required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'usp', 'viabilityScore'],
      },
    },
  });

  return {
    strengths: data?.strengths || [],
    weaknesses: data?.weaknesses || [],
    opportunities: data?.opportunities || [],
    threats: data?.threats || [],
    usp: data?.usp || 'Error generating analysis.',
    viabilityScore: typeof data?.viabilityScore === 'number' ? data.viabilityScore : 50,
    sources,
  };
};

// 10. User Research Simulation (PRD Studio)
export const generateUserResearch = async (
  project: string,
  personaName: string
): Promise<ResearchData> => {
  const systemInstruction = `Atue como um Pesquisador de UX (User Researcher) conduzindo uma simulação de "Forum Mining" (Reddit, IndieHackers) e simulação de entrevista com a Persona.
  
  **Entrada:** Projeto e Persona.
  **Saída:** JSON Estrito.
  **Campos:**
  - painPoints: Lista de reclamações que essa persona faria sobre as soluções atuais.
  - forumInsights: Citações simuladas de fóruns reais que validam o problema.
  - technicalRisks: Lista de riscos técnicos associados à implementação da solução para essa dor.
  `;

  const { data } = await routedTextChat<ResearchData>({
    capability: 'structured_text',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Projeto: ${project}. Persona: ${personaName}` },
    ],
    responseFormat: {
      name: 'user_research',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          painPoints: { type: 'array', items: { type: 'string' } },
          forumInsights: { type: 'array', items: { type: 'string' } },
          technicalRisks: { type: 'array', items: { type: 'string' } },
        },
        required: ['painPoints', 'forumInsights', 'technicalRisks'],
      },
    },
  });

  return data || { painPoints:[], forumInsights:[], technicalRisks:[] };
};

// 11. Brief Builder Interview (Socratic)
export const generateBriefingQuestions = async (
  chatHistory: string
): Promise<string> => {
  const systemInstruction = `Você é um Entrevistador Socrático de Produtos Digitais. 
  Sua função é extrair o verdadeiro escopo do projeto do usuário através de perguntas estratégicas.
  Seja breve. Faça UMA pergunta por vez.
  Comece perguntando qual processo manual o software vai substituir ou otimizar.
  Se o usuário der uma resposta rasa, pergunte "Por que?" ou "Como isso impacta o negócio?".
  Seu tom deve ser profissional, curioso e focado em valor.`;

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: chatHistory },
    ],
  });

  return content || "";
}

// 12. Spec Validation (Consistency Checker)
export const validateSpecConsistency = async (
  prdContent: string,
  briefContext: string
): Promise<string> => {
    const systemInstruction = `Você é um Validador de Requisitos Sênior (QA Tech Lead).
    Sua missão é encontrar contradições lógicas, falhas de segurança ou lacunas entre o Briefing e o PRD.
    
    Exemplo de saída:
    "1. Contradição: Briefing diz 'App Offline First', mas PRD exige 'Firebase Realtime DB' sem estratégia de cache local.
     2. Risco: Nenhuma menção a GDPR na seção de dados do usuário."
     
    Seja implacável e direto. Use listas numeradas.`;

    const { content } = await routedTextChat<never>({
      capability: 'text_generation',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `CONTEXTO DO BRIEFING:\n${briefContext}\n\nCONTEÚDO DO PRD:\n${prdContent}` },
      ],
    });

    return content || "Nenhuma inconsistência crítica encontrada.";
}

// 13. Backlog Generator (Plan)
export const generateBacklog = async (
  prdContent: string
): Promise<Epic[]> => {
  const systemInstruction = `Você é um Agile Coach Sênior e Arquiteto de Software.
  Sua tarefa é ler um PRD técnico e transformá-lo em Épicos e User Stories acionáveis.
  
  **Regras de Saída (JSON):**
  Retorne um ARRAY de objetos 'Epic'.
  Cada 'Epic' tem: 'id', 'title', 'description', 'progress' (inicie com 0) e 'stories' (array).
  Cada 'UserStory' tem: 
  - 'id' (ex: US-101)
  - 'title' (formato: "Como [Persona], quero [Ação] para [Valor]")
  - 'acceptanceCriteria' (array de strings: ex: ["O usuário deve ver erro se senha < 8 chars"])
  - 'points' (Fibonacci: 1, 2, 3, 5, 8, 13 - Estime a complexidade baseada no PRD)
  - 'status' (sempre "BACKLOG")
  
  Crie pelo menos 3 épicos com 2-3 stories cada.`;

  const { data } = await routedTextChat<Epic[]>({
    capability: 'structured_text',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Analise este PRD e gere o backlog:\n${prdContent}` },
    ],
    responseFormat: {
      name: 'epic_backlog',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            progress: { type: 'number' },
            stories: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  acceptanceCriteria: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  points: { type: 'number' },
                  status: { type: 'string' }
                },
                required: ['id', 'title', 'acceptanceCriteria', 'points', 'status']
              }
            }
          },
          required: ['id', 'title', 'description', 'progress', 'stories']
        }
      }
    }
  });

  return Array.isArray(data) ? data : [];
}

// 14. API Docs Generator (Export)
export const generateApiSpecs = async (
  prdContent: string
): Promise<string> => {
  const systemInstruction = `Você é um Arquiteto de API RESTful.
  Gere uma especificação OpenAPI 3.0 (formato YAML) baseada no Dicionário de Dados e funcionalidades descritas no PRD.
  Foque nos principais endpoints (CRUD).
  Retorne APENAS o código YAML.`;

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prdContent },
    ],
  });

  return content || "";
}

// 15. Branding Copy Generator (Writer Agent)
export const generateBrandCopy = async (
  archetype: string,
  context: string,
  objective: string,
  angle: string
): Promise<string> => {
  const systemInstruction = `Você é uma Mente Sintética especializada em Copywriting de Alta Conversão da Academia Lendária.
  
  **Seu Arquétipo:** ${archetype}.
  **Estilo:** Minimalista, direto, provocativo. Use frases curtas.
  
  **Instruções de Formatação:**
  - Use Markdown.
  - Títulos em negrito.
  - Quebras de linha frequentes para legibilidade.
  
  **Tarefa:** Escreva um texto para o formato '${objective}' com o ângulo '${angle}'.
  `;

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Contexto Bruto: ${context}` },
    ],
  });

  return content || "";
}

// 16. Branding Copy Critique (Validator Agent)

export interface CritiqueResponse {
  status: 'APROVADO' | 'REVISÃO_NECESSÁRIA';
  analise_critica: string;
  ajustes_sugeridos: Array<{
    slide: number;
    antes: string;
    depois: string;
  }>;
  score_de_autenticidade: string;
}

export const critiqueBrandCopy = async (
  copy: string,
  archetype: string,
  context: string // Original Context
): Promise<CritiqueResponse> => {
  const systemInstruction = `Atuação: Você é o **Diretor de Criação e Estrategista da Entrelaç[OS]**. Sua missão é atuar como um filtro rigoroso para garantir que a copy gerada pelo Agente Redator seja autêntica, humana e altamente persuasiva, eliminando qualquer rastro de "texto padrão de ChatGPT".

**Sua Missão (Processo de Crítica):**

1. **Detector de "Cara de IA":** Identifique e substitua palavras viciadas de IAs (ex: "explore", "descubra", "mergulhe", "no cenário dinâmico de hoje"). O tom deve ser direto, afiado e voltado para o campo de batalha.
2. **Alinhamento com a Marca:** Verifique se o conteúdo respeita o **Design System e a Voz da Marca** definidos no PRD e no Relatório de Diretrizes (Arquétipo: ${archetype}).
3. **Filtro de Fricção:** Avalie se o conteúdo resolve as dores reais identificadas no **Step 2 (Contexto)**. Se a copy estiver muito genérica, você deve rejeitá-la e solicitar mais detalhes específicos do material bruto.
4. **Validação Visual:** Verifique se as "sugestões visuais" dadas pelo redator são compatíveis com o modelo **Nano Banana** e se respeitam a interface monocromática de camadas do Entrelaç[OS].

**Critérios de Aprovação (Checklist):**

* A copy é específica e usa termos técnicos do contexto original?
* O gancho é impossível de ignorar?
* O texto cabe nos limites visuais de um carrossel ou post sem poluir a tela?

**Formato de Saída (JSON):**

{
  "status": "APROVADO" ou "REVISÃO_NECESSÁRIA",
  "analise_critica": "Breve explicação da decisão",
  "ajustes_sugeridos": [
    {
      "slide": 0,
      "antes": "texto original",
      "depois": "texto refinado sem vício de IA"
    }
  ],
  "score_de_autenticidade": "0-100%"
}`;

  try {
      const { data } = await routedTextChat<CritiqueResponse>({
        capability: 'structured_text',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Analise esta copy gerada:\n${copy}\n\nContexto Original:\n${context}` },
        ],
        responseFormat: {
          name: 'branding_copy_critique',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              status: { type: 'string', enum: ['APROVADO', 'REVISÃO_NECESSÁRIA'] },
              analise_critica: { type: 'string' },
              ajustes_sugeridos: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    slide: { type: 'number' },
                    antes: { type: 'string' },
                    depois: { type: 'string' },
                  },
                  required: ['slide', 'antes', 'depois'],
                },
              },
              score_de_autenticidade: { type: 'string' },
            },
            required: ['status', 'analise_critica', 'ajustes_sugeridos', 'score_de_autenticidade'],
          },
        },
      });

      if (!data) {
        throw new Error('Groq returned an empty critique payload.');
      }

      return data;
  } catch (error) {
      console.error("JSON Parse Error in Critique", error);
      return {
          status: 'REVISÃO_NECESSÁRIA',
          analise_critica: 'Erro ao processar crítica estruturada.',
          ajustes_sugeridos: [],
          score_de_autenticidade: '0%'
      };
  }
}

// 17. Visual Directives (Art Director Agent)
export const generateVisualDirectives = async (
  copy: string,
  style: string
): Promise<string> => {
  const systemInstruction = `Você é um Diretor de Arte Sênior.
  Sua função é ler uma copy e criar diretrizes visuais para o designer (ou IA geradora de imagens).
  
  **Saída Esperada:**
  Um prompt detalhado e artístico em Inglês (para Midjourney/Imagen) que capture a essência da mensagem.
  Inclua: Sujeito, Ambiente, Iluminação, Estilo (ex: ${style}), Paleta de Cores.
  `;

  const { content } = await routedTextChat<never>({
    capability: 'text_generation',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `Copy: ${copy}` },
    ],
  });

  return content || "A modern minimalist abstract composition with liquid gold accents.";
}

// 18. Structured Content Generator (Carousel/Slides)
export interface SlideContent {
  id: number;
  title: string;
  body: string;
  visualPrompt: string; // The specific image prompt for this slide
}

export interface BrandingResponse {
    strategy: string;
    slides: SlideContent[];
    cta: string;
}

export interface ContentCalendarEntry {
  day: string;
  format: string;
  editorialLine: string;
  theme: string;
  description: string;
}

export interface ContentCalendarDateRange {
  startDate: string;
  endDate: string;
}

export interface CalendarCardSuggestionInput {
  manifestoText?: string;
  editorialLine?: string;
  format?: string;
  dateLabel?: string;
  customDirection?: string;
}

export interface CalendarCardSuggestion {
  format: string;
  theme: string;
  description: string;
}

export const generateStructuredContent = async (
  format: string,
  context: string,
  objective: string,
  archetype: string,
  customPrompt?: string
): Promise<BrandingResponse> => {
  const defaultSystemInstruction = `Você é o **Agente Redator Sênior** do ecossistema Entrelaç[OS]. Sua especialidade é o framework "Puxadinho Mansão": extrair a essência de inputs complexos e transformá-los em cópias persuasivas e estruturadas.

**Contexto da Persona:**
- Arquétipo: ${archetype}
- Formato Desejado: ${format}
- Objetivo: ${objective}

**Sua Missão (Processo):**

1. **Análise de Contexto:** Identifique o produto, a dor principal e o público-alvo (ICP) dentro do material fornecido.
2. **Definição de Ângulo:** Ajuste o tom de voz para um dos quatro pilares: Branding, Vendas, Autoridade ou Benefícios Chave.
3. **Estruturação de Copy (Saída 01):**
* **Gancho (Slide 01):** Crie um título magnético que interrompa o scroll.
* **Desenvolvimento:** Divida o conteúdo em uma sequência lógica de 5 a 8 slides.
* **CTA Final:** Defina uma chamada para ação clara e alinhada ao objetivo.

**Diretrizes de Qualidade:**
* **Não use clichês:** Evite termos genéricos de IA (ex: "mergulhar", "revolucionário"); mantenha a voz autêntica da Entrelaç[OS].
* **Foco na Retenção:** Utilize técnicas de storytelling para garantir que o leitor chegue ao último slide.
* **Preparação para o Visual:** Para cada seção de texto, sugira um conceito visual curto que será processado pelo Agente de Imagem.

**Formato de Saída (JSON):**
Sempre responda em formato estruturado:
{
  "estrategia": "Explicação do ângulo escolhido",
  "slides": [
    {
      "posicao": 1,
      "texto_principal": "Título do Gancho",
      "texto_apoio": "Subtítulo ou descrição",
      "sugestao_visual": "Conceito para geração de imagem (em Inglês, minimalista, dark mode)"
    }
  ],
  "cta": "Texto do botão ou slide final"
}`;

  const systemInstruction = customPrompt?.trim()
    ? interpolatePromptTemplate(customPrompt, {
        format,
        objective,
        archetype,
      })
    : defaultSystemInstruction;

  type StructuredBrandingPayload = {
    estrategia: string;
    slides: Array<{
      posicao: number;
      texto_principal: string;
      texto_apoio: string;
      sugestao_visual: string;
    }>;
    cta: string;
  };

  const normalizeStructuredBrandingPayload = (raw: StructuredBrandingPayload | null | undefined): BrandingResponse => {
    const parsed = raw ?? { estrategia: '', slides: [], cta: '' };
    const slides: SlideContent[] = Array.isArray(parsed.slides)
      ? parsed.slides.map((slide) => ({
          id: slide.posicao,
          title: slide.texto_principal,
          body: slide.texto_apoio,
          visualPrompt: slide.sugestao_visual,
        }))
      : [];

    if (parsed.cta) {
      slides.push({
        id: slides.length + 1,
        title: 'CTA',
        body: parsed.cta,
        visualPrompt: 'Clean minimalist typography of the call to action, dark background',
      });
    }

    return {
      strategy: parsed.estrategia || 'Estratégia padrão gerada.',
      slides,
      cta: parsed.cta || '',
    };
  };

  const runStructuredAttempt = async (preparedContext: string) => {
    const { data } = await routedTextChat<StructuredBrandingPayload>({
      capability: 'structured_text',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: `Contexto do Conteúdo: ${preparedContext}` },
      ],
      responseFormat: {
        name: 'branding_structured_content',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            estrategia: { type: 'string' },
            slides: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  posicao: { type: 'number' },
                  texto_principal: { type: 'string' },
                  texto_apoio: { type: 'string' },
                  sugestao_visual: { type: 'string' },
                },
                required: ['posicao', 'texto_principal', 'texto_apoio', 'sugestao_visual'],
              },
            },
            cta: { type: 'string' },
          },
          required: ['estrategia', 'slides', 'cta'],
        },
      },
    });

    return normalizeStructuredBrandingPayload(data);
  };

  const runTextFallbackAttempt = async (preparedContext: string) => {
    const { content } = await routedTextChat<never>({
      capability: 'text_generation',
      messages: [
        { role: 'system', content: `${systemInstruction}\n\nRetorne somente um JSON válido, sem markdown.` },
        { role: 'user', content: `Contexto do Conteúdo: ${preparedContext}` },
      ],
    });

    const parsed = safeParseJson<StructuredBrandingPayload>(content);
    if (!parsed) {
      throw new Error('A IA retornou texto sem um JSON válido para o conteúdo estruturado.');
    }

    return normalizeStructuredBrandingPayload(parsed);
  };

  try {
    const primaryAttempt = await runStructuredAttempt(compactSourceTextForPrompt(context, 9000));
    if (primaryAttempt.slides.length > 0) {
      return primaryAttempt;
    }

    throw new Error('A IA não retornou slides válidos.');
  } catch (error) {
    console.error('Structured content primary attempt failed', error);

    try {
      const retryAttempt = await runStructuredAttempt(compactSourceTextForPrompt(context, 5000));
      if (retryAttempt.slides.length > 0) {
        return retryAttempt;
      }
    } catch (retryError) {
      console.error('Structured content retry failed', retryError);
    }

    try {
      const fallbackAttempt = await runTextFallbackAttempt(compactSourceTextForPrompt(context, 4000));
      if (fallbackAttempt.slides.length > 0) {
        return fallbackAttempt;
      }
    } catch (fallbackError) {
      console.error('Structured content text fallback failed', fallbackError);
      throw fallbackError instanceof Error ? fallbackError : new Error('Erro ao gerar conteúdo estruturado.');
    }

    throw error instanceof Error ? error : new Error('Erro ao gerar conteúdo estruturado.');
  }
}

export const generateEditorialLines = async (
    sourceText: string,
    customPrompt?: string,
    sourceLabel: string = 'Manifesto'
): Promise<string[]> => {
    const promptInstruction = customPrompt?.trim()
        ? interpolatePromptTemplate(customPrompt, { sourceLabel })
        : `Baseado no seguinte ${sourceLabel.toLowerCase()}, crie 3 a 5 linhas editoriais principais para criação de conteúdo. Retorne apenas um array JSON de strings.`;

    const runAttempt = async (preparedSourceText: string) => {
        const prompt = `${promptInstruction}\n\n${sourceLabel}:\n${preparedSourceText}`;
        const { data, content } = await routedTextChat<{ lines: string[] }>({
            capability: 'structured_text',
            messages: [
                { role: 'system', content: 'Você é um estrategista editorial. Gere somente linhas editoriais claras, distintas e acionáveis.' },
                { role: 'user', content: prompt },
            ],
            responseFormat: {
                name: 'editorial_lines',
                strict: true,
                schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        lines: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    },
                    required: ['lines']
                }
            }
        });

        const structuredLines = Array.isArray(data?.lines) ? normalizeStringArray(data.lines) : [];
        if (structuredLines.length > 0) {
            return structuredLines;
        }

        return parseEditorialLinesFallback(content);
    };

    try {
        const primaryAttempt = await runAttempt(compactSourceTextForPrompt(sourceText, 12000));
        if (primaryAttempt.length > 0) {
            return primaryAttempt;
        }

        throw new Error('A IA respondeu sem linhas editoriais válidas.');
    } catch (error) {
        if (isPayloadTooLargeError(error)) {
            try {
                const retryAttempt = await runAttempt(compactSourceTextForPrompt(sourceText, 6000));
                if (retryAttempt.length > 0) {
                    return retryAttempt;
                }
            } catch (retryError) {
                console.error('Editorial lines retry error', retryError);
                throw retryError instanceof Error ? retryError : new Error('Erro ao gerar linhas editoriais.');
            }
        }

        console.error('Editorial lines parse error', error);
        throw error instanceof Error ? error : new Error('Erro ao gerar linhas editoriais.');
    }
}

export const generateContentCalendar = async (
    sourceText: string,
    editorialLines: string[],
    sourceLabel: string = 'Manifesto',
    dateRange?: ContentCalendarDateRange,
    customPrompt?: string
): Promise<ContentCalendarEntry[]> => {
    const periodInstruction = dateRange?.startDate && dateRange?.endDate
      ? `Crie um plano diario cobrindo exatamente o periodo de ${dateRange.startDate} ate ${dateRange.endDate}, com uma entrada por dia do periodo.`
      : 'Crie um calendario de conteudo para 1 semana (7 dias), com uma entrada por dia.';

    const promptInstruction = customPrompt?.trim()
      ? interpolatePromptTemplate(customPrompt, {
          sourceLabel,
          startDate: dateRange?.startDate || '',
          endDate: dateRange?.endDate || '',
        })
      : `Baseado no contexto de marca e nas linhas editoriais, ${periodInstruction}`;

    const runAttempt = async (preparedSourceText: string, preparedEditorialLines: string[]) => {
        const prompt = `${promptInstruction}
        
        ${sourceLabel}:
        ${preparedSourceText}
        
        Linhas Editoriais:
        ${preparedEditorialLines.join(', ')}
        
        Retorne um array JSON de objetos com as propriedades: day (string, ex: "2026-03-23 - Segunda-feira"), format (string, ex: "Post de Instagram"), editorialLine (string com o nome exato de uma das linhas editoriais fornecidas), theme (string), description (string).
        Use somente as linhas editoriais fornecidas como base do calendario e sempre associe cada entrada a uma delas via editorialLine.`;

        const { data, content } = await routedTextChat<{ entries: ContentCalendarEntry[] }>({
            capability: 'structured_text',
            messages: [
                { role: 'system', content: 'Você é um estrategista de conteúdo. Gere um calendário coerente, prático e alinhado às linhas editoriais recebidas.' },
                { role: 'user', content: prompt },
            ],
            responseFormat: {
                name: 'content_calendar',
                strict: true,
                schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        entries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                additionalProperties: false,
                                properties: {
                                    day: { type: 'string' },
                                    format: { type: 'string' },
                                    editorialLine: { type: 'string' },
                                    theme: { type: 'string' },
                                    description: { type: 'string' }
                                },
                                required: ['day', 'format', 'editorialLine', 'theme', 'description']
                            }
                        }
                    },
                    required: ['entries']
                }
            }
        });

        const structuredEntries = Array.isArray(data?.entries) ? data.entries : [];
        if (structuredEntries.length > 0) {
            return structuredEntries;
        }

        return parseCalendarEntriesFallback(content);
    };

    const runTextFallbackAttempt = async (preparedSourceText: string, preparedEditorialLines: string[]) => {
        const prompt = `${promptInstruction}
        
        ${sourceLabel}:
        ${preparedSourceText}
        
        Linhas Editoriais:
        ${preparedEditorialLines.join(', ')}
        
        Retorne somente JSON válido, sem markdown.
        Use o formato:
        {
          "entries": [
            {
              "day": "2026-03-23 - Segunda-feira",
              "format": "Post de Instagram",
              "editorialLine": "nome exato de uma das linhas editoriais fornecidas",
              "theme": "tema do dia",
              "description": "descrição prática do conteúdo"
            }
          ]
        }
        
        Use somente as linhas editoriais fornecidas e associe cada entrada a uma delas no campo editorialLine.`;

        const { content } = await routedTextChat<never>({
            capability: 'text_generation',
            messages: [
                { role: 'system', content: 'Você é um estrategista de conteúdo. Responda apenas com JSON válido, coerente e diretamente utilizável para um calendário editorial.' },
                { role: 'user', content: prompt },
            ],
        });

        const parsedEntries = parseCalendarEntriesFallback(content);
        if (parsedEntries.length === 0) {
            throw new Error('A IA retornou texto sem um JSON válido para o calendário editorial.');
        }

        return parsedEntries;
    };

    try {
        const primaryAttempt = await runAttempt(
            compactSourceTextForPrompt(sourceText, 12000),
            compactStringArrayForPrompt(editorialLines, 8, 220),
        );

        if (primaryAttempt.length > 0) {
            return primaryAttempt;
        }

        throw new Error('A IA nao retornou um calendario valido para o periodo selecionado.');
    } catch (error) {
        console.error("Content calendar primary attempt failed", error);

        try {
            const retryAttempt = await runAttempt(
                compactSourceTextForPrompt(sourceText, isPayloadTooLargeError(error) ? 6000 : 8000),
                compactStringArrayForPrompt(editorialLines, 6, 160),
            );

            if (retryAttempt.length > 0) {
                return retryAttempt;
            }
        } catch (retryError) {
            console.error('Content calendar retry error', retryError);
        }

        try {
            const fallbackAttempt = await runTextFallbackAttempt(
                compactSourceTextForPrompt(sourceText, 5000),
                compactStringArrayForPrompt(editorialLines, 5, 140),
            );

            if (fallbackAttempt.length > 0) {
                return fallbackAttempt;
            }
        } catch (fallbackError) {
            console.error('Content calendar text fallback error', fallbackError);
        }

        console.error("Content calendar parse error", error);
        throw new Error('A IA não conseguiu gerar um calendário válido com o provider textual ativo. Revise o prompt do calendário, reduza o contexto enviado ou configure credenciais do Gemini como fallback.');
    }
}

export const generateFormatPrompts = async (manifestoText: string, format: string, customPrompt?: string): Promise<string> => {
    const promptInstruction = customPrompt?.trim()
      ? interpolatePromptTemplate(customPrompt, { format })
      : `Baseado no manifesto da marca, crie um prompt detalhado que eu possa usar em uma IA para gerar um ${format}. O prompt deve instruir a IA a seguir o tom de voz, valores e estilo definidos no manifesto.
    
    Retorne apenas o texto do prompt.`;

    const runAttempt = async (preparedManifestoText: string) => {
        const prompt = `${promptInstruction}
        
        Manifesto:
        ${preparedManifestoText}`;

        const { content } = await routedTextChat<never>({
            capability: 'text_generation',
            messages: [
                { role: 'system', content: 'Você cria prompts de produção claros, densos e diretamente reutilizáveis para geração de conteúdo.' },
                { role: 'user', content: prompt },
            ],
        });

        return content || "";
    };

    try {
        return await runAttempt(compactSourceTextForPrompt(manifestoText, 12000));
    } catch (error) {
        if (isPayloadTooLargeError(error)) {
            return runAttempt(compactSourceTextForPrompt(manifestoText, 6000));
        }

        throw error instanceof Error ? error : new Error('Erro ao gerar prompt por formato.');
    }
}

export const generateCalendarCardSuggestion = async ({
    manifestoText = '',
    editorialLine = '',
    format = 'Post de Instagram',
    dateLabel = '',
    customDirection = '',
}: CalendarCardSuggestionInput): Promise<CalendarCardSuggestion> => {
    const prompt = `
    Você está criando uma sugestão de card de calendário editorial.

    Contexto do manifesto:
    ${compactSourceTextForPrompt(manifestoText || 'Sem manifesto fornecido.', 5000)}

    Linha editorial:
    ${editorialLine || 'Sem linha editorial definida.'}

    Formato desejado:
    ${format}

    Data de referência:
    ${dateLabel || 'Sem data definida.'}

    Direção adicional:
    ${customDirection || 'Nenhuma. Se não houver direção, proponha algo estratégico e coerente.'}

    Retorne um JSON com:
    - format: string
    - theme: string
    - description: string

    A resposta deve ser prática, pronta para virar um card de conteúdo, sempre alinhada ao manifesto e à linha editorial quando existirem.
    `;

    const { data, content } = await routedTextChat<CalendarCardSuggestion>({
        capability: 'structured_text',
        messages: [
            {
                role: 'system',
                content: 'Você é um estrategista editorial especialista em transformar manifesto e linha editorial em ideias de conteúdo acionáveis.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        responseFormat: {
            name: 'calendar_card_suggestion',
            strict: true,
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    format: { type: 'string' },
                    theme: { type: 'string' },
                    description: { type: 'string' },
                },
                required: ['format', 'theme', 'description'],
            },
        },
    });

    if (data?.format && data?.theme && data?.description) {
        return data;
    }

    const parsed = safeParseJson<CalendarCardSuggestion>(content);
    if (parsed?.format && parsed?.theme && parsed?.description) {
        return parsed;
    }

    throw new Error('A IA não retornou uma sugestão válida para o card.');
};
