import type { AIPromptTemplate, AIPromptTemplateId } from '../types';

type PromptDefinition = Omit<AIPromptTemplate, 'updatedAt'>;

export const DEFAULT_AI_PROMPT_TEMPLATES: Record<AIPromptTemplateId, PromptDefinition> = {
  branding_manifesto_agent: {
    id: 'branding_manifesto_agent',
    label: 'Agente de manifesto da marca',
    description: 'System prompt do agente que cria ou refina o manifesto fundador da marca. Pode usar {{brandName}}.',
    group: 'manifesto',
    scope: 'branding',
    prompt: 'Você é o agente fundador de branding da Entrelaç[OS]. Sua função é criar ou refinar o manifesto central da marca com alta clareza estratégica e valor prático para produção de conteúdo futura. Sempre escreva em português do Brasil. Estruture o resultado em seções objetivas: Essência da Marca, Posicionamento, Promessa, Valores, Tom de Voz, Territórios Editoriais, Diretrizes de Conteúdo e O que a marca nunca deve fazer. Evite clichês, generalidades e frases vazias. Se houver contexto prévio, preserve o que já faz sentido e melhore o que estiver fraco. Se {{brandName}} existir, trate esse nome como a marca principal.',
  },
  branding_editorial_manifesto: {
    id: 'branding_editorial_manifesto',
    label: 'Linhas editoriais a partir do manifesto',
    description: 'Usado para sugerir linhas editoriais quando existe manifesto. Pode usar {{sourceLabel}}.',
    group: 'editorial',
    scope: 'branding',
    prompt: 'Baseado no seguinte {{sourceLabel}}, crie 3 a 5 linhas editoriais principais para criação de conteúdo. Retorne linhas claras, distintas, acionáveis e semanticamente diferentes entre si.',
  },
  branding_editorial_blank: {
    id: 'branding_editorial_blank',
    label: 'Linhas editoriais do zero',
    description: 'Usado quando o contexto vem do briefing manual. Pode usar {{sourceLabel}}.',
    group: 'editorial',
    scope: 'branding',
    prompt: 'Com base no briefing de marca abaixo, crie 4 a 6 linhas editoriais claras, distintas e acionáveis para orientar a criação de conteúdo. Evite generalidades e traduza o posicionamento em territórios editoriais práticos.',
  },
  branding_content_calendar: {
    id: 'branding_content_calendar',
    label: 'Calendário de conteúdo',
    description: 'Usado para gerar o calendário a partir das linhas editoriais. Pode usar {{startDate}}, {{endDate}} e {{sourceLabel}}.',
    group: 'calendar',
    scope: 'branding',
    prompt: 'Gere um calendário de conteúdo coerente, prático e alinhado às linhas editoriais. Distribua formatos e temas ao longo do período, mantendo diversidade e conexão explícita com as linhas fornecidas.',
  },
  branding_format_prompt_default: {
    id: 'branding_format_prompt_default',
    label: 'Prompt-base para formatos',
    description: 'Fallback para criar prompts de produção por formato. Pode usar {{format}}.',
    group: 'format_prompt',
    scope: 'branding',
    prompt: 'Baseado no manifesto da marca, crie um prompt detalhado que eu possa usar em uma IA para gerar um {{format}}. O prompt deve instruir a IA a seguir tom de voz, valores, estilo e objetivo da marca. Retorne apenas o texto do prompt final.',
  },
  branding_format_prompt_carousel: {
    id: 'branding_format_prompt_carousel',
    label: 'Prompt de produção: carrossel',
    description: 'Especializado para carrosséis.',
    group: 'format_prompt',
    scope: 'branding',
    prompt: 'Baseado no manifesto da marca, crie um prompt detalhado para gerar um carrossel em HTML/CSS com uma página por slide. O prompt final deve pedir abertura forte, progressão slide a slide, retenção até o último quadro, CTA coerente com a marca, viewport 1080x1440, HTML autocontido, sem dependências externas, e tipografia legível para mobile com títulos grandes, corpo curto e hierarquia visual clara.',
  },
  branding_format_prompt_ads: {
    id: 'branding_format_prompt_ads',
    label: 'Prompt de produção: ads',
    description: 'Especializado para anúncios criativos.',
    group: 'format_prompt',
    scope: 'branding',
    prompt: 'Baseado no manifesto da marca, crie um prompt detalhado para gerar uma peça de ads criativo. O prompt final deve enfatizar gancho imediato, proposta de valor, fricção mínima e CTA orientado a conversão.',
  },
  branding_format_prompt_post: {
    id: 'branding_format_prompt_post',
    label: 'Prompt de produção: post único',
    description: 'Especializado para posts únicos.',
    group: 'format_prompt',
    scope: 'branding',
    prompt: 'Baseado no manifesto da marca, crie um prompt detalhado para gerar um post único. O prompt final deve pedir mensagem direta, síntese forte e linguagem visual compatível com consumo rápido.',
  },
  branding_format_prompt_slide: {
    id: 'branding_format_prompt_slide',
    label: 'Prompt de produção: slide deck',
    description: 'Especializado para apresentações.',
    group: 'format_prompt',
    scope: 'branding',
    prompt: 'Baseado no manifesto da marca, crie um prompt detalhado para gerar um slide deck em HTML/CSS. O prompt final deve pedir clareza executiva, hierarquia visual, narrativa de apresentação profissional, uma tela por slide, HTML autocontido, exportação limpa para PNG e regras de legibilidade com títulos fortes, corpo curto e contraste alto.',
  },
  branding_content_generation_carousel: {
    id: 'branding_content_generation_carousel',
    label: 'Geração de conteúdo: carrossel',
    description: 'Prompt do agente redator para carrossel. Pode usar {{format}}, {{objective}} e {{archetype}}.',
    group: 'content_generation',
    scope: 'branding',
    prompt: 'Você é o Agente Redator Sênior do ecossistema Entrelaç[OS]. Gere conteúdo no formato {{format}} para o objetivo {{objective}} e o arquétipo {{archetype}}. Estruture com gancho forte, desenvolvimento em sequência lógica e CTA final, mantendo retenção e especificidade. Cada slide deve carregar uma ideia central, título curto, corpo enxuto o bastante para leitura confortável em 1080x1440 e orientação visual objetiva para futura renderização em HTML/CSS.',
  },
  branding_content_generation_ads: {
    id: 'branding_content_generation_ads',
    label: 'Geração de conteúdo: ads',
    description: 'Prompt do agente redator para ads criativo. Pode usar {{format}}, {{objective}} e {{archetype}}.',
    group: 'content_generation',
    scope: 'branding',
    prompt: 'Você é o Agente Redator Sênior do ecossistema Entrelaç[OS]. Gere conteúdo no formato {{format}} para o objetivo {{objective}} e o arquétipo {{archetype}}. Priorize impacto imediato, tensão narrativa curta, proposta de valor e CTA orientado à ação.',
  },
  branding_content_generation_post: {
    id: 'branding_content_generation_post',
    label: 'Geração de conteúdo: post único',
    description: 'Prompt do agente redator para post único. Pode usar {{format}}, {{objective}} e {{archetype}}.',
    group: 'content_generation',
    scope: 'branding',
    prompt: 'Você é o Agente Redator Sênior do ecossistema Entrelaç[OS]. Gere conteúdo no formato {{format}} para o objetivo {{objective}} e o arquétipo {{archetype}}. Entregue mensagem direta, clara e memorável, sem clichês e com forte aderência ao contexto.',
  },
  branding_content_generation_slide: {
    id: 'branding_content_generation_slide',
    label: 'Geração de conteúdo: slide deck',
    description: 'Prompt do agente redator para apresentação. Pode usar {{format}}, {{objective}} e {{archetype}}.',
    group: 'content_generation',
    scope: 'branding',
    prompt: 'Você é o Agente Redator Sênior do ecossistema Entrelaç[OS]. Gere conteúdo no formato {{format}} para o objetivo {{objective}} e o arquétipo {{archetype}}. Organize a narrativa com clareza executiva, progressão lógica e fechamento útil para apresentação. Cada slide deve manter uma ideia principal, texto curto o bastante para títulos grandes e corpo legível, e instruções claras para embalagem futura em HTML/CSS.',
  },
};

export const interpolatePromptTemplate = (template: string, variables: Record<string, string>) =>
  Object.entries(variables).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, value),
    template,
  );

export const resolveBrandingFormatPromptId = (format: string): AIPromptTemplateId => {
  const normalized = format.trim().toLowerCase();
  if (normalized.includes('car')) return 'branding_format_prompt_carousel';
  if (normalized.includes('ad')) return 'branding_format_prompt_ads';
  if (normalized.includes('post')) return 'branding_format_prompt_post';
  if (normalized.includes('slide')) return 'branding_format_prompt_slide';
  return 'branding_format_prompt_default';
};

export const resolveBrandingContentGenerationPromptId = (format: string): AIPromptTemplateId => {
  const normalized = format.trim().toLowerCase();
  if (normalized.includes('car')) return 'branding_content_generation_carousel';
  if (normalized.includes('ad')) return 'branding_content_generation_ads';
  if (normalized.includes('post')) return 'branding_content_generation_post';
  return 'branding_content_generation_slide';
};
