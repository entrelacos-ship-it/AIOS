import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart2, DollarSign, Film, Palette, FileText, PenTool,
  ChevronRight, ChevronDown, Copy, Check, Zap, Target,
  AlertTriangle, TrendingUp, TrendingDown, ArrowRight,
  Settings, Terminal, BookOpen, Play, Workflow, Users,
  ClipboardList, Circle, CheckCircle,
  MessageSquare, KeyRound, Eye, EyeOff, Send, Loader2, Save,
  LayoutDashboard, PauseCircle, PlayCircle, RefreshCw, ChevronUp,
  MousePointerClick, Percent, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';

// ─── DATA ────────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'traffic-analyst', name: 'Trace', title: 'Analista de Tráfego Pago', icon: '📊',
    role: 'lead', color: 'cyan',
    persona: 'Especialista em Meta Ads que transforma números em decisões claras de otimização',
    style: 'Direto, orientado a dados, usa porcentagens e comparações claras',
    whenToUse: 'Use para analisar performance de campanhas, identificar o que está funcionando e o que não está.',
    commands: [
      { name: '*analisar', description: 'Analisa campanhas ativas dos últimos 7 dias' },
      { name: '*analisar-periodo {data_inicio} {data_fim}', description: 'Analisa campanhas em período específico (YYYY-MM-DD)' },
      { name: '*top-campanhas', description: 'Lista as 5 campanhas com melhor ROAS' },
      { name: '*piores-campanhas', description: 'Lista campanhas com pior performance para pausar' },
    ],
    metrics: [
      { name: 'CTR', desc: 'Click-Through Rate', meta: '> 2%', action: '< 1%: criativo ruim' },
      { name: 'CPC', desc: 'Custo por Clique', meta: 'menor melhor', action: 'Subindo sem razão: pausar' },
      { name: 'ROAS', desc: 'Retorno sobre Investimento', meta: '> 3x', action: '< 2x: campanha no prejuízo' },
      { name: 'Frequência', desc: 'Média de vezes que viram', meta: '< 3', action: '> 3: trocar criativo' },
      { name: 'CPM', desc: 'Custo por 1000 impressões', meta: 'baixo', action: 'Alto = público saturado' },
    ],
    task: 'analyze-campaigns',
  },
  {
    id: 'budget-optimizer', name: 'Buck', title: 'Otimizador de Orçamento', icon: '💰',
    role: 'member', color: 'green',
    persona: 'Garante que cada real investido gere o máximo de retorno possível',
    style: 'Conservador com o dinheiro, decisões baseadas em dados, sempre apresenta opções com risco estimado',
    whenToUse: 'Use para otimizar distribuição de orçamento, escalar campanhas lucrativas e pausar as que perdem dinheiro.',
    commands: [
      { name: '*analisar-orcamento', description: 'Visão geral de como o orçamento está distribuído' },
      { name: '*escalar {campaign_id} {percentual}', description: 'Sugere aumento de orçamento em campanha lucrativa' },
      { name: '*pausar-perdas', description: 'Lista campanhas com ROAS negativo para pausar' },
      { name: '*redistribuir', description: 'Sugere redistribuição ideal do orçamento total' },
    ],
    rules: [
      { type: 'escalar', cond: 'ROAS ≥ 3x por 3+ dias', action: '+20% máx por vez, aguardar 48h' },
      { type: 'manter', cond: 'ROAS entre 1x–3x', action: 'Monitorar 48h antes de decidir' },
      { type: 'pausar', cond: 'ROAS < 1x por 3+ dias ou sem conversões em 7d', action: 'Pausa imediata' },
    ],
    distribution: [
      { pct: '70%', desc: 'Top 20% de campanhas (as que mais convertem)' },
      { pct: '20%', desc: 'Testes de novos criativos e públicos' },
      { pct: '10%', desc: 'Reserva estratégica' },
    ],
    task: 'optimize-budget',
  },
  {
    id: 'creative-reviewer', name: 'Cris', title: 'Revisora de Criativos', icon: '🎨',
    role: 'member', color: 'purple',
    persona: 'Combina dados de performance com sensibilidade criativa para identificar o que converte',
    style: 'Visual, usa exemplos concretos, compara criativos lado a lado',
    whenToUse: 'Use para revisar performance dos criativos (imagens, vídeos, textos) e identificar o que engaja mais.',
    commands: [
      { name: '*revisar-criativos', description: 'Analisa performance de todos os criativos ativos' },
      { name: '*melhor-criativo', description: 'Identifica o criativo com melhor CTR e engajamento' },
      { name: '*criativos-saturados', description: 'Criativos com frequência alta que precisam ser trocados' },
    ],
    signals: [
      { type: 'bom', label: 'Saudável', items: ['CTR > 2%', 'Frequência < 2', 'CPC estável ou caindo'] },
      { type: 'saturado', label: 'Saturado — trocar urgente', items: ['Frequência > 3', 'CTR caindo semana a semana', 'CPC subindo sem razão'] },
      { type: 'ruim', label: 'Ruim — pausar', items: ['CTR < 0,5%', 'Alto CPM sem conversões', 'Gasto relevante com zero conversões'] },
    ],
    task: 'review-creatives',
  },
  {
    id: 'report-writer', name: 'Rex', title: 'Gerador de Relatórios', icon: '📋',
    role: 'member', color: 'orange',
    persona: 'Transforma dados complexos em relatórios claros que qualquer pessoa entende',
    style: 'Claro, objetivo, usa tabelas e resumos executivos',
    whenToUse: 'Use para gerar relatórios diários, semanais ou mensais de performance.',
    commands: [
      { name: '*relatorio-semanal', description: 'Gera relatório dos últimos 7 dias' },
      { name: '*relatorio-mensal', description: 'Gera relatório dos últimos 30 dias' },
      { name: '*relatorio-periodo {data_inicio} {data_fim}', description: 'Relatório de período customizado' },
      { name: '*resumo-executivo', description: 'Resumo de 1 página com os KPIs principais' },
    ],
    sections: [
      'Resumo Executivo (KPIs principais)',
      'Performance por Campanha',
      'Top Criativos',
      'Análise de Orçamento e Gasto',
      'Tendências (comparação com período anterior)',
      'Recomendações de Ação',
    ],
    task: 'generate-report',
  },
  {
    id: 'ad-creator', name: 'Ada', title: 'Criadora de Anúncios', icon: '✍️',
    role: 'member', color: 'pink',
    persona: 'Cria anúncios que convertem usando dados dos que já funcionaram como referência',
    style: 'Criativo porém direto, sempre com versões alternativas (A/B), focado em conversão',
    whenToUse: 'Use para criar novos textos de anúncio, headlines, CTAs e sugestões de criativos.',
    commands: [
      { name: '*criar-anuncio {objetivo} {produto}', description: 'Cria texto completo (headline + corpo + CTA)' },
      { name: '*criar-variacoes {anuncio_id}', description: 'Cria 3 variações de um anúncio existente para teste A/B' },
      { name: '*sugestoes-criativo', description: 'Sugere ideias baseadas nos criativos que performaram melhor' },
      { name: '*revisar-copia {texto}', description: 'Revisa e melhora um texto de anúncio existente' },
    ],
    framework: [
      { step: '1. GANCHO', desc: 'Primeira linha — 3 segundos para prender', ex: '"Você ainda paga caro por [problema]?"' },
      { step: '2. PROBLEMA', desc: 'Amplifica a dor do público', ex: '"A maioria das pessoas não sabe que..."' },
      { step: '3. SOLUÇÃO', desc: 'Apresenta seu produto/serviço', ex: '"Com [produto], você consegue..."' },
      { step: '4. PROVA SOCIAL', desc: 'Adiciona credibilidade', ex: '"Mais de 500 clientes já..."' },
      { step: '5. CTA', desc: 'Chamada para ação clara', ex: '"Clique em Saiba Mais e descubra como"' },
    ],
    task: 'create-ad-copy',
  },
  {
    id: 'creative-director', name: 'Cleo', title: 'Diretora de Criativos — Vídeo', icon: '🎬',
    role: 'member', color: 'violet',
    persona: 'Transforma dados de performance em roteiros prontos para gravar',
    style: 'Direta, prática, pensa em cenas e segundos, não em parágrafos',
    whenToUse: 'Use quando precisar de um brief completo de criativo para gravar — roteiro, gancho, direção visual.',
    commands: [
      { name: '*brief {produto} {objetivo}', description: 'Cria brief completo de vídeo para gravar' },
      { name: '*gancho {produto}', description: 'Cria 5 opções de gancho para os primeiros 3 segundos' },
      { name: '*roteiro {gancho_escolhido}', description: 'Roteiro completo linha a linha para gravar' },
      { name: '*referencias', description: 'Mostra o que os criativos vencedores da conta tinham em comum' },
    ],
    videoFormula: [
      { time: '00–03s', label: 'GANCHO', desc: 'Primeira cena que para o scroll' },
      { time: '03–08s', label: 'PROBLEMA', desc: 'Amplifica a dor ou desejo' },
      { time: '08–20s', label: 'SOLUÇÃO', desc: 'Apresenta o produto/resultado' },
      { time: '20–25s', label: 'PROVA', desc: 'Depoimento, número, resultado real' },
      { time: '25–30s', label: 'CTA', desc: 'Instrução clara do que fazer' },
    ],
    cameraTips: [
      'Fundo limpo ou contexto relevante (escritório, home)',
      'Boa iluminação — janela na frente do rosto',
      'Olhar direto para a câmera na maior parte',
      'Sem música de fundo durante a fala',
      'Legenda automática ativada — 85% assiste sem som',
    ],
    task: undefined,
  },
] as const;

