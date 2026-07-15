'use strict';

const { execFile } = require('child_process');

const DESIGN_SYSTEMS = {
  auto: {
    name: 'Auto - usar todas as referencias',
    direction: 'selecione a melhor combinacao entre templates narrativos, brand systems, layout families, wireframes e referencias carregadas; declare as escolhas no markdown',
    palette: 'derivada do deck job e do publico; usar Entrelacos como fallback quando o briefing for sobre psicologia',
    typography: 'derivada do sistema visual escolhido, com hierarquia editorial e leitura segura',
    references: 'templates/index, brand-systems, theme-tokens, layout-families, brand-system-patterns, aiox/redpine patterns, wireframes e referencias completas',
  },
  entrelacos: {
    name: 'Entrelaços Psicologia',
    direction: 'humano, revolucionario, editorial, profundo, acolhedor e estrategico',
    palette: '#792941 vinho, #f6f1e8 papel, #171612 tinta, #596a3d oliva, #d7cdf2 lavanda',
    typography: 'titulos serifados editoriais, corpo limpo e legivel',
    references: 'manifesto Entrelaços, design-system, narrative-patterns, editorial layouts, proof-stack e webinar-flow',
  },
  editorial: {
    name: 'Editorial premium',
    direction: 'revista contemporanea, alto contraste, ritmo de paginas, muita hierarquia',
    palette: '#111111 tinta, #f7f2ea papel, #a23b56 acento, #d6c7a1 linhas',
    typography: 'serif display com sans neutra',
    references: 'layout-families, media-layouts, roteiro-template-library e slide-structure-library',
  },
  redpine: {
    name: 'Redpine Editorial Precision',
    direction: 'institucional, preciso, operacional, premium e contido; bordas finas, superficie quente e acento vermelho disciplinado',
    palette: '#FAF8F8 pagina, #FFFFFF elevado, #11090A texto, #AB2832 acento, #E8E3E3 borda',
    typography: 'grotesk editorial, numeros serios, baixa ornamentacao',
    references: 'brand-systems:redpine_editorial_precision, redpine-deep-patterns, rendered-eval e visual-gates',
  },
  aiox: {
    name: 'AIOX Brandbook Cockpit',
    direction: 'dark, tecnico, manifesto-grade, operacional, alto sinal e arquitetura visual densa',
    palette: '#050505 canvas, #F4F4E8 texto, #D1FF00 sinal, #0099FF apoio, #ED4609 alerta',
    typography: 'display uppercase tecnico, corpo sans, mono para rotulos e rodapes',
    references: 'brand-systems:aiox_brandbook_cockpit, aiox-brandbook-deep-patterns, benchmark matrix e mechanism-map',
  },
  webinar: {
    name: 'Webinar Flow',
    direction: 'aula persuasiva com abertura forte, tensao, mecanismo, prova, plano e convite; visual didatico com ritmo de palco',
    palette: '#171612 tinta, #fffaf2 papel, #792941 decisao, #1f4f5a apoio, #d8cfc2 linha',
    typography: 'titulos editoriais fortes e corpo de leitura de apresentacao',
    references: 'wireframes/webinar-flow, deck route-map, copy-derived e narrative-patterns',
  },
  proof: {
    name: 'Proof Stack',
    direction: 'prova, contraste, criterios, matriz e decisao; ideal para demonstrar mecanismo, evidencias e comparacoes',
    palette: '#fffaf2 superficie, #171612 texto, #596a3d evidencia, #792941 decisao, #d8cfc2 divisao',
    typography: 'sans legivel com display serifado apenas nos claims decisivos',
    references: 'wireframes/proof-stack, charts-and-diagrams, evidence-ledger e template-selection-gates',
  },
  minimal: {
    name: 'Minimal didatico',
    direction: 'claro, calmo, pedagogico, com respiro e diagramas simples',
    palette: '#202124 grafite, #ffffff branco, #eef1f4 superficie, #2f6f7e acento',
    typography: 'sans humanista, titulos objetivos',
    references: 'slide function-library, layout-families e copy-gates',
  },
  dark: {
    name: 'Dark strategy',
    direction: 'estrategico, sofisticado, fundo escuro, contraste alto, visual de boardroom',
    palette: '#101010 fundo, #f3eee5 texto, #b45a72 acento, #7f8f5f apoio',
    typography: 'sans condensada nos titulos e corpo limpo',
    references: 'aiox patterns com menos neon, board/product strategy routes e diagram-rendering',
  },
};

