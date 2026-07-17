import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

// ─── Entrelaços Psicologia — design tokens ────────────────────────────────
export const design: DesignSystem = {
  palette: { bg: '#0A0612', text: '#F0EAF8', accent: '#FF8A1F' },
  fonts: {
    display: '"Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter Tight", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  typeScale: { hero: 140, body: 28 },
  radius: 16,
};

const t = {
  bg: '#0A0612',
  bgElev: '#14092B',
  text: '#F0EAF8',
  textMuted: 'rgba(240,234,248,0.68)',
  textFaint: 'rgba(240,234,248,0.42)',
  purple: '#7427D4',
  purple600: '#5C18B8',
  orange: '#FF8A1F',
  orangeSoft: 'rgba(255,138,31,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',
  green: '#10B981',
  border: 'rgba(180,140,255,0.10)',
  borderStrong: 'rgba(180,140,255,0.20)',
};

const mono = '"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace';
const serif = '"Instrument Serif", "Times New Roman", serif';

const PAD = 100;
const fill = { width: '100%', height: '100%', position: 'relative' as const, background: 'var(--osd-bg)', color: 'var(--osd-text)' };
const page = { ...fill, display: 'flex', flexDirection: 'column' as const, padding: PAD };

// ─── Shared chrome ─────────────────────────────────────────────────────────

const Footer = ({ page: p }: { page: string }) => (
  <div
    style={{
      position: 'absolute',
      left: PAD,
      right: PAD,
      bottom: 40,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 15,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      fontFamily: mono,
      color: t.textFaint,
    }}
  >
    <span>ENTRELAÇOS · IMERSÃO NR-1 NA PRÁTICA</span>
    <span>{p}</span>
  </div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 14px',
      borderRadius: 9999,
      border: `1px solid ${t.border}`,
      background: 'rgba(180,140,255,0.04)',
      fontFamily: mono,
      fontSize: 15,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: t.textFaint,
      width: 'fit-content',
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.purple, boxShadow: `0 0 10px ${t.purple}` }} />
    {children}
  </div>
);

const H2 = ({ children, size = 56 }: { children: React.ReactNode; size?: number }) => (
  <h2
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
      margin: '18px 0 0',
      color: t.text,
      maxWidth: 1500,
    }}
  >
    {children}
  </h2>
);

const Card = ({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'red' | 'orange' }) => (
  <div
    style={{
      background: tone === 'red' ? t.redSoft : tone === 'orange' ? t.orangeSoft : t.bgElev,
      border: `1px solid ${tone === 'red' ? 'rgba(239,68,68,0.35)' : tone === 'orange' ? 'rgba(255,138,31,0.35)' : t.border}`,
      borderRadius: 16,
      padding: '24px 28px',
    }}
  >
    {children}
  </div>
);

const CheckLine = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', fontSize: 24, color: t.text, lineHeight: 1.4 }}>
    <span style={{ color: t.orange, fontFamily: mono, flexShrink: 0 }}>✓</span>
    <span>{children}</span>
  </div>
);

const CalloutBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      borderLeft: `3px solid ${t.orange}`,
      paddingLeft: 24,
      fontFamily: serif,
      fontStyle: 'italic',
      fontSize: 30,
      color: t.text,
      lineHeight: 1.4,
      maxWidth: 1500,
    }}
  >
    {children}
  </div>
);

// ─── Slide 1: Cover ─────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div style={{ ...page, justifyContent: 'center', background: `radial-gradient(ellipse at 20% 0%, rgba(116,39,212,0.28) 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(255,138,31,0.12) 0%, transparent 50%), ${t.bg}` }}>
    <Eyebrow>IMERSÃO NR-1 NA PRÁTICA</Eyebrow>
    <div style={{ marginTop: 32 }}>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 500,
          fontSize: 44,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: t.orange,
          margin: 0,
        }}
      >
        Bloco 1
      </h1>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 500,
          fontSize: 120,
          lineHeight: 0.98,
          letterSpacing: '-0.045em',
          color: t.text,
          margin: '12px 0 0',
          maxWidth: 1600,
        }}
      >
        Fundamentos da NR-1 e{' '}
        <span style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400 }}>Riscos Psicossociais</span>
      </h1>
    </div>
    <p style={{ fontSize: 32, color: t.textMuted, maxWidth: 1200, marginTop: 40 }}>
      O alicerce jurídico, técnico e ético da sua consultoria de elite.
    </p>
    <Footer page="01 / 20" />
  </div>
);

