'use strict';

/* global document, window, navigator, Blob */

const form = document.getElementById('slide-form');
const briefingInput = document.getElementById('briefing');
const designSystemInput = document.getElementById('design-system');
const briefingCount = document.getElementById('briefing-count');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultContent = document.getElementById('result-content');
const htmlPreview = document.getElementById('html-preview');
const errorDiv = document.getElementById('error');
const copyBtn = document.getElementById('copy-btn');
const openHtmlBtn = document.getElementById('open-html-btn');
const downloadHtmlBtn = document.getElementById('download-html-btn');
const statusPill = document.getElementById('status-pill');

const templates = {
  masterclass:
    'Masterclass para psicologas sobre captacao etica e previsibilidade de agenda. Objetivo: mostrar que autonomia pode ser construida com estrutura, sem ferir a etica. Publico: psicologas que trabalham muito e constroem pouco. Tom: profundo, estrategico, acolhedor e firme. Formato: 12 slides com abertura forte, desenvolvimento conceitual, exemplos praticos e fechamento com convite para reposicionamento.',
  aula:
    'Aula educativa para psicologas sobre precificacao com consciencia. Objetivo: explicar por que cobrar melhor nao anula compromisso clinico. Publico: profissionais em transicao de carreira ou inicio de consultorio. Tom: didatico, lucido e sem promessas rasas. Formato: 10 slides com conceitos, erros comuns, criterios de decisao e encaminhamento pratico.',
  mentoria:
    'Encontro de mentoria para psicologas que querem sair da dependencia de indicacoes, convenios e plataformas. Objetivo: organizar prioridades de carreira e construir uma pratica mais autoral. Publico: psicologas entre 27 e 42 anos. Tom: humano, direto e estrategico. Formato: 14 slides com diagnostico, mapa de decisao, exercicios e proximos passos.',
};

let lastMarkdown = '';
let lastHtml = '';

async function loadDesignSystems() {
  try {
    const response = await fetch('/slides/api/slides/design-systems');
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.designSystems)) return;

    designSystemInput.innerHTML = data.designSystems
      .map((system) => `<option value="${system.id}">${system.name}</option>`)
      .join('');
  } catch {
    // Keep the inline fallback options when the API is unavailable.
  }
}

function setStatus(text, active = false) {
  statusPill.lastChild.textContent = ` ${text}`;
  statusPill.classList.toggle('is-active', active);
}

function updateCount() {
  const total = briefingInput.value.trim().length;
  briefingCount.textContent = `${total} ${total === 1 ? 'caractere' : 'caracteres'}`;
}

function showLoading() {
  loading.classList.remove('hidden');
  result.classList.add('hidden');
  errorDiv.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Gerando...';
  setStatus('Gerando deck', true);
}

function hideLoading() {
  loading.classList.add('hidden');
  submitBtn.disabled = false;
  submitBtn.querySelector('span').textContent = 'Gerar deck';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDeck(jobId) {
  for (;;) {
    await wait(3000);
    const response = await fetch(`/slides/api/slides/jobs/${jobId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao consultar geracao');
    }
    if (data.status === 'completed') return data;
    if (data.status === 'failed') {
      throw new Error(data.error || 'Erro ao gerar deck');
    }
    setStatus(data.status === 'running' ? 'Gerando HTML' : 'Na fila', true);
  }
}

function showResult(deck) {
  lastMarkdown = deck.markdown || '';
  lastHtml = deck.html || '';
  const parse = window.marked?.parse || ((value) => value);
  resultContent.innerHTML = parse(lastMarkdown);
  htmlPreview.srcdoc = lastHtml;
  result.classList.remove('hidden');
  setStatus('HTML gerado', false);
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
  const fallback = 'Nao foi possivel gerar o deck agora.';
  if (message?.includes('Claude CLI session limit reached')) {
    errorDiv.textContent = 'O Claude atingiu o limite temporario de sessao. Aguarde o horario de reset indicado e tente gerar o deck novamente.';
  } else if (message?.includes('Claude CLI timed out')) {
    errorDiv.textContent = 'A geracao demorou mais que o limite configurado. Tente pedir menos slides ou um briefing mais objetivo.';
  } else {
    errorDiv.textContent = message || fallback;
  }
  errorDiv.classList.remove('hidden');
  setStatus('Erro na geracao', false);
}

document.querySelectorAll('[data-template]').forEach((button) => {
  button.addEventListener('click', () => {
    const template = templates[button.dataset.template];
    briefingInput.value = template;
    briefingInput.focus();
    updateCount();
  });
});

briefingInput.addEventListener('input', updateCount);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const briefing = briefingInput.value.trim();
  if (!briefing) return;

  showLoading();

  try {
    const response = await fetch('/slides/api/slides/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefing,
        designSystem: designSystemInput.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao gerar deck');
    }

    const completed = data.jobId ? await waitForDeck(data.jobId) : data;
    showResult(completed.deck || { markdown: completed.result, html: '' });
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(lastMarkdown).then(() => {
    copyBtn.textContent = 'Markdown copiado';
    setTimeout(() => {
      copyBtn.textContent = 'Copiar markdown';
    }, 2000);
  });
});

openHtmlBtn.addEventListener('click', () => {
  if (!lastHtml) return;
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;
  win.document.open();
  win.document.write(lastHtml);
  win.document.close();
});

downloadHtmlBtn.addEventListener('click', () => {
  if (!lastHtml) return;
  const blob = new Blob([lastHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'deck-slide-creator.html';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

updateCount();
loadDesignSystems();