const TASKS = [
  {
    id: 'analyze-campaigns',
    label: 'Analisar Campanhas',
    agent: 'traffic-analyst',
    agentName: 'Trace',
    elicit: false,
    objective: 'Buscar dados de todas as campanhas ativas e gerar análise de performance com recomendações.',
    steps: [
      'Carregar MetaAdsClient de ../lib/meta-ads-client.js',
      'Chamar client.getCampaigns() para listar campanhas',
      'Chamar client.getCampaignInsights({ dateRange: últimos 7 dias })',
      'Para cada campanha, calcular: ROAS = action_values / spend; CTR = clicks / impressions × 100',
      'Classificar status: SAUDÁVEL | ATENÇÃO | PAUSAR',
      'Ordenar por ROAS decrescente',
      'Gerar tabela de resultado com recomendações de ação por campanha',
    ],
    criteria: [
      { status: 'SAUDÁVEL', color: 'green', cond: 'ROAS ≥ 3x e CTR ≥ 1%' },
      { status: 'ATENÇÃO', color: 'yellow', cond: 'ROAS entre 1x–3x ou CTR 0,5%–1%' },
      { status: 'PAUSAR', color: 'red', cond: 'ROAS < 1x ou sem conversões em 7 dias' },
    ],
    output: 'Tabela de campanhas ordenada por ROAS com status e recomendações de ação para cada uma.',
  },
  {
    id: 'optimize-budget',
    label: 'Otimizar Orçamento',
    agent: 'budget-optimizer',
    agentName: 'Buck',
    elicit: false,
    objective: 'Analisar distribuição atual do orçamento e recomendar ajustes para maximizar ROAS.',
    steps: [
      'Buscar todas campanhas com status ACTIVE',
      'Buscar insights dos últimos 7 dias por campanha',
      'Calcular ROAS e CPA por campanha',
      'Classificar campanhas: ESCALAR / MANTER / PAUSAR',
      'Calcular redistribuição ideal do orçamento total (regra 70/20/10)',
      'Apresentar plano de ação com riscos estimados',
    ],
    criteria: [
      { status: 'ESCALAR', color: 'green', cond: 'ROAS ≥ 3x por 3+ dias (max +20% por ciclo)' },
      { status: 'MANTER', color: 'yellow', cond: 'ROAS entre 1x–3x (monitorar 48h)' },
      { status: 'PAUSAR', color: 'red', cond: 'ROAS < 1x ou sem conversões em 7d' },
    ],
    output: 'Plano de otimização com ações por campanha, redistribuição sugerida e economia projetada.',
  },
  {
    id: 'review-creatives',
    label: 'Revisar Criativos',
    agent: 'creative-reviewer',
    agentName: 'Cris',
    elicit: false,
    objective: 'Analisar performance dos criativos ativos e identificar quais trocar, manter ou escalar.',
    steps: [
      'Buscar todos os ad sets ativos via getAdSets()',
      'Para cada ad set, buscar ads com getAds()',
      'Buscar insights por ad com getAdInsights()',
      'Calcular por criativo: CTR, Frequência, CPC, Taxa de conversão',
      'Classificar: BOM (CTR > 2%, freq < 2) / SATURADO (freq > 3) / RUIM (CTR < 0,5%)',
      'Gerar sugestões para novos criativos baseadas nos vencedores',
    ],
    criteria: [
      { status: 'BOM', color: 'green', cond: 'CTR > 2% e Frequência < 2' },
      { status: 'SATURADO', color: 'yellow', cond: 'Frequência > 3 — trocar esta semana' },
      { status: 'RUIM', color: 'red', cond: 'CTR < 0,5% — pausar imediatamente' },
    ],
    output: 'Lista de criativos classificados com análise + sugestões de novos baseadas nos que performaram.',
  },
  {
    id: 'create-ad-copy',
    label: 'Criar Cópia de Anúncio',
    agent: 'ad-creator',
    agentName: 'Ada',
    elicit: true,
    elicitQuestions: [
      'O que você está vendendo/promovendo?',
      'Qual o objetivo? (vendas, leads, tráfego, awareness)',
      'Quem é seu público? (idade, interesses, problema que tem)',
      'Qual o diferencial do seu produto/serviço?',
      'Tem algum anúncio anterior que funcionou bem? (opcional)',
    ],
    steps: [
      'Coletar informações via elicitação (5 perguntas)',
      'Analisar criativos que performaram bem na conta (se disponível)',
      'Identificar ângulo: DOR (problema) vs GANHO (benefício)',
      'Criar 3 versões com o framework: Gancho → Problema → Solução → Prova → CTA',
    ],
    criteria: [
      { status: 'VERSÃO A', color: 'blue', cond: 'Ângulo de Dor — amplifica o problema' },
      { status: 'VERSÃO B', color: 'purple', cond: 'Ângulo de Ganho — foca no benefício' },
      { status: 'VERSÃO C', color: 'pink', cond: 'Curiosidade/Pergunta — gancho interrogativo' },
    ],
    output: '3 versões completas do anúncio (headline + corpo + CTA) com recomendação de qual testar primeiro.',
  },
  {
    id: 'generate-report',
    label: 'Gerar Relatório',
    agent: 'report-writer',
    agentName: 'Rex',
    elicit: false,
    objective: 'Gerar relatório completo consolidando dados de campanhas, criativos e orçamento.',
    steps: [
      'Definir período (default: últimos 7 dias)',
      'Buscar total gasto via getTotalSpend()',
      'Buscar insights por campanha e por criativo',
      'Calcular ROAS geral, total de conversões, CPA médio, Top 3 criativos',
      'Comparar com período anterior (se disponível)',
      'Gerar relatório estruturado em 6 seções',
    ],
    criteria: [
      { status: 'EXECUTIVO', color: 'cyan', cond: 'KPIs principais em 1 parágrafo' },
      { status: 'DETALHADO', color: 'blue', cond: 'Tabelas por campanha e criativo' },
      { status: 'ACIONÁVEL', color: 'green', cond: '3 recomendações para a próxima semana' },
    ],
    output: 'Relatório completo em markdown com 6 seções + comparação com período anterior.',
  },
] as const;