// ─── Slide 2: O que você vai aprender ───────────────────────────────────────
const Learn: Page = () => (
  <div style={page}>
    <Eyebrow>OBJETIVOS</Eyebrow>
    <H2>Neste bloco, você vai dominar:</H2>
    <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 48px' }}>
      <CheckLine>A história e evolução legal da NR-1 (por que mudou em 2020/2021)</CheckLine>
      <CheckLine>Os riscos psicossociais: definição técnica e impacto financeiro real</CheckLine>
      <CheckLine>Seu papel como psicóloga consultora — competências e limites éticos</CheckLine>
      <CheckLine>Os 3 Pilares da Consultoria Entrelaços: Diagnóstico → Ação → Avaliação</CheckLine>
      <CheckLine>Como falar a língua do C-Level: ROI, segurança jurídica, indicadores</CheckLine>
      <CheckLine>Exercício prático: análise de caso real</CheckLine>
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>
        Ao final deste bloco, você terá a segurança técnica e comercial para abrir portas em qualquer empresa.
      </CalloutBox>
    </div>
    <Footer page="02 / 20" />
  </div>
);

// ─── Slide 3: Linha do tempo ─────────────────────────────────────────────────
const TimelineStop = ({ year, title, items }: { year: string; title: string; items: string[] }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontFamily: mono, fontSize: 20, color: t.orange, fontWeight: 500 }}>{year}</div>
    <div style={{ height: 3, background: t.purple, borderRadius: 2 }} />
    <div style={{ fontSize: 22, fontWeight: 600, color: t.text, marginTop: 4 }}>{title}</div>
    {items.map((it) => (
      <div key={it} style={{ fontSize: 17, color: t.textMuted, lineHeight: 1.4 }}>{it}</div>
    ))}
  </div>
);

const Timeline: Page = () => (
  <div style={page}>
    <Eyebrow>CONTEXTO LEGAL</Eyebrow>
    <H2 size={52}>Como a NR-1 se tornou obrigatória para saúde mental</H2>
    <div style={{ marginTop: 56, display: 'flex', gap: 40 }}>
      <TimelineStop year="1978" title="Primeiras NRs" items={['NR-1 era apenas administrativa', '(termos e definições)']} />
      <TimelineStop year="2020/2021" title="Grande virada" items={['Reescrita da NR-1', 'Introdução do GRO e PGR', 'Substituição do PPRA']} />
      <TimelineStop year="2024/2025" title="Consolidação da saúde mental" items={['Portaria MTE nº 1.419/2024', 'Riscos psicossociais explícitos']} />
      <TimelineStop year="2026" title="Fiscalização rigorosa" items={['eSocial integrado', 'Multas automáticas por ausência', 'de inventário de riscos']} />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>A saúde mental deixou de ser "opcional" e virou obrigação legal estratégica.</CalloutBox>
    </div>
    <Footer page="03 / 20" />
  </div>
);

