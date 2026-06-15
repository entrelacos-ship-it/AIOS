// =================================================================
// BÍBLIA · Mini-site · Build script
// Define a estrutura, gera todas as 23 rotas + index a partir de
// um layout compartilhado.
// =================================================================

const PAGES = [
  // GROUP: FUNDAMENTOS
  { slug: 'filosofia', num: '01', group: 'Fundamentos', title: 'Filosofia', titleHtml: 'Densidade emocional vence <em>saturação visual</em>.', lead: 'Todo o sistema é construído sobre três decisões nucleares. Quem violar qualquer uma delas está fazendo outra marca, não Entrelaços.', body: 'filosofia' },
  { slug: 'identidade', num: '02', group: 'Fundamentos', title: 'Identidade visual', titleHtml: 'A borboleta, o ponto, <em>o nome</em>.', lead: 'A logo Entrelaços traduz a marca em três sinais: as duas asas em roxo (entrelaçar), o ponto laranja no centro (vida, calor humano) e o lockup tipográfico com "Psi" em italic-serif.', body: 'identidade' },
  { slug: 'voz', num: '03', group: 'Fundamentos', title: 'Voz da marca', titleHtml: 'Confronto fértil. Densidade. <em>Dignidade.</em>', lead: 'A Entrelaços fala como quem já viu, já fez, e ainda escolhe acreditar. Confronto que abre escolha — nunca confronto que humilha. Densidade emocional sem dramatização.', body: 'voz' },

  // GROUP: TOKENS
  { slug: 'cores', num: '04', group: 'Tokens', title: 'Paleta & cores', titleHtml: 'Roxo denso domina. <em>Laranja</em> é exceção rara.', lead: 'A escala foi calibrada para que <code class="bs-inline">--e-purple-600</code> seja o tom de CTAs e destaques, <code class="bs-inline">--e-purple-900/950</code> para fundos profundos, e <code class="bs-inline">--e-purple-50/100</code> para inversões cream-violáceas.', body: 'cores' },
  { slug: 'tipografia', num: '05', group: 'Tokens', title: 'Tipografia', titleHtml: 'Três fontes. Pesos calculados. <em>Mistura ritualística.</em>', lead: 'Inter Tight para sans tight, Instrument Serif para italic editorial, JetBrains Mono para labels técnicas. A "assinatura visual" é o mix dentro da mesma headline: 1 ou 2 palavras-chave em italic, o resto em sans tight.', body: 'tipografia' },
  { slug: 'espaco', num: '06', group: 'Tokens', title: 'Espaçamento', titleHtml: 'Escala de 4. <em>Section-y</em> de 100px.', lead: 'Toda seção respira a mesma quantidade. Toda card tem padding mínimo de 32px. Esse rigor é o que faz o sistema parecer um sistema.', body: 'espaco' },
  { slug: 'raio', num: '07', group: 'Tokens', title: 'Raio & geometria', titleHtml: 'Pílula = ação. 20px = card. <em>Quadrado</em> = input.', lead: 'A geometria diferencia famílias de componente. Botões e badges são pílulas. Cards são retângulos suaves de 20px. Inputs são quadrados — entrada de dado, não ação.', body: 'raio' },
  { slug: 'sombra', num: '08', group: 'Tokens', title: 'Sombras & depth', titleHtml: 'A depth é <em>cor</em>, não preto.', lead: 'Toda sombra de identidade combina inset hairline branco + glow roxo translúcido. Isso é o que diferencia visualmente do "drop-shadow preto" genérico de qualquer SaaS.', body: 'sombra' },
  { slug: 'motion', num: '09', group: 'Tokens', title: 'Motion', titleHtml: 'Curva assinatura: <em>cubic-bezier(0.22, 1, 0.36, 1)</em>.', lead: 'Tudo respira na mesma curva. Tudo aparece com o mesmo reveal. A coerência de motion é o que faz o sistema sentir vivo, não animado.', body: 'motion' },

  // GROUP: COMPONENTES
  { slug: 'botoes', num: '10', group: 'Componentes', title: 'Botões', titleHtml: 'Pílula. Glow. <em>Lift</em> no hover.', lead: 'CTAs primários sempre roxo-600 com inset hairline + glow. Ghost para secundários. Link para terciários. Variante on-cream usa roxo-700 sólido.', body: 'botoes' },
  { slug: 'eyebrows', num: '11', group: 'Componentes', title: 'Eyebrows', titleHtml: 'Toda seção começa <em>aqui</em>.', lead: 'Três variantes. O chip carrega ações pequenas com dot-glow. O dash é mais discreto. O separator é para trust strips e momentos de respiração.', body: 'eyebrows' },
  { slug: 'cards', num: '12', group: 'Componentes', title: 'Cards', titleHtml: 'Spotlight on hover. <em>Padding</em> mínimo 32px.', lead: 'O card é a unidade de conteúdo padrão. Sempre 20px de raio, 32px de padding mínimo, índice mono opcional, e spotlight radial seguindo o cursor no hover.', body: 'cards' },
  { slug: 'stats', num: '13', group: 'Componentes', title: 'Stats', titleHtml: 'Quatro pilares. <em>Counter</em> animado no scroll.', lead: 'Use stats em grupos de 4, mono no número, mono em CAPS no label. O counter anima de 0 ao valor com cubic-out 1.8s no momento que entra no viewport.', body: 'stats' },
  { slug: 'inputs', num: '14', group: 'Componentes', title: 'Inputs & forms', titleHtml: 'Quadrado. Foco roxo. <em>Sem pílula nunca.</em>', lead: 'Input é entrada de dado, não ação. Por isso é quadrado — diferente de botões e badges. Focus ring é halo roxo de 3px com border purple-400.', body: 'inputs' },
  { slug: 'badges', num: '15', group: 'Componentes', title: 'Badges', titleHtml: 'Status, urgência, <em>credencial.</em>', lead: 'Badges são pílulas pequenas em mono. Roxo é o default. Laranja é reservado para urgência genuína (segue a regra de 3 usos por página).', body: 'badges' },
  { slug: 'header', num: '16', group: 'Componentes', title: 'Header pill', titleHtml: 'Glassmorphic. <em>Shrink</em> no scroll.', lead: 'Pílula flutuante, fixed top, com backdrop-blur e inset hairline. Encolhe sutilmente após 32px de scroll — economiza presença visual sem desaparecer.', body: 'header' },
  { slug: 'avancados', num: '17', group: 'Componentes', title: 'Avançados', titleHtml: 'Constellation. Atrator de Lorenz. <em>Cometas.</em>', lead: 'Os componentes assinatura da marca — onde a metáfora vira interação. Use com parcimônia: no máximo um por página, sempre na dobra adequada.', body: 'avancados' },

  // GROUP: PADRÕES
  { slug: 'dobras', num: '18', group: 'Padrões', title: '11 dobras canônicas', titleHtml: 'A LP roda nesta sequência. <em>Não inverter.</em>', lead: 'A copy precisa respeitar a onda emocional. Não pular dobras sem razão estratégica. Não colar CTA hard antes da fundadora. Cada dobra abre a porta da próxima.', body: 'dobras' },
  { slug: 'copy', num: '19', group: 'Padrões', title: 'Copy & CTAs', titleHtml: 'Confronto + escolha. <em>Travessia</em>, não promessa.', lead: 'A copy da Entrelaços não vende — convida. Não promete faturamento — devolve dignidade. CTAs ranqueados do soft ao hard, e o hard só aparece quando há janela genuína.', body: 'copy' },
  { slug: 'marketing', num: '20', group: 'Padrões', title: 'Marketing arc', titleHtml: 'A onda emocional. <em>Não inverter.</em>', lead: 'Cada dobra responde a uma pergunta interna do leitor. A LP cria uma onda — quebrar a ordem é quebrar a transformação interna que ela produz.', body: 'marketing' },

  // GROUP: REGRAS
  { slug: 'regras', num: '21', group: 'Regras', title: 'Faça / não faça', titleHtml: 'As linhas que <em>não se cruzam.</em>', lead: 'Algumas decisões são preferência. Estas não são. Cruzar qualquer uma delas é fazer outra marca, não Entrelaços.', body: 'regras' },
  { slug: 'acessibilidade', num: '22', group: 'Regras', title: 'Acessibilidade', titleHtml: 'Contraste validado. <em>Foco</em> visível. Touch ≥ 44px.', lead: 'A Entrelaços é uma marca que fala em dignidade. A acessibilidade não é checklist — é coerência ética com o manifesto.', body: 'acessibilidade' },
  { slug: 'quickstart', num: '23', group: 'Regras', title: 'Quickstart', titleHtml: 'Para criar uma nova <em>página Entrelaços.</em>', lead: 'Sete passos. Se você seguir, sai uma página que parece da marca. Se pular qualquer um, sai um SaaS roxo.', body: 'quickstart' },
];

await saveFile('biblia/_pages.json', JSON.stringify(PAGES, null, 2));
log('Saved _pages.json with ' + PAGES.length + ' pages');