const WORKFLOW = {
  id: 'full-audit',
  name: 'Auditoria Completa',
  description: 'Auditoria completa das campanhas Meta Ads — roda todos os agentes em sequência otimizada.',
  schedule: 'Toda segunda-feira às 9h (cron: 0 9 * * 1)',
  output: '.aios/reports/meta-ads-audit-{date}.md',
  steps: [
    {
      id: 'step-1-analise', num: 1, agent: 'traffic-analyst', agentName: 'Trace', icon: '📊',
      task: 'analyze-campaigns', label: 'Análise de Campanhas',
      desc: 'Analisar performance geral das campanhas dos últimos 7 dias',
      dependsOn: [], output: 'campaign_analysis', color: 'cyan',
    },
    {
      id: 'step-2-criativos', num: 2, agent: 'creative-reviewer', agentName: 'Cris', icon: '🎨',
      task: 'review-creatives', label: 'Revisão de Criativos',
      desc: 'Revisar criativos e identificar saturados com base na análise',
      dependsOn: ['step-1-analise'], output: 'creative_review', color: 'purple',
    },
    {
      id: 'step-3-orcamento', num: 3, agent: 'budget-optimizer', agentName: 'Buck', icon: '💰',
      task: 'optimize-budget', label: 'Otimização de Orçamento',
      desc: 'Gerar plano de otimização de orçamento com base na análise',
      dependsOn: ['step-1-analise'], output: 'budget_plan', color: 'green',
    },
    {
      id: 'step-4-relatorio', num: 4, agent: 'report-writer', agentName: 'Rex', icon: '📋',
      task: 'generate-report', label: 'Relatório Final',
      desc: 'Consolidar tudo em relatório final enviado com notificação',
      dependsOn: ['step-1-analise', 'step-2-criativos', 'step-3-orcamento'], output: 'final_report', color: 'orange',
    },
  ],
};

const CONFIG_FIELDS = [
  { key: 'META_ACCESS_TOKEN', required: true, desc: 'Token de acesso Meta Ads', howTo: 'Meta Business Suite → Configurações → Acesso à API → Gerar token com ads_read e ads_management' },
  { key: 'META_AD_ACCOUNT_ID', required: true, desc: 'ID da conta de anúncios', howTo: 'Gerenciador de Anúncios → topo da página → formato act_XXXXXXXXXX' },
  { key: 'META_PAGE_ID', required: false, desc: 'ID da página do Facebook (para criar anúncios)', howTo: 'Facebook → sua Página → Sobre → ID da Página' },
  { key: 'META_API_VERSION', required: false, desc: 'Versão da API (não altere sem necessidade)', howTo: 'Padrão: v19.0' },
];

// ─── COLORS ──────────────────────────────────────────────────────────────────

const COLOR: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  cyan:   { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/30',   badge: 'bg-cyan-500/20 text-cyan-300' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  badge: 'bg-green-500/20 text-green-300' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
  pink:   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/30',   badge: 'bg-pink-500/20 text-pink-300' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   badge: 'bg-blue-500/20 text-blue-300' },
  red:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    badge: 'bg-red-500/20 text-red-300' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300' },
};

const AGENT_COLORS: Record<string, string> = {
  'traffic-analyst': 'cyan',
  'budget-optimizer': 'green',
  'creative-reviewer': 'purple',
  'report-writer': 'orange',
  'ad-creator': 'pink',
  'creative-director': 'violet',
};

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

// ─── SECTION: SQUAD OVERVIEW ─────────────────────────────────────────────────

const SquadOverview: React.FC<{ onNav: (s: string) => void }> = ({ onNav }) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="text-4xl">📊</div>
        <div>
          <h2 className="text-xl font-bold text-white">Time de Tráfego Pago</h2>
          <p className="text-gray-400 text-sm mt-1">Meta Ads · v1.0.0 · 6 agentes especializados</p>
          <p className="text-gray-300 text-sm mt-2">Squad completo de agentes de IA para gerenciar campanhas no Meta Ads (Facebook/Instagram).</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Agentes', value: '6', icon: Users, action: () => onNav('agents') },
          { label: 'Tasks', value: '5', icon: ClipboardList, action: () => onNav('tasks') },
          { label: 'Workflows', value: '1', icon: Workflow, action: () => onNav('workflow') },
        ].map(({ label, value, icon: Icon, action }) => (
          <button key={label} onClick={action}
            className="flex flex-col items-center p-4 rounded-lg bg-[#111] border border-[#1a1a1a] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group">
            <Icon className="w-5 h-5 text-cyan-400 mb-2" />
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Time de Agentes</h3>
      <div className="grid grid-cols-2 gap-3">
        {AGENTS.map((a) => {
          const c = COLOR[AGENT_COLORS[a.id]];
          return (
            <button key={a.id} onClick={() => onNav(`agent-${a.id}`)}
              className={`flex items-center gap-3 p-3 rounded-lg border ${c.border} ${c.bg} hover:opacity-90 transition-all text-left`}>
              <span className="text-xl">{a.icon}</span>
              <div className="min-w-0">
                <div className={`font-semibold text-sm ${c.text}`}>{a.name}</div>
                <div className="text-gray-500 text-xs truncate">@{a.id}</div>
              </div>
              {a.role === 'lead' && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">LEAD</span>
              )}
            </button>
          );
        })}
      </div>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Stack Técnica</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2"><span className="text-gray-500">Plataforma:</span><span className="text-gray-300">Meta Ads (Facebook/Instagram)</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500">API:</span><span className="text-gray-300">Facebook Marketing API v19</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500">Dependências:</span><span className="text-gray-300">Node.js 18+, axios</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500">Claude Code:</span><span className="text-gray-300">Requerido para executar agentes</span></div>
      </div>
    </div>
  </div>
);