// ─── Slide 4: O que é a NR-1 ──────────────────────────────────────────────────
const WhatIsNR1: Page = () => (
  <div style={page}>
    <Eyebrow>DEFINIÇÃO TÉCNICA</Eyebrow>
    <H2>NR-1: a "norma mãe" de toda segurança do trabalho</H2>
    <p style={{ fontSize: 26, color: t.textMuted, lineHeight: 1.5, maxWidth: 1400, marginTop: 24 }}>
      As Normas Regulamentadoras são disposições complementares ao Capítulo V da CLT sobre Segurança e Medicina do
      Trabalho — possuem <span style={{ color: t.text, fontWeight: 600 }}>força de lei</span>, obrigatórias para
      toda empresa com empregados regidos pela CLT.
    </p>
    <div style={{ marginTop: 32 }}>
      <Card>
        <div style={{ fontSize: 18, fontFamily: mono, color: t.orange, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          A NR-1 estabelece
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px' }}>
          <CheckLine>Campo de aplicação das normas</CheckLine>
          <CheckLine>Requisitos para prevenção em SST</CheckLine>
          <CheckLine>Diretrizes de Gerenciamento de Riscos</CheckLine>
          <CheckLine>O sistema que sustenta todas as outras NRs</CheckLine>
        </div>
      </Card>
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>Sem a NR-1, as outras normas não têm estrutura.</CalloutBox>
    </div>
    <Footer page="04 / 20" />
  </div>
);

// ─── Slide 5: Obrigatoriedade legal ──────────────────────────────────────────
const NumberedStep = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <span
      style={{
        fontFamily: mono, fontSize: 20, fontWeight: 600, color: t.orange, background: t.orangeSoft,
        borderRadius: 9999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 24, color: t.text, lineHeight: 1.4, paddingTop: 4 }}>{children}</span>
  </div>
);

const LegalDuty: Page = () => (
  <div style={page}>
    <Eyebrow>LEI 14.831/2024 · PORTARIA MTE 1.419/2024</Eyebrow>
    <H2 size={52}>Por que a empresa não pode ignorar a NR-1?</H2>
    <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontFamily: mono, fontSize: 16, color: t.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          O empregador é responsável por
        </div>
        <NumberedStep n="1">Identificar riscos que causem dano psíquico</NumberedStep>
        <NumberedStep n="2">Analisar probabilidade e severidade</NumberedStep>
        <NumberedStep n="3">Mitigar através de medidas preventivas</NumberedStep>
      </div>
      <Card tone="red">
        <div style={{ fontFamily: mono, fontSize: 16, color: t.red, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Não cumprir expõe a
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 19, color: t.text, lineHeight: 1.4 }}>
          <div>💰 Multas administrativas (por nº de funcionários e gravidade)</div>
          <div>⚖️ Responsabilidade civil — indenizações</div>
          <div>🔴 Responsabilidade criminal em casos graves</div>
          <div>📋 Ações regressivas do INSS</div>
        </div>
      </Card>
    </div>
    <Footer page="05 / 20" />
  </div>
);

// ─── Slide 6: Dica sênior ──────────────────────────────────────────────────
const Compare = ({ wrong, right }: { wrong: string; right: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
    <Card tone="red">
      <div style={{ fontFamily: mono, fontSize: 16, color: t.red, marginBottom: 10 }}>✕ ERRADO</div>
      <div style={{ fontSize: 24, color: t.text, lineHeight: 1.45, fontStyle: 'italic', fontFamily: serif }}>“{wrong}”</div>
    </Card>
    <Card tone="orange">
      <div style={{ fontFamily: mono, fontSize: 16, color: t.orange, marginBottom: 10 }}>✓ CORRETO</div>
      <div style={{ fontSize: 24, color: t.text, lineHeight: 1.45, fontStyle: 'italic', fontFamily: serif }}>“{right}”</div>
    </Card>
  </div>
);

const SellingTip: Page = () => (
  <div style={page}>
    <Eyebrow>DICA SÊNIOR</Eyebrow>
    <H2>O gatilho psicológico que abre portas</H2>
    <div style={{ marginTop: 36 }}>
      <Compare
        wrong="Vamos trabalhar a saúde mental dos seus colaboradores..."
        right="Vamos estruturar a conformidade legal em riscos psicossociais e reduzir sua exposição a multas e processos."
      />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>
        O medo real do empresário não é "saúde mental" — é processo trabalhista e multa do Ministério do Trabalho.
        Use a lei como sua aliada de abertura de portas.
      </CalloutBox>
    </div>
    <Footer page="06 / 20" />
  </div>
);

// ─── Slide 7: Riscos psicossociais ───────────────────────────────────────────
const TripleRow = ({ label, example }: { label: string; example: string }) => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'baseline', padding: '14px 0', borderBottom: `1px solid ${t.border}` }}>
    <span style={{ fontFamily: mono, fontSize: 18, color: t.orange, width: 140, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 22, color: t.textMuted }}>{example}</span>
  </div>
);