function getDesignSystem(id) {
  const key = DESIGN_SYSTEMS[id] ? id : 'entrelacos';
  return { id: key, ...DESIGN_SYSTEMS[key] };
}

function buildPrompt(briefing, skillContent, designSystem) {
  return `${skillContent}

---

Voce esta executando o Slide Creator dentro de uma aplicacao web.
Nao diga que o skill nao esta registrado.
Nao descreva seu processo antes do resultado.
Sua resposta deve ser APENAS um JSON valido, sem markdown fences.

Contrato obrigatorio de saida:
{
  "title": "titulo curto do deck",
  "designSystem": "${designSystem.name}",
  "markdown": "deck completo em markdown, com separador --- entre slides",
  "slides": [
    {
      "number": 1,
      "function": "hook|diagnostico|mecanismo|prova|plano|cta",
      "title": "titulo de acao",
      "body": ["linha visivel 1", "linha visivel 2"],
      "speakerNotes": "notas objetivas"
    }
  ],
  "html": "<!doctype html>..."
}

Regras do HTML:
- Gere um arquivo HTML completo e autocontido, com CSS no <style>.
- Cada slide deve ser uma <section class="slide">.
- Use proporcao 16:9, com largura maxima de 1280px.
- Use no minimo 5 familias de layout vindas dos templates/referencias carregados: hero, contraste, mecanismo/mapa, prova/cards, plano/timeline, CTA.
- Efeitos devem ser estaveis e discretos: apenas fade + deslocamento maximo de 16px. Nao use autoplay, canvas, parallax, perspective, transform 3D, blur animado, glitch, animacoes infinitas, elementos flutuantes agressivos ou keyframes que movam o layout.
- Inclua progresso visual, contador, botoes anterior/proximo e suporte a setas do teclado.
- Inclua presenter notes no HTML em <aside class="notes">.
- Inclua um relatorio compacto de selecao: roteiro-template, slide-structures usadas, visual references usadas, design-system base e QA score no markdown.
- Aplique este design system: ${designSystem.name}.
- Direcao visual: ${designSystem.direction}.
- Paleta: ${designSystem.palette}.
- Tipografia: ${designSystem.typography}.
- Referencias obrigatorias desse sistema: ${designSystem.references || 'templates e referencias carregadas'}.
- O HTML deve trazer uma identidade visual reconhecivel desse sistema, nao apenas trocar nomes no markdown.
- O <body> deve incluir data-slide-system="${designSystem.id}".
- Use variaveis CSS, fundo, acentos, molduras, tipografia e composicao coerentes com ${designSystem.name}.
- Nao use imagens externas.
- Nao use placeholder lorem ipsum.
- Evite slides genericos: cada titulo deve fazer uma afirmacao e cada slide deve ter uma funcao narrativa.
- Nao inclua explicacoes fora do JSON.

Briefing do usuario:
${briefing}`;
}