// ─── SECTION: AGENT DETAIL ───────────────────────────────────────────────────

const AgentDetail: React.FC<{ agent: typeof AGENTS[number]; onBack: () => void }> = ({ agent, onBack }) => {
  const c = COLOR[AGENT_COLORS[agent.id]];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Todos os agentes
      </button>

      <div className={`rounded-xl border ${c.border} ${c.bg} p-6`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{agent.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl font-bold ${c.text}`}>{agent.name}</h2>
              {agent.role === 'lead' && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">LEAD</span>}
            </div>
            <p className="text-gray-400 text-sm">@{agent.id}</p>
            <p className="text-gray-300 text-sm mt-1">{agent.title}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-4 leading-relaxed">{agent.persona}</p>
        <div className="mt-3 p-3 rounded-lg bg-black/30 text-xs text-gray-400 italic">
          {agent.whenToUse}
        </div>
      </div>

      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Comandos</h3>
        <div className="space-y-2">
          {agent.commands.map((cmd) => (
            <div key={cmd.name} className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border border-[#1a1a1a] group">
              <code className={`text-sm font-mono ${c.text} whitespace-nowrap`}>{cmd.name}</code>
              <CopyBtn text={`@${agent.id} ${cmd.name}`} />
              <span className="text-gray-500 text-xs leading-relaxed">{cmd.description}</span>
            </div>
          ))}
        </div>
      </div>

      {'metrics' in agent && (agent as any).metrics && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Métricas Monitoradas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-[#1a1a1a]">
                {['Métrica', 'Significado', 'Meta', 'Quando agir'].map(h => <th key={h} className="text-left p-2 text-gray-500 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>{(agent as any).metrics.map((m: any) => (
                <tr key={m.name} className="border-b border-[#111] hover:bg-white/2">
                  <td className={`p-2 font-mono font-bold ${c.text}`}>{m.name}</td>
                  <td className="p-2 text-gray-400">{m.desc}</td>
                  <td className="p-2 text-green-400">{m.meta}</td>
                  <td className="p-2 text-red-400">{m.action}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {'rules' in agent && (agent as any).rules && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Regras de Decisão</h3>
          <div className="space-y-2">
            {(agent as any).rules.map((r: any) => (
              <div key={r.type} className={`flex items-start gap-3 p-3 rounded-lg border ${
                r.type === 'escalar' ? 'bg-green-500/5 border-green-500/20' :
                r.type === 'manter' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-red-500/5 border-red-500/20'
              }`}>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  r.type === 'escalar' ? 'bg-green-500/20 text-green-300' :
                  r.type === 'manter' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>{r.type}</span>
                <div>
                  <p className="text-gray-300 text-xs">{r.cond}</p>
                  <p className="text-gray-500 text-xs mt-0.5">→ {r.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {'distribution' in agent && (agent as any).distribution && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Distribuição Ideal do Orçamento</h3>
          <div className="space-y-2">
            {(agent as any).distribution.map((d: any) => (
              <div key={d.pct} className="flex items-center gap-3 p-3 rounded-lg bg-[#111]">
                <span className="text-lg font-bold text-green-400 w-12">{d.pct}</span>
                <span className="text-gray-300 text-xs">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {'signals' in agent && (agent as any).signals && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sinais de Criativos</h3>
          <div className="space-y-3">
            {(agent as any).signals.map((s: any) => (
              <div key={s.type} className={`p-3 rounded-lg border ${
                s.type === 'bom' ? 'bg-green-500/5 border-green-500/20' :
                s.type === 'saturado' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-red-500/5 border-red-500/20'
              }`}>
                <p className={`text-xs font-bold mb-1 ${
                  s.type === 'bom' ? 'text-green-400' :
                  s.type === 'saturado' ? 'text-yellow-400' : 'text-red-400'
                }`}>{s.label}</p>
                <ul className="space-y-0.5">{s.items.map((i: string) => (
                  <li key={i} className="text-gray-400 text-xs flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />{i}
                  </li>
                ))}</ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {'framework' in agent && (agent as any).framework && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Framework de Copywriting</h3>
          <div className="space-y-2">
            {(agent as any).framework.map((f: any) => (
              <div key={f.step} className="p-3 rounded-lg bg-[#111] border border-[#1a1a1a]">
                <p className={`text-xs font-bold ${c.text}`}>{f.step}</p>
                <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                <p className="text-gray-500 text-xs mt-1 italic">{f.ex}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {'videoFormula' in agent && (agent as any).videoFormula && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Estrutura do Vídeo (25–35s)</h3>
          <div className="space-y-2">
            {(agent as any).videoFormula.map((v: any) => (
              <div key={v.time} className={`flex items-center gap-3 p-3 rounded-lg border ${c.border} ${c.bg}`}>
                <code className={`text-xs font-mono ${c.text} w-16 shrink-0`}>{v.time}</code>
                <span className={`text-xs font-bold ${c.text} w-20 shrink-0`}>{v.label}</span>
                <span className="text-gray-400 text-xs">{v.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Dicas de câmera:</p>
            <ul className="space-y-1">{(agent as any).cameraTips.map((t: string) => (
              <li key={t} className="text-gray-400 text-xs flex items-start gap-2">
                <span className={`mt-0.5 ${c.text}`}>•</span>{t}
              </li>
            ))}</ul>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SECTION: AGENTS LIST ────────────────────────────────────────────────────

const AgentsList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-white">Agentes</h2>
      <p className="text-gray-500 text-sm mt-1">6 especialistas em Meta Ads, cada um com foco específico.</p>
    </div>
    <div className="grid gap-3">
      {AGENTS.map((agent) => {
        const c = COLOR[AGENT_COLORS[agent.id]];
        return (
          <button key={agent.id} onClick={() => onSelect(agent.id)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border ${c.border} ${c.bg} hover:opacity-90 transition-all text-left group`}>
            <span className="text-3xl">{agent.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${c.text}`}>{agent.name}</span>
                <code className="text-xs text-gray-500">@{agent.id}</code>
                {agent.role === 'lead' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">LEAD</span>}
              </div>
              <p className="text-gray-300 text-sm mt-0.5">{agent.title}</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{agent.persona}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.commands.slice(0, 3).map((cmd) => (
                  <span key={cmd.name} className={`text-[10px] px-2 py-0.5 rounded font-mono ${c.badge}`}>{cmd.name.split(' ')[0]}</span>
                ))}
                {agent.commands.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-500">+{agent.commands.length - 3}</span>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-1" />
          </button>
        );
      })}
    </div>
  </div>
);

// ─── SECTION: TASK DETAIL ────────────────────────────────────────────────────

const TaskDetail: React.FC<{ task: typeof TASKS[number]; onBack: () => void }> = ({ task, onBack }) => {
  const c = COLOR[AGENT_COLORS[task.agent]];
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Todas as tasks
      </button>

      <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>{task.label}</h2>
            <p className="text-gray-400 text-sm mt-0.5">Agente: <span className={c.text}>{task.agentName}</span> (@{task.agent})</p>
            {task.elicit && <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">REQUER ELICITAÇÃO</span>}
          </div>
        </div>
        {'objective' in task && <p className="text-gray-300 text-sm mt-3 leading-relaxed">{(task as any).objective}</p>}
      </div>

      {'elicitQuestions' in task && (task as any).elicitQuestions && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Perguntas de Elicitação</h3>
          <ol className="space-y-2">{(task as any).elicitQuestions.map((q: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{q}
            </li>
          ))}</ol>
        </div>
      )}

      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Passos de Execução</h3>
        <ol className="space-y-2">{task.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`w-5 h-5 rounded-full ${c.bg} ${c.text} text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>{i + 1}</span>
            <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
          </li>
        ))}</ol>
      </div>

      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Critérios de Status</h3>
        <div className="space-y-2">{task.criteria.map((cr) => {
          const cc = COLOR[cr.color as string] || COLOR.cyan;
          return (
            <div key={cr.status} className={`flex items-center gap-3 p-3 rounded-lg border ${cc.border} ${cc.bg}`}>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${cc.badge}`}>{cr.status}</span>
              <span className="text-gray-300 text-xs">{cr.cond}</span>
            </div>
          );
        })}</div>
      </div>

      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Output Esperado</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{task.output}</p>
      </div>
    </div>
  );
};

// ─── SECTION: TASKS LIST ─────────────────────────────────────────────────────

const TasksList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-white">Tasks</h2>
      <p className="text-gray-500 text-sm mt-1">5 tarefas executadas pelos agentes do time.</p>
    </div>
    <div className="grid gap-3">
      {TASKS.map((task) => {
        const c = COLOR[AGENT_COLORS[task.agent]];
        return (
          <button key={task.id} onClick={() => onSelect(task.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a] transition-all text-left group">
            <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
              <ClipboardList className={`w-4 h-4 ${c.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{task.label}</span>
                {task.elicit && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">ELICIT</span>}
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Agente: <span className={c.text}>{task.agentName}</span> · {task.steps.length} passos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
          </button>
        );
      })}
    </div>
  </div>
);

// ─── SECTION: WORKFLOW ───────────────────────────────────────────────────────

const WorkflowView: React.FC = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-white">{WORKFLOW.name}</h2>
      <p className="text-gray-500 text-sm mt-1">{WORKFLOW.description}</p>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span className="text-gray-400">Manual + Automático</span></div>
        <div className="text-gray-600">·</div>
        <div className="flex items-center gap-2"><Play className="w-4 h-4 text-green-400" /><span className="text-gray-400 text-xs">{WORKFLOW.schedule}</span></div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <FileText className="w-3 h-3" />
        <code>{WORKFLOW.output}</code>
      </div>
    </div>

    {/* DAG Visualization */}
    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Sequência de Execução</h3>

      {/* Step 1 - Full width */}
      <div className="flex flex-col items-center gap-0">
        {(() => {
          const s = WORKFLOW.steps[0];
          const c = COLOR[s.color];
          return (
            <div className={`w-full max-w-sm p-4 rounded-xl border ${c.border} ${c.bg}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${c.text}`}>PASSO {s.num}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">INÍCIO</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{s.label}</p>
                  <p className="text-gray-500 text-xs">@{s.agent} · {s.agentName}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">{s.desc}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-gray-600 text-xs">Output:</span>
                <code className={`text-xs ${c.text}`}>{s.output}</code>
              </div>
            </div>
          );
        })()}

        {/* Arrow splitting to 2 */}
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-gray-700" />
          <div className="text-gray-600 text-xs mb-1">em paralelo</div>
          <div className="flex items-start gap-8">
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-700" />
              <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-gray-700" />
              <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
            </div>
          </div>
        </div>

        {/* Steps 2 and 3 side by side */}
        <div className="flex gap-4 w-full">
          {WORKFLOW.steps.slice(1, 3).map((s) => {
            const c = COLOR[s.color];
            return (
              <div key={s.id} className={`flex-1 p-4 rounded-xl border ${c.border} ${c.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className={`text-xs font-bold ${c.text}`}>PASSO {s.num}</span>
                </div>
                <p className="text-white text-sm font-semibold">{s.label}</p>
                <p className="text-gray-500 text-xs">@{s.agent} · {s.agentName}</p>
                <p className="text-gray-400 text-xs mt-2">{s.desc}</p>
                <code className={`text-xs ${c.text} mt-1 block`}>{s.output}</code>
              </div>
            );
          })}
        </div>

        {/* Arrows merging */}
        <div className="flex items-start gap-8 mt-0">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-700" />
            <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-700" />
            <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
          </div>
        </div>
        <div className="text-gray-600 text-xs mb-1">aguarda todos</div>
        <div className="flex flex-col items-center">
          <ArrowRight className="w-4 h-4 text-gray-600 rotate-90" />
        </div>

        {/* Step 4 */}
        {(() => {
          const s = WORKFLOW.steps[3];
          const c = COLOR[s.color];
          return (
            <div className={`w-full max-w-sm p-4 rounded-xl border ${c.border} ${c.bg}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${c.text}`}>PASSO {s.num}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">OUTPUT FINAL</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{s.label}</p>
                  <p className="text-gray-500 text-xs">@{s.agent} · {s.agentName}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">{s.desc}</p>
              <code className={`text-xs ${c.text} mt-1 block`}>{WORKFLOW.output}</code>
            </div>
          );
        })()}
      </div>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dependências</h3>
      <div className="space-y-2 text-xs">
        {WORKFLOW.steps.filter(s => s.dependsOn.length > 0).map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-gray-300 font-mono">{s.id}</span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-500">depende de</span>
            <span className="text-cyan-400 font-mono">{s.dependsOn.join(' + ')}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── SECTION: CONFIG ─────────────────────────────────────────────────────────

const ConfigView: React.FC = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-white">Configuração</h2>
      <p className="text-gray-500 text-sm mt-1">Configure suas credenciais Meta para usar o time.</p>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Instalação Rápida</h3>
      <ol className="space-y-3">
        {[
          { step: '1. Baixe e descompacte', desc: 'Coloque a pasta time-de-trafego-pago em qualquer lugar' },
          { step: '2. Abra no terminal', desc: 'Windows: botão direito dentro da pasta → "Abrir no Terminal"' },
          { step: '3. Rode o instalador', cmd: 'node instalar.js' },
          { step: '4. Abra o Claude Code', cmd: 'claude' },
        ].map(({ step, desc, cmd }, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <div>
              <p className="text-white text-sm font-medium">{step}</p>
              {desc && <p className="text-gray-500 text-xs mt-0.5">{desc}</p>}
              {cmd && (
                <div className="flex items-center gap-1 mt-1">
                  <code className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">{cmd}</code>
                  <CopyBtn text={cmd} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>

    <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Variáveis de Ambiente</h3>
      <div className="space-y-4">
        {CONFIG_FIELDS.map((f) => (
          <div key={f.key} className={`p-4 rounded-lg border ${f.required ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-[#1a1a1a] bg-[#111]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <code className="text-sm font-mono text-cyan-400">{f.key}</code>
              {f.required
                ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">OBRIGATÓRIO</span>
                : <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 font-bold">OPCIONAL</span>
              }
            </div>
            <p className="text-gray-300 text-xs">{f.desc}</p>
            <p className="text-gray-500 text-xs mt-1">→ {f.howTo}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-400 text-sm font-semibold">Segurança</p>
          <p className="text-gray-400 text-xs mt-1">O arquivo .env <strong>nunca</strong> deve ser compartilhado. Não suba para GitHub. Se seu token vazar, revogue-o imediatamente no Meta Business Suite.</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── SECTION: HOW TO USE ─────────────────────────────────────────────────────

const HowToUse: React.FC = () => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-white">Como Usar</h2>
      <p className="text-gray-500 text-sm mt-1">Referência rápida de todos os comandos do time.</p>
    </div>
    {AGENTS.map((agent) => {
      const c = COLOR[AGENT_COLORS[agent.id]];
      return (
        <div key={agent.id} className={`rounded-xl border ${c.border} bg-[#0d0d0d] p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{agent.icon}</span>
            <span className={`font-bold text-sm ${c.text}`}>{agent.name}</span>
            <code className="text-xs text-gray-500">@{agent.id}</code>
          </div>
          <div className="space-y-1">
            {agent.commands.map((cmd) => (
              <div key={cmd.name} className="flex items-start gap-2 group">
                <div className="flex items-center gap-1 min-w-0">
                  <code className={`text-xs font-mono ${c.text} whitespace-nowrap`}>@{agent.id} {cmd.name}</code>
                  <CopyBtn text={`@${agent.id} ${cmd.name}`} />
                </div>
                <span className="text-gray-600 text-xs leading-relaxed hidden group-hover:block">— {cmd.description}</span>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

// ─── SSE PARSER ──────────────────────────────────────────────────────────────

function parseSse(raw: string): Array<{ event: string; data: unknown }> {
  const out: Array<{ event: string; data: unknown }> = [];
  for (const block of raw.split('\n\n')) {
    if (!block.trim()) continue;
    let event = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
    }
    if (dataStr) {
      try { out.push({ event, data: JSON.parse(dataStr) }); } catch { /* skip */ }
    }
  }
  return out;
}

function buildSystemPrompt(agent: typeof AGENTS[number]): string {
  const lines: string[] = [
    `Você é ${agent.name}, ${agent.title}.`,
    '',
    `Função: ${agent.persona}`,
    `Estilo de comunicação: ${agent.style}`,
    '',
    `Quando usar: ${agent.whenToUse}`,
    '',
    'Comandos disponíveis:',
    ...agent.commands.map(c => `- ${c.name}: ${c.description}`),
  ];
  if ('metrics' in agent && (agent as any).metrics) {
    lines.push('', 'Métricas que você monitora:');
    for (const m of (agent as any).metrics) lines.push(`- ${m.name} (${m.desc}): meta ${m.meta}, agir quando ${m.action}`);
  }
  if ('rules' in agent && (agent as any).rules) {
    lines.push('', 'Regras de decisão:');
    for (const r of (agent as any).rules) lines.push(`- ${r.type.toUpperCase()}: ${r.cond} → ${r.action}`);
  }
  if ('framework' in agent && (agent as any).framework) {
    lines.push('', 'Framework de copywriting que você usa:');
    for (const f of (agent as any).framework) lines.push(`- ${f.step}: ${f.desc}`);
  }
  if ('videoFormula' in agent && (agent as any).videoFormula) {
    lines.push('', 'Estrutura de vídeo que você utiliza:');
    for (const v of (agent as any).videoFormula) lines.push(`- ${v.time} ${v.label}: ${v.desc}`);
  }
  lines.push('', 'Responda sempre em português do Brasil. Seja direto, orientado a dados e use exemplos concretos.');
  return lines.join('\n');
}

// ─── SECTION: CHAT ────────────────────────────────────────────────────────────

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

const ChatView: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const agent = AGENTS.find(a => a.id === selectedAgent)!;
  const c = COLOR[AGENT_COLORS[selectedAgent]];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/traffic-team/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(agent),
          message: text,
          history: messages.slice(-20),
        }),
        signal: controller.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (const { event, data } of parseSse(buffer)) {
          buffer = '';
          const d = data as Record<string, unknown>;
          if (event === 'token') {
            full += d.text as string;
            setStreamingText(full);
          } else if (event === 'done') {
            setMessages(prev => [...prev, { role: 'assistant', content: full }]);
            setStreamingText('');
          } else if (event === 'error') {
            setError(String(d.message));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setStreaming(false);
      setStreamingText('');
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Agent selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400 shrink-0">Agente:</label>
        <select
          value={selectedAgent}
          onChange={e => { setSelectedAgent(e.target.value); setMessages([]); setError(null); }}
          className={`flex-1 bg-[#111] border ${c.border} rounded-lg px-3 py-2 text-sm ${c.text} focus:outline-none`}
        >
          {AGENTS.map(a => (
            <option key={a.id} value={a.id}>{a.icon} {a.name} — {a.title}</option>
          ))}
        </select>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg bg-[#111] border border-[#1a1a1a] shrink-0">
            Limpar
          </button>
        )}
      </div>

      {/* Agent persona hint */}
      <div className={`px-4 py-2.5 rounded-lg border ${c.border} ${c.bg} text-xs text-gray-400`}>
        <span className="text-xl mr-2">{agent.icon}</span>
        <span className={`font-semibold ${c.text}`}>{agent.name}</span>
        {' — '}{agent.persona}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <span className="text-4xl">{agent.icon}</span>
            <p className="text-gray-500 text-sm">Inicie uma conversa com {agent.name}</p>
            <div className="flex flex-wrap gap-1 justify-center max-w-sm">
              {agent.commands.slice(0, 3).map(cmd => (
                <button key={cmd.name} onClick={() => setInput(cmd.name)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border ${c.border} ${c.text} hover:${c.bg} transition-colors`}>
                  {cmd.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-500/15 text-cyan-100 border border-cyan-500/20'
                : 'bg-[#111] text-gray-200 border border-[#1a1a1a]'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{agent.icon}</span>
                  <span className={`text-xs font-semibold ${c.text}`}>{agent.name}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed bg-[#111] text-gray-200 border border-[#1a1a1a]">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{agent.icon}</span>
                <span className={`text-xs font-semibold ${c.text}`}>{agent.name}</span>
                <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
              </div>
              <p className="whitespace-pre-wrap">{streamingText}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Fale com ${agent.name}...`}
          disabled={streaming}
          className="flex-1 bg-[#111] border border-[#1a1a1a] focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={streaming ? () => abortRef.current?.abort() : send}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            streaming
              ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
              : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25'
          }`}
        >
          {streaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Parar</> : <><Send className="w-4 h-4" /> Enviar</>}
        </button>
      </div>
    </div>
  );
};

// ─── SECTION: VARS ────────────────────────────────────────────────────────────

const VARS_FIELDS = [
  { key: 'META_ACCESS_TOKEN',  label: 'Access Token',   type: 'password', required: true,  howTo: 'Meta Business Suite → Configurações → Acesso à API → token com ads_read + ads_management' },
  { key: 'META_AD_ACCOUNT_ID', label: 'Ad Account ID',  type: 'text',     required: true,  howTo: 'Gerenciador de Anúncios → topo da página → formato act_XXXXXXXXXX' },
  { key: 'META_PAGE_ID',       label: 'Page ID',        type: 'text',     required: false, howTo: 'Facebook → sua Página → Sobre → ID da Página' },
  { key: 'META_API_VERSION',   label: 'API Version',    type: 'text',     required: false, howTo: 'Padrão: v19.0 — não altere sem necessidade' },
] as const;

const VarsView: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({
    META_ACCESS_TOKEN: '', META_AD_ACCOUNT_ID: '', META_PAGE_ID: '', META_API_VERSION: 'v19.0',
  });
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/traffic-team/config')
      .then(r => r.json())
      .then(d => setValues(d))
      .catch(() => setLoadError('Erro ao carregar variáveis'));
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false); setSaveError(null);
    try {
      const r = await fetch('/api/traffic-team/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!r.ok) throw new Error('Falha ao salvar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Variáveis de Ambiente</h2>
        <p className="text-gray-500 text-sm mt-1">Credenciais Meta Ads — salvas no .env do servidor.</p>
      </div>

      {loadError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{loadError}</div>
      )}

      <div className="space-y-4">
        {VARS_FIELDS.map(field => (
          <div key={field.key} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-sm font-mono font-semibold text-cyan-400">{field.key}</label>
              {field.required
                ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">OBRIGATÓRIO</span>
                : <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 font-bold">OPCIONAL</span>
              }
            </div>
            <p className="text-gray-500 text-xs mb-3">{field.howTo}</p>
            <div className="relative">
              <input
                type={field.type === 'password' && !show[field.key] ? 'password' : 'text'}
                value={values[field.key] || ''}
                onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.key === 'META_API_VERSION' ? 'v19.0' : field.key === 'META_AD_ACCOUNT_ID' ? 'act_XXXXXXXXXX' : ''}
                className="w-full bg-[#111] border border-[#1a1a1a] focus:border-cyan-500/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none font-mono pr-10"
              />
              {field.type === 'password' && (
                <button
                  onClick={() => setShow(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/25 transition-colors text-sm font-medium disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <Check className="w-4 h-4" /> Salvo com sucesso
          </div>
        )}
        {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
      </div>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-gray-400 text-xs">Credenciais salvas no arquivo <code className="text-yellow-400">.env</code> do servidor. Nunca compartilhe ou suba para repositórios públicos.</p>
        </div>
      </div>
    </div>
  );
};

// ─── SECTION: CAMPANHAS ──────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; status: string;
  daily_budget: number; spend: number; impressions: number;
  clicks: number; ctr: number; cpm: number; frequency: number;
  conversions: number; revenue: number; roas: number; cpa: number;
  trend: Array<{ day: string; spend: number; roas: number }>;
}

const campStatus = (c: Campaign): { label: string; color: string } => {
  if (c.roas >= 3 && c.ctr >= 1) return { label: 'SAUDÁVEL', color: 'green' };
  if (c.roas === 0 && c.spend > 0) return { label: 'PAUSAR', color: 'red' };
  if (c.roas < 1 && c.spend > 0) return { label: 'PAUSAR', color: 'red' };
  if (c.frequency > 3) return { label: 'SATURADO', color: 'yellow' };
  if (c.roas >= 1) return { label: 'ATENÇÃO', color: 'yellow' };
  return { label: 'INATIVO', color: 'gray' };
};

const fmt = {
  brl: (v: number) => `R$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  pct: (v: number) => `${v.toFixed(2)}%`,
  x: (v: number) => `${v.toFixed(2)}x`,
  n: (v: number) => v.toLocaleString('pt-BR'),
};

const CampanhasView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/traffic-team/campaigns');
      const d = await r.json();
      setCampaigns(d.campaigns || []);
      setMock(d.mock || false);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const doAction = async (campaignId: string, action: string, payload?: object) => {
    setActionLoading(campaignId + action);
    setActionMsg(null);
    try {
      const endpoint = action === 'budget'
        ? `/api/traffic-team/campaigns/${campaignId}/budget`
        : `/api/traffic-team/campaigns/${campaignId}/status`;
      const r = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Erro'); }
      setActionMsg('✓ Feito');
      await load();
    } catch (e) {
      setActionMsg((e as Error).message);
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  // Aggregate totals
  const totals = campaigns.reduce((acc, c) => ({
    spend: acc.spend + c.spend,
    revenue: acc.revenue + c.revenue,
    conversions: acc.conversions + c.conversions,
    clicks: acc.clicks + c.clicks,
    impressions: acc.impressions + c.impressions,
  }), { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 });
  const totalRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  // Aggregate trend (sum daily spend across all active campaigns)
  const trendDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const trendData = trendDays.map((day, i) => ({
    day,
    spend: campaigns.reduce((s, c) => s + (c.trend[i]?.spend || 0), 0),
    roas: (() => {
      const active = campaigns.filter(c => c.trend[i]?.roas > 0);
      return active.length ? active.reduce((s, c) => s + (c.trend[i]?.roas || 0), 0) / active.length : 0;
    })(),
  }));

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Mock banner */}
      {mock && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Dados simulados — configure as variáveis Meta Ads na aba <strong>Variáveis</strong> para ver dados reais.</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Gasto (7d)', value: fmt.brl(totals.spend), icon: DollarSign, color: 'orange' },
          { label: 'ROAS Geral', value: fmt.x(totalRoas), icon: TrendingUp, color: totalRoas >= 3 ? 'green' : totalRoas >= 1 ? 'yellow' : 'red' },
          { label: 'Conversões', value: fmt.n(totals.conversions), icon: Target, color: 'cyan' },
          { label: 'CTR Médio', value: fmt.pct(totalCtr), icon: MousePointerClick, color: totalCtr >= 2 ? 'green' : totalCtr >= 1 ? 'yellow' : 'red' },
        ].map(({ label, value, icon: Icon, color }) => {
          const c = COLOR[color] || COLOR.cyan;
          return (
            <div key={label} className={`p-4 rounded-xl border ${c.border} ${c.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${c.text}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className={`text-xl font-bold ${c.text}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evolução 7 dias</h3>
          <button onClick={() => void load()} className="text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRoas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#22d3ee', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#f97316" strokeWidth={2} fill="url(#gradSpend)" name="Gasto (R$)" />
              <Area yAxisId="right" type="monotone" dataKey="roas" stroke="#22d3ee" strokeWidth={2} fill="url(#gradRoas)" name="ROAS" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`px-4 py-2 rounded-lg text-sm text-center ${actionMsg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {actionMsg}
        </div>
      )}

      {/* Campaign list */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Campanhas ({campaigns.length})</h3>
        </div>
        <div className="divide-y divide-[#111]">
          {campaigns.map((camp) => {
            const st = campStatus(camp);
            const sc = COLOR[st.color] || COLOR.cyan;
            const isSelected = selected?.id === camp.id;
            return (
              <div key={camp.id}>
                {/* Campaign row */}
                <button
                  onClick={() => setSelected(isSelected ? null : camp)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors text-left group"
                >
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold shrink-0 ${sc.badge}`}>{st.label}</span>
                  <span className="flex-1 text-sm text-white truncate">{camp.name}</span>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span><span className="text-orange-400 font-mono">{fmt.brl(camp.spend)}</span></span>
                    <span>ROAS <span className={camp.roas >= 3 ? 'text-green-400' : camp.roas >= 1 ? 'text-yellow-400' : 'text-red-400'} >{fmt.x(camp.roas)}</span></span>
                    <span>CTR <span className="text-gray-300">{fmt.pct(camp.ctr)}</span></span>
                    <span>Freq <span className={camp.frequency > 3 ? 'text-red-400' : 'text-gray-300'}>{camp.frequency.toFixed(1)}</span></span>
                  </div>
                  {isSelected ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 opacity-0 group-hover:opacity-100" />}
                </button>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="px-5 pb-5 bg-[#080808] border-t border-[#1a1a1a] space-y-4">
                    {/* Metrics grid */}
                    <div className="grid grid-cols-4 gap-3 pt-4">
                      {[
                        { label: 'Gasto', value: fmt.brl(camp.spend) },
                        { label: 'Receita', value: fmt.brl(camp.revenue) },
                        { label: 'ROAS', value: fmt.x(camp.roas) },
                        { label: 'CPA', value: camp.cpa > 0 ? fmt.brl(camp.cpa) : '—' },
                        { label: 'Impressões', value: fmt.n(camp.impressions) },
                        { label: 'Cliques', value: fmt.n(camp.clicks) },
                        { label: 'CTR', value: fmt.pct(camp.ctr) },
                        { label: 'Frequência', value: camp.frequency.toFixed(1) },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg bg-[#111] border border-[#1a1a1a] p-3">
                          <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Trend mini chart */}
                    {camp.trend.length > 0 && (
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={camp.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                            <XAxis dataKey="day" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, fontSize: 11 }} />
                            <Line type="monotone" dataKey="roas" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="ROAS" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {camp.status === 'ACTIVE' ? (
                        <button
                          onClick={() => doAction(camp.id, 'pause', { status: 'PAUSED' })}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === camp.id + 'pause' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseCircle className="w-3 h-3" />}
                          Pausar campanha
                        </button>
                      ) : (
                        <button
                          onClick={() => doAction(camp.id, 'enable', { status: 'ACTIVE' })}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === camp.id + 'enable' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                          Ativar campanha
                        </button>
                      )}
                      {camp.roas >= 3 && camp.status === 'ACTIVE' && (
                        <button
                          onClick={() => doAction(camp.id, 'budget', { daily_budget: camp.daily_budget * 1.2 })}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Escalar +20% ({fmt.brl(camp.daily_budget * 1.2)}/dia)
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(null)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#111] text-gray-400 border border-[#1a1a1a] hover:text-gray-200 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>

                    {/* Agent suggestion */}
                    {st.label === 'PAUSAR' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs">
                          <strong>Buck recomenda:</strong> ROAS abaixo de 1x por 3+ dias. Pausar imediatamente para parar o sangramento de orçamento.
                        </p>
                      </div>
                    )}
                    {st.label === 'SATURADO' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-yellow-300 text-xs">
                          <strong>Cris recomenda:</strong> Frequência {camp.frequency.toFixed(1)} — público saturado. Trocar criativo esta semana.
                        </p>
                      </div>
                    )}
                    {st.label === 'SAUDÁVEL' && camp.roas >= 3 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <TrendingUp className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-green-300 text-xs">
                          <strong>Buck recomenda:</strong> ROAS {fmt.x(camp.roas)} por 7 dias. Campanha elegível para escalonamento de +20%.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── NAV ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'squad',      label: 'Squad',        icon: Users },
  { id: 'campanhas',  label: 'Campanhas',    icon: LayoutDashboard },
  { id: 'chat',       label: 'Chat',         icon: MessageSquare },
  { id: 'agents',     label: 'Agentes',      icon: BarChart2 },
  { id: 'tasks',      label: 'Tasks',        icon: ClipboardList },
  { id: 'workflow',   label: 'Workflow',     icon: Workflow },
  { id: 'vars',       label: 'Variáveis',    icon: KeyRound },
  { id: 'config',     label: 'Instalação',   icon: Settings },
  { id: 'howto',      label: 'Como Usar',    icon: Terminal },
];

export const TrafficTeam: React.FC = () => {
  const [section, setSection] = useState<string>('squad');

  const isAgentDetail = section.startsWith('agent-');
  const isTaskDetail = section.startsWith('task-');
  const activeAgent = isAgentDetail ? AGENTS.find(a => a.id === section.replace('agent-', '')) : null;
  const activeTask = isTaskDetail ? TASKS.find(t => t.id === section.replace('task-', '')) : null;

  const activeSection = isAgentDetail ? 'agents' : isTaskDetail ? 'tasks' : section;

  const isChatSection = section === 'chat';

  const renderContent = () => {
    if (activeAgent) return <AgentDetail agent={activeAgent} onBack={() => setSection('agents')} />;
    if (activeTask) return <TaskDetail task={activeTask} onBack={() => setSection('tasks')} />;
    switch (section) {
      case 'squad':      return <SquadOverview onNav={setSection} />;
      case 'campanhas':  return <CampanhasView />;
      case 'chat':       return <ChatView />;
      case 'agents':   return <AgentsList onSelect={(id) => setSection(`agent-${id}`)} />;
      case 'tasks':    return <TasksList onSelect={(id) => setSection(`task-${id}`)} />;
      case 'workflow': return <WorkflowView />;
      case 'vars':     return <VarsView />;
      case 'config':   return <ConfigView />;
      case 'howto':    return <HowToUse />;
      default:         return <SquadOverview onNav={setSection} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-128px)] -m-8 mt-0">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-xs font-bold text-white">Time de Tráfego</h2>
              <p className="text-[10px] text-gray-500">Meta Ads · v1.0.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors border-l-2 ${
                activeSection === id
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/3 border-transparent'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {id === 'agents' && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-600">6</span>}
              {id === 'tasks' && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-600">5</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-gray-700 text-center">AIOS · Time de Tráfego Pago</p>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 p-6 min-h-0 ${isChatSection ? 'flex flex-col' : 'overflow-y-auto'}`}>
        {renderContent()}
      </div>
    </div>
  );
};