const RiskDef: Page = () => (
  <div style={page}>
    <Eyebrow>DEFINIÇÃO TÉCNICA</Eyebrow>
    <H2 size={52}>O que são riscos psicossociais?</H2>
    <p style={{ fontSize: 25, color: t.textMuted, lineHeight: 1.5, maxWidth: 1450, marginTop: 20 }}>
      Elementos do design do trabalho, da organização, da gestão e dos contextos sociais que têm o{' '}
      <span style={{ color: t.text, fontWeight: 600 }}>potencial de causar danos</span> psicológicos, sociais ou
      físicos aos trabalhadores.
    </p>
    <div style={{ marginTop: 28 }}>
      <TripleRow label="PERIGO" example="A fonte geradora — ex.: alta demanda de trabalho" />
      <TripleRow label="RISCO" example="Probabilidade do perigo causar dano — ex.: probabilidade de burnout" />
      <TripleRow label="DANO" example="A consequência real — ex.: diagnóstico de ansiedade" />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>Risco físico é visível. Risco psicossocial é invisível — mas mensurável.</CalloutBox>
    </div>
    <Footer page="07 / 20" />
  </div>
);

// ─── Slide 8: 4 pilares ─────────────────────────────────────────────────────
const PillarCol = ({ title, items }: { title: string; items: string[] }) => (
  <div style={{ flex: 1, background: t.bgElev, border: `1px solid ${t.border}`, borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontFamily: mono, fontSize: 17, color: t.orange, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
    {items.map((it) => (
      <div key={it} style={{ fontSize: 18, color: t.textMuted, lineHeight: 1.35 }}>• {it}</div>
    ))}
  </div>
);

const FourPillars: Page = () => (
  <div style={page}>
    <Eyebrow>MODELO DEMAND-CONTROL-SUPPORT · KARASEK &amp; THEORELL</Eyebrow>
    <H2 size={48}>Os 4 pilares dos riscos psicossociais</H2>
    <div style={{ marginTop: 32, display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
      <PillarCol title="Demanda" items={['Volume de trabalho', 'Pressão de tempo', 'Complexidade das tarefas', 'Exigência emocional']} />
      <PillarCol title="Controle" items={['Autonomia sobre como/quando', 'realizar tarefas', 'Participação em decisões']} />
      <PillarCol title="Apoio" items={['Relações com colegas', 'Qualidade da liderança']} />
      <PillarCol title="Justiça" items={['Equidade em recompensas', 'Equidade em processos', 'Equidade em tratamento']} />
    </div>
    <div style={{ marginTop: 24 }}>
      <CalloutBox>Quanto maior a demanda e menor o controle/apoio/justiça, maior o risco de adoecimento.</CalloutBox>
    </div>
    <Footer page="08 / 20" />
  </div>
);

// ─── Slide 9: Impacto financeiro ─────────────────────────────────────────────
const CostRow = ({ label, desc, impact }: { label: string; desc: string; impact: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${t.border}` }}>
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: t.text }}>{label}</div>
      <div style={{ fontSize: 16, color: t.textMuted, marginTop: 2 }}>{desc}</div>
    </div>
    <div style={{ fontFamily: mono, fontSize: 16, color: t.orange }}>{impact}</div>
  </div>
);

const FinancialImpact: Page = () => (
  <div style={page}>
    <Eyebrow>CUSTO OCULTO</Eyebrow>
    <H2 size={48}>Quanto custa negligenciar riscos psicossociais?</H2>
    <div style={{ marginTop: 28, display: 'flex', alignItems: 'baseline', gap: 20 }}>
      <span style={{ fontFamily: mono, fontSize: 88, fontWeight: 600, color: t.orange, letterSpacing: '-0.02em' }}>R$ 4.800</span>
      <span style={{ fontSize: 22, color: t.textMuted }}>por funcionário/ano — custo oculto médio</span>
    </div>
    <div style={{ marginTop: 24 }}>
      <CostRow label="Turnover" desc="Rescisão + recrutamento + treinamento" impact="ALTO" />
      <CostRow label="Absenteísmo" desc="Dias perdidos por atestados (CID F)" impact="MÉDIO-ALTO" />
      <CostRow label="Presenteísmo" desc="Presente, produtividade reduzida" impact="MUITO ALTO" />
      <CostRow label="Sinistralidade" desc="Aumento no custo do plano de saúde" impact="ALTO" />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>A consultoria NR-1 não é um custo. É um investimento que se paga.</CalloutBox>
    </div>
    <Footer page="09 / 20" />
  </div>
);

// ─── Slide 10: Suicídio ocupacional e burnout ────────────────────────────────
const BurnoutSlide: Page = () => (
  <div style={page}>
    <Eyebrow>MUDANÇA DE PARADIGMA · 2024–2026</Eyebrow>
    <H2 size={48}>Suicídio ocupacional e burnout</H2>
    <div style={{ marginTop: 32 }}>
      <Compare
        wrong="Suicídio e burnout são problemas do indivíduo. A empresa não é responsável."
        right="Se o nexo causal for estabelecido com o ambiente de trabalho, a empresa responde integralmente."
      />
    </div>
    <div style={{ marginTop: 28 }}>
      <Card>
        <div style={{ fontSize: 22, color: t.text, lineHeight: 1.5 }}>
          O foco não é mais na resiliência do trabalhador — <span style={{ color: t.orange, fontWeight: 600 }}>é no ambiente</span>.
          A NR-1 exige mudar a organização do trabalho, não "curar" o colaborador.
        </div>
      </Card>
    </div>
    <Footer page="10 / 20" />
  </div>
);

// ─── Slide 11: Papel do psicólogo ────────────────────────────────────────────
const RoleCompare = ({ role, focus }: { role: string; focus: string }) => (
  <div style={{ flex: 1, background: t.bgElev, border: `1px solid ${t.border}`, borderRadius: 16, padding: '28px 30px' }}>
    <div style={{ fontFamily: mono, fontSize: 16, color: t.orange, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{role}</div>
    <div style={{ fontSize: 24, color: t.textMuted, marginTop: 12, lineHeight: 1.4 }}>{focus}</div>
  </div>
);

const RoleSlide: Page = () => (
  <div style={page}>
    <Eyebrow>SUA COMPETÊNCIA TÉCNICA</Eyebrow>
    <H2>O papel do psicólogo na NR-1</H2>
    <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
      <RoleCompare role="Engenheiro de segurança" focus="Olha para: ruído, calor, máquinas, EPIs." />
      <RoleCompare role="Psicólogo organizacional (você)" focus="Olha para: organização do trabalho, processos, liderança, comunicação, cultura." />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>Você é a profissional tecnicamente habilitada para a análise profunda dos riscos psicossociais.</CalloutBox>
    </div>
    <Footer page="11 / 20" />
  </div>
);

// ─── Slide 12: Competências e limites éticos ─────────────────────────────────
const EthicsList = ({ tone, title, items }: { tone: 'orange' | 'red'; title: string; items: string[] }) => (
  <Card tone={tone}>
    <div style={{ fontFamily: mono, fontSize: 16, color: tone === 'orange' ? t.orange : t.red, letterSpacing: '0.06em', marginBottom: 14 }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it) => (
        <div key={it} style={{ fontSize: 19, color: t.text, lineHeight: 1.4 }}>{it}</div>
      ))}
    </div>
  </Card>
);

const EthicsSlide: Page = () => (
  <div style={page}>
    <Eyebrow>LIMITES ÉTICOS</Eyebrow>
    <H2 size={52}>O que você faz e o que você não faz</H2>
    <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <EthicsList
        tone="orange"
        title="✓ VOCÊ FAZ"
        items={['Diagnóstico do coletivo', 'Análise de riscos psicossociais', 'Intervenção em processos', 'Recomendações estruturais', 'Treinamento de liderança']}
      />
      <EthicsList
        tone="red"
        title="✕ VOCÊ NÃO FAZ"
        items={['Psicoterapia dentro da empresa', 'Quebra de sigilo de prontuários', 'Diagnóstico clínico em relatório público', 'Encaminhamento clínico']}
      />
    </div>
    <Footer page="12 / 20" />
  </div>
);

// ─── Slide 13: Sigilo vs comunicação ─────────────────────────────────────────
const SecrecySlide: Page = () => (
  <div style={page}>
    <Eyebrow>ÉTICA APLICADA</Eyebrow>
    <H2 size={48}>Como reportar riscos sem quebrar sigilo</H2>
    <div style={{ marginTop: 32 }}>
      <Compare
        wrong="João da Contabilidade apresenta sintomas de depressão e está afastado há 2 meses."
        right="80% da equipe de contabilidade apresenta alto risco de estresse por prazos apertados."
      />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>
        Regra de ouro: reporte o risco coletivo sem identificar indivíduos. Exceção: risco iminente à vida autoriza
        quebra de sigilo.
      </CalloutBox>
    </div>
    <Footer page="13 / 20" />
  </div>
);

// ─── Slide 14: Responsabilidade solidária ────────────────────────────────────
const LiabilitySlide: Page = () => (
  <div style={page}>
    <Eyebrow>RESPONSABILIDADE TÉCNICA</Eyebrow>
    <H2 size={52}>Você assina, você responde</H2>
    <p style={{ fontSize: 25, color: t.textMuted, lineHeight: 1.5, maxWidth: 1400, marginTop: 20 }}>
      Ao assinar um laudo de AEP ou inventário de riscos, você assume responsabilidade técnica.
    </p>
    <div style={{ marginTop: 28 }}>
      <Card tone="red">
        <div style={{ fontFamily: mono, fontSize: 16, color: t.red, marginBottom: 12 }}>SE VOCÊ OMITIR UM RISCO GRAVE</div>
        <div style={{ display: 'flex', gap: 40, fontSize: 20, color: t.text }}>
          <span>Eticamente (Conselho Regional)</span>
          <span>Legalmente (cível e criminal)</span>
          <span>Profissionalmente (credibilidade)</span>
        </div>
      </Card>
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>Sempre documente suas recomendações. Se a empresa não aceitar, deixe registrado por escrito.</CalloutBox>
    </div>
    <Footer page="14 / 20" />
  </div>
);

// ─── Slide 15: 3 pilares da consultoria ──────────────────────────────────────
const FlowStep = ({ n, title, items }: { n: string; title: string; items: string[] }) => (
  <div style={{ flex: 1, background: t.bgElev, border: `1px solid ${t.border}`, borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontFamily: mono, fontSize: 15, color: t.orange, letterSpacing: '0.1em' }}>PILAR {n}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: t.text }}>{title}</div>
    {items.map((it) => (
      <div key={it} style={{ fontSize: 17, color: t.textMuted, lineHeight: 1.35 }}>• {it}</div>
    ))}
  </div>
);

const ThreePillars: Page = () => (
  <div style={page}>
    <Eyebrow>ESTRUTURA</Eyebrow>
    <H2 size={48}>Os 3 pilares da consultoria NR-1</H2>
    <div style={{ marginTop: 32, display: 'flex', gap: 20, flex: 1, minHeight: 0, alignItems: 'stretch' }}>
      <FlowStep n="1" title="Diagnóstico" items={['AEP / AET', 'ISO 45003', '13 dimensões de risco', 'Percepções em números']} />
      <FlowStep n="2" title="Ação" items={['Plano de intervenção', 'Cronograma', 'Mudanças em fluxos', 'Treinamentos']} />
      <FlowStep n="3" title="Avaliação" items={['Dashboards e indicadores', 'ROI', 'Queda no absenteísmo', 'Melhoria no clima']} />
    </div>
    <div style={{ marginTop: 24 }}>
      <CalloutBox>Nenhum dado se perde. A empresa vê valor em cada etapa.</CalloutBox>
    </div>
    <Footer page="15 / 20" />
  </div>
);

// ─── Slide 16: Metodologia Entrelaços ────────────────────────────────────────
const MethodBlock = ({ n, title, items }: { n: string; title: string; items: string[] }) => (
  <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
    <span style={{ fontFamily: mono, fontSize: 20, color: t.orange, fontWeight: 600, flexShrink: 0 }}>{n}</span>
    <div>
      <div style={{ fontSize: 22, fontWeight: 600, color: t.text }}>{title}</div>
      <div style={{ fontSize: 18, color: t.textMuted, marginTop: 4, lineHeight: 1.4 }}>{items.join(' · ')}</div>
    </div>
  </div>
);

const Methodology: Page = () => (
  <div style={page}>
    <Eyebrow>DIFERENCIAL ENTRELAÇOS</Eyebrow>
    <H2 size={48}>Por que Entrelaços é diferente</H2>
    <p style={{ fontSize: 24, color: t.textMuted, maxWidth: 1400, marginTop: 16 }}>
      Falamos a língua do C-Level. Não entregamos um "relatório de sofrimento" — entregamos um{' '}
      <span style={{ color: t.text, fontWeight: 600 }}>plano de gestão de riscos com ROI comprovado</span>.
    </p>
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MethodBlock n="01" title="Os 8 kits de ferramentas" items={['Contratos', 'Questionários validados', 'Planilhas de ROI', 'Economia de 70% do backoffice']} />
      <MethodBlock n="02" title="Os 12 programas mensais" items={['Recorrência', 'Faturamento garantido', 'Conformidade contínua']} />
      <MethodBlock n="03" title="Foco em ROI" items={['Investe R$ 20k, economiza R$ 100k', 'Consultoria "de graça"']} />
    </div>
    <Footer page="16 / 20" />
  </div>
);

// ─── Slide 17: Exercício prático ─────────────────────────────────────────────
const CaseStudy: Page = () => (
  <div style={page}>
    <Eyebrow>EXERCÍCIO PRÁTICO</Eyebrow>
    <H2 size={48}>Escritório "Números Exatos"</H2>
    <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <div>
        <div style={{ fontFamily: mono, fontSize: 15, color: t.textFaint, letterSpacing: '0.1em', marginBottom: 10 }}>CENÁRIO</div>
        <div style={{ fontSize: 20, color: t.text, lineHeight: 1.6 }}>
          50 colaboradores · turnover de 25%/ano · aumento de erros fiscais · clima de silêncio e tensão
        </div>
        <div style={{ fontFamily: mono, fontSize: 15, color: t.textFaint, letterSpacing: '0.1em', margin: '20px 0 10px' }}>SINAIS DE ALERTA</div>
        <div style={{ fontSize: 18, color: t.textMuted, lineHeight: 1.6 }}>
          🚩 Luzes acesas até 22h · 🚩 3 afastamentos em 6 meses · 🚩 Liderança autoritária · 🚩 Falta de comunicação
        </div>
      </div>
      <Card tone="orange">
        <div style={{ fontFamily: mono, fontSize: 15, color: t.orange, marginBottom: 10 }}>IMPACTO ESTIMADO</div>
        <div style={{ fontFamily: mono, fontSize: 44, color: t.text, fontWeight: 600 }}>R$ 120.000/ano</div>
        <div style={{ fontSize: 17, color: t.textMuted, marginTop: 10 }}>Entre multas, contratação, absenteísmo e sinistralidade.</div>
      </Card>
    </div>
    <Footer page="17 / 20" />
  </div>
);

// ─── Slide 18: Pergunta de reflexão ──────────────────────────────────────────
const Reflection: Page = () => (
  <div style={{ ...page, justifyContent: 'center' }}>
    <Eyebrow>SUA VEZ</Eyebrow>
    <H2 size={64}>
      Como consultora Entrelaços, qual seria seu <span style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, color: t.orange }}>primeiro passo</span> ao entrar nesta empresa?
    </H2>
    <p style={{ fontSize: 26, color: t.textMuted, maxWidth: 1400, marginTop: 28 }}>
      Como você abordaria o diretor para convencê-lo de que a consultoria NR-1 é urgente?
    </p>
    <div style={{ marginTop: 40 }}>
      <CalloutBox>Lembre-se: não venda "saúde mental". Venda segurança jurídica e redução de custos.</CalloutBox>
    </div>
    <Footer page="18 / 20" />
  </div>
);

// ─── Slide 19: Resumo ────────────────────────────────────────────────────────
const Summary: Page = () => (
  <div style={page}>
    <Eyebrow>RESUMO DO BLOCO 1</Eyebrow>
    <H2>O que você aprendeu</H2>
    <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 48px' }}>
      <CheckLine>A NR-1 é a "norma mãe" da segurança do trabalho</CheckLine>
      <CheckLine>Riscos psicossociais são invisíveis, mas mensuráveis</CheckLine>
      <CheckLine>A Lei 14.831/2024 tornou saúde mental obrigação legal</CheckLine>
      <CheckLine>Você é tecnicamente habilitada para diagnosticar</CheckLine>
      <CheckLine>Seu papel é mudar a organização, não "curar" indivíduos</CheckLine>
      <CheckLine>A metodologia Entrelaços diferencia você no mercado</CheckLine>
      <CheckLine>O ROI é seu melhor argumento de venda</CheckLine>
    </div>
    <Footer page="19 / 20" />
  </div>
);

// ─── Slide 20: Próximos passos ───────────────────────────────────────────────
const NextSteps: Page = () => (
  <div style={{ ...page, justifyContent: 'center' }}>
    <Eyebrow>PRÓXIMO BLOCO</Eyebrow>
    <H2 size={72}>Diagnóstico Técnico</H2>
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CheckLine>Como estruturar a AEP/AET</CheckLine>
      <CheckLine>Questionários validados — COPSOQ e Questionário Entrelaços</CheckLine>
      <CheckLine>Como transformar dados em matriz de risco</CheckLine>
      <CheckLine>Como apresentar o diagnóstico ao C-Level</CheckLine>
    </div>
    <div style={{ marginTop: 'auto' }}>
      <CalloutBox>Você agora tem a segurança técnica e comercial para abrir portas em qualquer empresa.</CalloutBox>
    </div>
    <Footer page="20 / 20" />
  </div>
);

export const meta: SlideMeta = {
  title: 'Bloco 1 — Fundamentos da NR-1 e Riscos Psicossociais',
  theme: 'entrelacos',
  createdAt: '2026-07-16T23:59:25.830Z',
};

export default [
  Cover,
  Learn,
  Timeline,
  WhatIsNR1,
  LegalDuty,
  SellingTip,
  RiskDef,
  FourPillars,
  FinancialImpact,
  BurnoutSlide,
  RoleSlide,
  EthicsSlide,
  SecrecySlide,
  LiabilitySlide,
  ThreePillars,
  Methodology,
  CaseStudy,
  Reflection,
  Summary,
  NextSteps,
] satisfies Page[];