function extractJson(raw) {
  const text = String(raw || '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Claude did not return valid JSON.');
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stableDeckCss() {
  return `<style id="slide-creator-stability">
*{box-sizing:border-box}
html,body{overflow:hidden}
.slide{will-change:opacity,transform;transition:opacity .28s ease,transform .28s ease!important;animation:none!important}
.slide:not(.active){pointer-events:none}
.slide.active{pointer-events:auto}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
}
</style>`;
}

function stabilizeHtml(html) {
  const value = String(html || '');
  if (!value || value.includes('slide-creator-stability')) return value;
  if (value.includes('</head>')) return value.replace('</head>', `${stableDeckCss()}\n</head>`);
  return `${stableDeckCss()}\n${value}`;
}

function designSystemCss(designSystem) {
  const id = designSystem.id || 'entrelacos';
  const css = {
    auto: `
body[data-slide-system="auto"]{background:#ede8df;color:#171612}
body[data-slide-system="auto"] .deck{background:linear-gradient(135deg,#fffaf2 0%,#f1e7dc 52%,#e9edf1 100%);border:1px solid #d8cfc2}
body[data-slide-system="auto"] .deck:before{background:linear-gradient(90deg,rgba(121,41,65,.07) 1px,transparent 1px),linear-gradient(180deg,rgba(31,79,90,.07) 1px,transparent 1px);background-size:44px 44px}
body[data-slide-system="auto"] .kicker,body[data-slide-system="auto"] .progress{color:#1f4f5a;background:#1f4f5a}
body[data-slide-system="auto"] .slide h1{font-family:Georgia,serif}
body[data-slide-system="auto"] .mechanism .content p,body[data-slide-system="auto"] .proof .content p{border-color:#cfc2b3;background:rgba(255,250,242,.82)}`,
    entrelacos: `
body[data-slide-system="entrelacos"]{background:#f6f1e8;color:#171612}
body[data-slide-system="entrelacos"] .deck{background:linear-gradient(135deg,#fffaf2 0%,#f4eadc 62%,#efe3ee 100%);border:1px solid #d8cfc2}
body[data-slide-system="entrelacos"] .deck:before{background:linear-gradient(90deg,rgba(121,41,65,.08) 1px,transparent 1px),linear-gradient(180deg,rgba(89,106,61,.07) 1px,transparent 1px);background-size:56px 56px}
body[data-slide-system="entrelacos"] .kicker,body[data-slide-system="entrelacos"] .progress{color:#792941;background:#792941}
body[data-slide-system="entrelacos"] .slide h1{font-family:Georgia,serif;letter-spacing:0}
body[data-slide-system="entrelacos"] .cta{background:linear-gradient(135deg,#171612,#4e1828)}
body[data-slide-system="entrelacos"] .mechanism .content p,body[data-slide-system="entrelacos"] .proof .content p{border-color:#d8cfc2;background:rgba(255,250,242,.82)}`,
    editorial: `
body[data-slide-system="editorial"]{background:#111;color:#f7f2ea}
body[data-slide-system="editorial"] .deck{background:#f7f2ea;color:#111;border:10px solid #111;box-shadow:none}
body[data-slide-system="editorial"] .deck:before{background:linear-gradient(90deg,rgba(17,17,17,.09) 1px,transparent 1px);background-size:72px 72px}
body[data-slide-system="editorial"] .kicker,body[data-slide-system="editorial"] .progress{color:#a23b56;background:#a23b56}
body[data-slide-system="editorial"] .slide h1{font-family:Georgia,serif;font-size:clamp(3rem,5.6vw,6rem);border-top:3px solid #111;padding-top:.35em}
body[data-slide-system="editorial"] .content{font-family:Arial,sans-serif}
body[data-slide-system="editorial"] .mechanism .content p,body[data-slide-system="editorial"] .proof .content p{border:0;border-top:2px solid #111;border-radius:0;background:#fff}`,
    redpine: `
body[data-slide-system="redpine"]{background:#FAF8F8;color:#11090A}
body[data-slide-system="redpine"] .deck{background:#fff;color:#11090A;border:1px solid #BFB6B6;box-shadow:0 18px 46px rgba(17,9,10,.12)}
body[data-slide-system="redpine"] .deck:before{background:linear-gradient(180deg,#AB2832 0 6px,transparent 6px),linear-gradient(90deg,rgba(191,182,182,.45) 1px,transparent 1px);background-size:100% 100%,96px 96px}
body[data-slide-system="redpine"] .kicker,body[data-slide-system="redpine"] .progress{color:#AB2832;background:#AB2832}
body[data-slide-system="redpine"] .slide h1{font-family:Arial,sans-serif;text-transform:none;font-weight:850;letter-spacing:0}
body[data-slide-system="redpine"] .mechanism .content p,body[data-slide-system="redpine"] .proof .content p{border:1px solid #BFB6B6;border-radius:0;background:#F4F1F1}
body[data-slide-system="redpine"] .nav button{border-radius:0;background:#AB2832}`,
    aiox: `
body[data-slide-system="aiox"]{background:#050505;color:#F4F4E8}
body[data-slide-system="aiox"] .deck{background:radial-gradient(circle at 78% 18%,rgba(209,255,0,.16),transparent 22rem),#050505;color:#F4F4E8;border:1px solid rgba(209,255,0,.35);box-shadow:0 0 80px rgba(209,255,0,.08)}
body[data-slide-system="aiox"] .deck:before{background:linear-gradient(90deg,rgba(209,255,0,.11) 1px,transparent 1px),linear-gradient(180deg,rgba(244,244,232,.06) 1px,transparent 1px);background-size:64px 64px}
body[data-slide-system="aiox"] .kicker,body[data-slide-system="aiox"] .progress{color:#D1FF00;background:#D1FF00}
body[data-slide-system="aiox"] .slide h1{font-family:Impact,Arial Black,Arial,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#F4F4E8}
body[data-slide-system="aiox"] .content,body[data-slide-system="aiox"] .notes,body[data-slide-system="aiox"] .counter{color:#DDD1BB}
body[data-slide-system="aiox"] .mechanism .content p,body[data-slide-system="aiox"] .proof .content p{border:1px solid rgba(209,255,0,.32);border-radius:4px;background:#0F0F11}
body[data-slide-system="aiox"] .nav button{background:#D1FF00;color:#050505}`,
    webinar: `
body[data-slide-system="webinar"]{background:#171612;color:#fffaf2}
body[data-slide-system="webinar"] .deck{background:linear-gradient(90deg,#fffaf2 0 70%,#2f251f 70% 100%);color:#171612;border:1px solid #d8cfc2}
body[data-slide-system="webinar"] .deck:before{background:linear-gradient(180deg,rgba(121,41,65,.16) 1px,transparent 1px);background-size:100% 72px}
body[data-slide-system="webinar"] .kicker,body[data-slide-system="webinar"] .progress{color:#792941;background:#792941}
body[data-slide-system="webinar"] .slide h1{font-family:Georgia,serif;max-width:760px}
body[data-slide-system="webinar"] .content{max-width:650px}
body[data-slide-system="webinar"] .notes{right:5vw;left:auto;width:24%;color:#f6f1e8}
body[data-slide-system="webinar"] .mechanism .content p,body[data-slide-system="webinar"] .proof .content p{background:#fff;border-color:#d8cfc2}`,
    proof: `
body[data-slide-system="proof"]{background:#eef1ed;color:#171612}
body[data-slide-system="proof"] .deck{background:#fffaf2;color:#171612;border:1px solid #596a3d}
body[data-slide-system="proof"] .deck:before{background:linear-gradient(90deg,rgba(89,106,61,.18) 1px,transparent 1px),linear-gradient(180deg,rgba(89,106,61,.12) 1px,transparent 1px);background-size:80px 80px}
body[data-slide-system="proof"] .kicker,body[data-slide-system="proof"] .progress{color:#596a3d;background:#596a3d}
body[data-slide-system="proof"] .slide h1{font-family:Georgia,serif;border-left:8px solid #596a3d;padding-left:.35em}
body[data-slide-system="proof"] .mechanism .content p,body[data-slide-system="proof"] .proof .content p{border:1px solid #596a3d;background:#f4f7ef}
body[data-slide-system="proof"] .timeline .content p{border-left-color:#596a3d}`,
    minimal: `
body[data-slide-system="minimal"]{background:#eef1f4;color:#202124}
body[data-slide-system="minimal"] .deck{background:#fff;color:#202124;border:1px solid #dfe4e8;box-shadow:0 18px 50px rgba(32,33,36,.08)}
body[data-slide-system="minimal"] .deck:before{display:none}
body[data-slide-system="minimal"] .kicker,body[data-slide-system="minimal"] .progress{color:#2f6f7e;background:#2f6f7e}
body[data-slide-system="minimal"] .slide h1{font-family:Segoe UI,Arial,sans-serif;font-weight:760;letter-spacing:0}
body[data-slide-system="minimal"] .mechanism .content p,body[data-slide-system="minimal"] .proof .content p{border:1px solid #dfe4e8;background:#f8fafb}
body[data-slide-system="minimal"] .nav button{background:#202124}`,
    dark: `
body[data-slide-system="dark"]{background:#101010;color:#f3eee5}
body[data-slide-system="dark"] .deck{background:linear-gradient(135deg,#101010,#191816 55%,#25211f);color:#f3eee5;border:1px solid rgba(243,238,229,.18);box-shadow:0 22px 80px rgba(0,0,0,.5)}
body[data-slide-system="dark"] .deck:before{background:linear-gradient(90deg,rgba(180,90,114,.12) 1px,transparent 1px),linear-gradient(180deg,rgba(243,238,229,.06) 1px,transparent 1px);background-size:58px 58px}
body[data-slide-system="dark"] .kicker,body[data-slide-system="dark"] .progress{color:#b45a72;background:#b45a72}
body[data-slide-system="dark"] .slide h1{font-family:Arial Narrow,Arial,sans-serif;text-transform:uppercase;color:#f3eee5}
body[data-slide-system="dark"] .content,body[data-slide-system="dark"] .notes,body[data-slide-system="dark"] .counter{color:#d8d0c5}
body[data-slide-system="dark"] .mechanism .content p,body[data-slide-system="dark"] .proof .content p{border:1px solid rgba(180,90,114,.45);background:rgba(255,255,255,.04)}
body[data-slide-system="dark"] .nav button{background:#b45a72;color:#fff}`,
  }[id] || '';

  return `<style id="slide-creator-design-system">
${css}
</style>`;
}

function applyDesignSystemIdentity(html, designSystem) {
  let value = String(html || '');
  const style = designSystemCss(designSystem);

  if (!value.includes('slide-creator-design-system')) {
    value = value.includes('</head>')
      ? value.replace('</head>', `${style}\n</head>`)
      : `${style}\n${value}`;
  }

  if (/<body\b/i.test(value) && !/data-slide-system=/i.test(value)) {
    value = value.replace(/<body([^>]*)>/i, `<body$1 data-slide-system="${escapeHtml(designSystem.id || 'entrelacos')}">`);
  }

  return value;
}

function buildFallbackHtml(deck, designSystem) {
  const slides = Array.isArray(deck.slides) && deck.slides.length > 0
    ? deck.slides
    : [{ number: 1, title: deck.title || 'Deck gerado', body: [deck.markdown || 'Conteudo gerado.'] }];

  const slideHtml = slides.map((slide, index) => {
    const body = Array.isArray(slide.body) ? slide.body : [slide.body].filter(Boolean);
    const layout = ['hero', 'contrast', 'mechanism', 'proof', 'timeline', 'cta'][index % 6];
    return `<section class="slide ${layout}${index === 0 ? ' active' : ''}" data-slide="${index + 1}">
      <p class="kicker">${escapeHtml(slide.function || `Slide ${index + 1}`)}</p>
      <h1>${escapeHtml(slide.title || `Slide ${index + 1}`)}</h1>
      <div class="content">${body.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>
      <aside class="notes">${escapeHtml(slide.speakerNotes || 'Use este slide como ponto de virada narrativo.')}</aside>
    </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(deck.title || 'Deck gerado')}</title>
<style>
:root{--paper:#f6f1e8;--paper2:#fffaf2;--ink:#171612;--wine:#792941;--muted:#6f685f;--line:#d8cfc2;--accent:#596a3d}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font-family:Segoe UI,system-ui,sans-serif;overflow:hidden}.deck{width:min(1280px,100vw);aspect-ratio:16/9;position:relative;background:linear-gradient(135deg,var(--paper2),#efe5d7);box-shadow:0 24px 80px rgba(0,0,0,.2);overflow:hidden}.deck:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(23,22,18,.05) 1px,transparent 1px),linear-gradient(180deg,rgba(23,22,18,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none}.slide{position:absolute;inset:0;display:grid;align-content:center;gap:1.35rem;padding:6.2vw;opacity:0;transform:translateY(12px);transition:opacity .28s ease,transform .28s ease}.slide.active{opacity:1;transform:translateY(0);z-index:2}.kicker{text-transform:uppercase;letter-spacing:.09em;color:var(--wine);font-weight:850}.slide h1{font-family:Georgia,serif;font-size:clamp(2.5rem,5vw,5.2rem);line-height:1;max-width:920px;margin:0}.content{display:grid;gap:.9rem;max-width:780px;font-size:clamp(1rem,1.55vw,1.42rem);line-height:1.42}.content p{margin:0}.notes{position:absolute;left:6.2vw;right:6.2vw;bottom:3vw;color:var(--muted);font-size:.88rem}.contrast .content{grid-template-columns:1fr 1fr;max-width:980px}.mechanism .content,.proof .content{grid-template-columns:repeat(2,minmax(0,1fr));max-width:980px}.mechanism .content p,.proof .content p{border:1px solid var(--line);border-radius:8px;padding:.9rem;background:rgba(255,250,242,.72)}.timeline .content p{border-left:4px solid var(--wine);padding-left:1rem}.cta{background:linear-gradient(135deg,var(--ink),#302a22);color:var(--paper2)}.cta .kicker,.cta .notes{color:#d7cdf2}.progress{position:fixed;top:0;left:0;height:5px;background:var(--wine);width:0;transition:width .2s ease;z-index:5}.counter{position:fixed;right:22px;bottom:22px;color:var(--muted);font-weight:800}.nav{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:8px;z-index:6}.nav button{border:0;border-radius:8px;padding:10px 14px;background:var(--ink);color:var(--paper);font-weight:800;cursor:pointer}
</style>
</head>
<body data-slide-system="${escapeHtml(designSystem.id || 'entrelacos')}">
<div class="progress" id="progress"></div>
<main class="deck">${slideHtml}</main>
<div class="counter" id="counter"></div>
<div class="nav"><button id="prev">Anterior</button><button id="next">Proximo</button></div>
<script>
const slides=[...document.querySelectorAll('.slide')];let i=0;
function show(n){slides[i].classList.remove('active');i=(n+slides.length)%slides.length;slides[i].classList.add('active');document.getElementById('progress').style.width=((i+1)/slides.length*100)+'%';document.getElementById('counter').textContent=(i+1)+' / '+slides.length}
document.getElementById('prev').onclick=()=>show(i-1);document.getElementById('next').onclick=()=>show(i+1);
addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1)});
show(0);
</script>
</body>
</html>`;
}

function inferSlideCount(briefing) {
  const match = String(briefing).match(/(\d{1,2})\s*slides?/i);
  if (!match) return 6;
  return Math.min(Math.max(Number(match[1]), 2), 18);
}

function buildLocalDeck(briefing, designSystem, reason) {
  const count = inferSlideCount(briefing);
  const baseSlides = [
    {
      function: 'hook',
      title: 'A pergunta que precisa abrir a conversa',
      body: [
        'O problema nao e falta de esforco: e falta de estrutura para sustentar a pratica.',
        'Antes de oferecer respostas, o deck nomeia a tensao central do publico.',
      ],
    },
    {
      function: 'diagnostico',
      title: 'O sintoma visivel esconde uma engrenagem',
      body: [
        'Trabalho intenso sem previsibilidade produz culpa, exaustao e decisao reativa.',
        'A leitura muda quando a dor deixa de parecer falha individual.',
      ],
    },
    {
      function: 'reframe',
      title: 'Estrutura tambem e cuidado',
      body: [
        'Organizar carreira, agenda e comunicacao protege a qualidade da escuta.',
        'Sustentabilidade nao diminui a etica: da condicao para ela durar.',
      ],
    },
    {
      function: 'mecanismo',
      title: 'O caminho passa por criterio',
      body: [
        'Defina publico, promessa, limites, formato e proximo passo antes da peca final.',
        'Um deck forte conduz percepcao: nao empilha topicos.',
      ],
    },
    {
      function: 'plano',
      title: 'Da lucidez para a acao',
      body: [
        'Transforme o diagnostico em decisao: o que revisar, priorizar e sustentar.',
        'Cada slide deve abrir uma ponte para o movimento seguinte.',
      ],
    },
    {
      function: 'cta',
      title: 'Reposicionar e uma pratica, nao um evento',
      body: [
        'O convite final precisa ser concreto, proporcional e coerente com a promessa.',
        'A audiencia sai com uma direcao clara para continuar.',
      ],
    },
  ];

  const slides = Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    ...baseSlides[index % baseSlides.length],
    speakerNotes: index === 0
      ? `Briefing usado como base: ${String(briefing).slice(0, 280)}`
      : 'Aprofunde com exemplo real do contexto da audiencia.',
  }));

  const markdown = [
    reason ? `> Observacao: usei o gerador local porque ${reason}.` : '',
    `## Selecao de templates\n\n- **Design-system base:** ${designSystem.name}\n- **Referencias visuais:** ${designSystem.references || 'templates carregados'}\n- **Roteiro-template:** reframe -> tension -> mechanism -> plan -> CTA\n- **Slide-structures:** hero, contrast, mechanism-map, proof-cards, timeline, CTA\n- **Visual-template:** identidade ${designSystem.id || 'entrelacos'} com progresso, transicoes discretas, notas e layouts variados\n- **QA rapido:** narrativa com funcoes distintas, densidade controlada, titulos de acao e HTML navegavel`,
    ...slides.map((slide) => {
      const body = slide.body.map((item) => `- ${item}`).join('\n');
      return `## Slide ${slide.number} - ${slide.title}\n\n**Funcao:** ${slide.function}\n\n${body}\n\n**Notas:** ${slide.speakerNotes}`;
    }),
  ].filter(Boolean).join('\n\n---\n\n');

  const deck = {
    title: 'Deck estruturado',
    designSystem: designSystem.name,
    markdown,
    slides,
  };
  deck.html = applyDesignSystemIdentity(stabilizeHtml(buildFallbackHtml(deck, designSystem)), designSystem);
  return deck;
}

