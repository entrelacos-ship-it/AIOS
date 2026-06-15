import { type EditAITemplate, type EditAISceneType, type EditAIFormatoDestino } from '../types.js';

export interface TemplateScene {
  tipo: EditAISceneType;
  contentsHint: string;
}

export interface EditAITemplateScaffold {
  id: EditAITemplate;
  name: string;
  minDuration: number;
  maxDuration: number;
  targetFormats: string[];
  sceneStructure: TemplateScene[];
  paletteHint: string;
  promptHint: string;
}

export const TEMPLATES: Record<EditAITemplate, EditAITemplateScaffold> = {
  'dicas-rapidas': {
    id: 'dicas-rapidas',
    name: 'Dicas Rápidas',
    minDuration: 15,
    maxDuration: 30,
    targetFormats: ['lista', 'tutorial'],
    sceneStructure: [
      { tipo: 'B', contentsHint: 'Contexto do tema ou nome da profissional' },
      { tipo: 'E', contentsHint: 'Dica 1 com número e ícone' },
      { tipo: 'E', contentsHint: 'Dica 2 com número e ícone' },
      { tipo: 'E', contentsHint: 'Dica 3 com número e ícone' },
      { tipo: 'I', contentsHint: 'CTA — salvar, seguir ou compartilhar' },
    ],
    paletteHint: 'Energética — acento vibrante (ex: laranja ou violeta), fundo escuro',
    promptHint: 'Vídeo curto de dicas rápidas. Estrutura B→E→E→E→I. Máximo 5 cenas. Cenas E usam números sequenciais.',
  },

  'aula-teorica': {
    id: 'aula-teorica',
    name: 'Aula Teórica',
    minDuration: 180,
    maxDuration: 300,
    targetFormats: ['processo', 'comparativo', 'tutorial'],
    sceneStructure: [
      { tipo: 'B', contentsHint: 'Título da aula e contexto' },
      { tipo: 'A', contentsHint: 'Conceito central em frase impactante' },
      { tipo: 'C+', contentsHint: 'Primeiro ponto com desenvolvimento' },
      { tipo: 'C+', contentsHint: 'Segundo ponto com desenvolvimento' },
      { tipo: 'H', contentsHint: 'Fluxo ou etapas do processo' },
      { tipo: 'G', contentsHint: 'Dado ou estatística de impacto' },
      { tipo: 'I', contentsHint: 'CTA — aprofundar no conteúdo ou salvar' },
    ],
    paletteHint: 'Profissional — tons sóbrios, texto nítido, contraste alto',
    promptHint: 'Aula educacional estruturada. Estrutura B→A→C+→C+→H→G→I. Entre 7 e 10 cenas. Progressão lógica de conceitos.',
  },

  'caso-historia': {
    id: 'caso-historia',
    name: 'Caso / História',
    minDuration: 120,
    maxDuration: 180,
    targetFormats: ['storytelling', 'depoimento', 'motivacional'],
    sceneStructure: [
      { tipo: 'A', contentsHint: 'Frase de gancho — tensão ou curiosidade' },
      { tipo: 'B', contentsHint: 'Contextualização do caso ou situação' },
      { tipo: 'F', contentsHint: 'Fala ou mensagem da personagem' },
      { tipo: 'BONECO', contentsHint: 'Cena ilustrativa com stick figure' },
      { tipo: 'C+', contentsHint: 'Virada ou aprendizado da história' },
      { tipo: 'I', contentsHint: 'CTA emocional — reflexão ou ação' },
    ],
    paletteHint: 'Emocional — tons quentes (âmbar, terracota), contraste suave',
    promptHint: 'Narrativa com arco emocional. Estrutura A→B→F→BONECO→C+→I. Entre 5 e 8 cenas. Respeitar tom empático.',
  },

  'aula-longa': {
    id: 'aula-longa',
    name: 'Aula Longa (YouTube)',
    minDuration: 300,    // 5 min
    maxDuration: 1200,   // 20 min
    targetFormats: ['processo', 'comparativo', 'tutorial', 'lista'],
    sceneStructure: [
      { tipo: 'B', contentsHint: 'Título e apresentação da aula' },
      { tipo: 'A', contentsHint: 'Conceito central — frase de impacto' },
      { tipo: 'H', contentsHint: 'Roteiro/índice da aula (capítulos)' },
      { tipo: 'C+', contentsHint: 'Capítulo 1 — ponto com desenvolvimento' },
      { tipo: 'C+', contentsHint: 'Capítulo 2 — ponto com desenvolvimento' },
      { tipo: 'G', contentsHint: 'Dado ou estatística de impacto' },
      { tipo: 'C+', contentsHint: 'Capítulo 3 — ponto com desenvolvimento' },
      { tipo: 'D', contentsHint: 'Comparativo ou contraste conceitual' },
      { tipo: 'H', contentsHint: 'Síntese — recapitulação dos pontos' },
      { tipo: 'I', contentsHint: 'CTA — próximo vídeo, inscrição ou material' },
    ],
    paletteHint: 'Profissional clean — fundo neutro, texto de alto contraste, acento consistente com identidade visual',
    promptHint: 'Aula longa para YouTube. Estrutura B→A→H→C+×3→G→D→H→I. Entre 8 e 12 cenas. Distribuir uniformemente pela duração. Incluir cena de índice no início.',
  },
};

/** For YouTube long-form, also detect by formatoDestino override */
export function detectTemplate(
  formato: string,
  durationSeconds: number,
  formatoDestino?: EditAIFormatoDestino,
): EditAITemplate | null {
  // YouTube videos >= 5 min → always use aula-longa regardless of detected format
  if (formatoDestino === 'youtube' && durationSeconds >= 300) {
    return 'aula-longa';
  }

  return detectTemplateByContent(formato, durationSeconds);
}

function detectTemplateByContent(formato: string, durationSeconds: number): EditAITemplate | null {
  for (const scaffold of Object.values(TEMPLATES)) {
    if (
      scaffold.targetFormats.includes(formato.toLowerCase()) &&
      durationSeconds >= scaffold.minDuration &&
      durationSeconds <= scaffold.maxDuration
    ) {
      return scaffold.id;
    }
  }
  return null;
}


export function buildTemplateHint(template: EditAITemplate): string {
  const scaffold = TEMPLATES[template];
  const structure = scaffold.sceneStructure
    .map((s, i) => `  Cena ${i + 1} (tipo ${s.tipo}): ${s.contentsHint}`)
    .join('\n');

  return `
TEMPLATE APLICADO: ${scaffold.name}
Estrutura de cenas base:
${structure}
Paleta sugerida: ${scaffold.paletteHint}
Orientação: ${scaffold.promptHint}
`.trim();
}
