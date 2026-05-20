'use strict';

const form = document.getElementById('slide-form');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultContent = document.getElementById('result-content');
const errorDiv = document.getElementById('error');
const copyBtn = document.getElementById('copy-btn');

let lastMarkdown = '';

function showLoading() {
  loading.classList.remove('hidden');
  result.classList.add('hidden');
  errorDiv.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Gerando...';
}

function hideLoading() {
  loading.classList.add('hidden');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Gerar Deck';
}

function showResult(markdown) {
  lastMarkdown = markdown;
  resultContent.innerHTML = marked.parse(markdown);
  result.classList.remove('hidden');
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const briefing = document.getElementById('briefing').value.trim();
  if (!briefing) return;

  showLoading();

  try {
    const response = await fetch('/api/slides/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefing }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao gerar deck');
    }

    showResult(data.result);
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(lastMarkdown).then(() => {
    copyBtn.textContent = 'Copiado!';
    setTimeout(() => { copyBtn.textContent = 'Copiar Markdown'; }, 2000);
  });
});
