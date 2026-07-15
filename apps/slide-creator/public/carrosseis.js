'use strict';

/* global document */

const grid = document.getElementById('history-grid');
const emptyState = document.getElementById('history-empty');
const errorBox = document.getElementById('history-error');
const searchInput = document.getElementById('history-search');
const totalItems = document.getElementById('total-items');
const totalSlides = document.getElementById('total-slides');
const generatedItems = document.getElementById('generated-items');
const historyUpdated = document.getElementById('history-updated');
const historySource = document.getElementById('history-source');

let items = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function statusLabel(status) {
  return {
    draft: 'Rascunho',
    approved: 'Aprovado',
    generated: 'Gerado',
    'legacy-import': 'Legado',
  }[status] || status || 'Sem status';
}

function normalizeSearch(item) {
  return [
    item.title,
    item.theme,
    item.status,
    item.createdAt,
    item.updatedAt,
    ...(item.tags || []),
  ]
    .join(' ')
    .toLowerCase();
}

function renderCards(nextItems) {
  grid.innerHTML = '';
  emptyState.classList.toggle('hidden', nextItems.length > 0);

  nextItems.forEach((item) => {
    const tags = (item.tags || [])
      .slice(0, 4)
      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
      .join('');
    const historyPath = item.historyPath || `/slides/carrosseis/history/${item.id}/`;
    const cover = item.coverImage
      ? `<img src="${escapeHtml(item.coverImage)}" alt="Miniatura de ${escapeHtml(item.title)}" loading="lazy">`
      : '<div class="cover-placeholder">Sem capa</div>';

    const article = document.createElement('article');
    article.className = 'history-card';
    article.innerHTML = `
      <a class="cover-link" href="${escapeHtml(item.coverImage || historyPath)}" aria-label="Abrir ${escapeHtml(item.title)}">
        ${cover}
      </a>
      <div class="card-body">
        <div class="card-meta">
          <span>${escapeHtml(formatDate(item.updatedAt || item.createdAt))}</span>
          <span>${escapeHtml(statusLabel(item.status))}</span>
        </div>
        <h2>${escapeHtml(item.title || item.id)}</h2>
        <p>${escapeHtml(item.theme || 'Tema nao informado')}</p>
        <div class="tag-row">${tags}</div>
        <div class="card-footer">
          <span>${Number(item.slideCount) || 0} imagem(ns)</span>
          <div class="file-links">
            <a href="${escapeHtml(historyPath)}brief.md">Brief</a>
            <a href="${escapeHtml(historyPath)}prompts.md">Prompts</a>
            <a href="${escapeHtml(historyPath)}manifest.json">Manifesto</a>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(article);
  });
}

function applyFilter() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = query ? items.filter((item) => normalizeSearch(item).includes(query)) : items;
  renderCards(filtered);
}

async function loadHistory() {
  try {
    const response = await fetch('/slides/api/carousels/history');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao carregar histórico');

    items = Array.isArray(data.items) ? data.items : [];
    totalItems.textContent = data.stats?.totalItems ?? items.length;
    totalSlides.textContent = data.stats?.totalSlides ?? 0;
    generatedItems.textContent = data.stats?.generatedItems ?? 0;
    historyUpdated.textContent = data.updatedAt
      ? `Atualizado em ${formatDate(data.updatedAt)}`
      : 'Histórico ainda sem atualização';
    historySource.textContent = data.source?.available
      ? 'Fonte conectada ao acervo oficial.'
      : 'Fonte ainda nao encontrada no servidor.';

    renderCards(items);
  } catch (error) {
    errorBox.textContent = error.message || 'Nao foi possivel carregar o histórico de carrosséis.';
    errorBox.classList.remove('hidden');
    emptyState.classList.remove('hidden');
  }
}

searchInput.addEventListener('input', applyFilter);
loadHistory();