function normalizeDeck(raw, designSystem) {
  const deck = extractJson(raw);
  if (!deck || typeof deck !== 'object') {
    throw new Error('Claude returned an invalid deck package.');
  }
  if (!deck.markdown && Array.isArray(deck.slides)) {
    deck.markdown = deck.slides.map((slide) => {
      const body = Array.isArray(slide.body) ? slide.body.map((item) => `- ${item}`).join('\n') : String(slide.body || '');
      return `## Slide ${slide.number || ''} - ${slide.title || ''}\n\n${body}`;
    }).join('\n\n---\n\n');
  }
  if (!deck.html || !String(deck.html).includes('<section')) {
    deck.html = buildFallbackHtml(deck, designSystem);
  }
  deck.html = applyDesignSystemIdentity(stabilizeHtml(deck.html), designSystem);
  return {
    title: deck.title || 'Deck gerado',
    designSystem: deck.designSystem || designSystem.name,
    markdown: deck.markdown || '',
    slides: Array.isArray(deck.slides) ? deck.slides : [],
    html: deck.html,
  };
}

async function generateDeck(briefing, skillContent, options = {}) {
  const designSystem = getDesignSystem(options.designSystem);
  const fullPrompt = buildPrompt(briefing, skillContent, designSystem);
  const model = process.env.CLAUDE_MODEL || 'sonnet';
  const timeoutMs = Number(process.env.CLAUDE_TIMEOUT_MS || 600000);

  try {
    const result = await new Promise((resolve, reject) => {
      const child = execFile('claude', ['--print', '--output-format', 'text', '--model', model], {
        encoding: 'utf8',
        timeout: timeoutMs,
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
          return;
        }
        resolve(stdout);
      });
      child.stdin.end(fullPrompt);
    });
    return normalizeDeck(result, designSystem);
  } catch (error) {
    const output = [error.stderr, error.stdout, error.message]
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean)
      .join('\n');

    if (output.includes("You've hit your session limit")) {
      return buildLocalDeck(briefing, designSystem, 'o Claude CLI atingiu o limite temporario de sessao');
    }

    if (error.code === 'ETIMEDOUT' || error.killed || error.signal === 'SIGTERM' || output.includes('ETIMEDOUT')) {
      return buildLocalDeck(briefing, designSystem, `o Claude CLI ultrapassou ${Math.round(timeoutMs / 1000)} segundos`);
    }

    throw new Error(`Failed to generate deck via Claude CLI: ${output || 'unknown error'}`);
  }
}

module.exports = { DESIGN_SYSTEMS, generateDeck };
