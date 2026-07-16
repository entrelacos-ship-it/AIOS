const state = {
  theme: "dark",
  mode: "elevation",
  channel: "dashboard",
};

const channels = {
  dashboard: {
    name: "Dashboard premium",
    mode: "elevation",
    description:
      "Autoridade, contraste e energia controlada para interfaces premium e paginas de impacto.",
    note: "Dark mode como modo hero",
    title: "Posicionamento e Elevacao",
  },
  members: {
    name: "Area de membros",
    mode: "care",
    description:
      "Clareza, ordem e conforto cognitivo para jornadas recorrentes e conteudo guiado.",
    note: "Dark mode com respiracao e cuidado",
    title: "Acolhimento Estrategico",
  },
  lp: {
    name: "Landing page premium",
    mode: "elevation",
    description:
      "Headline forte, prova organizada e CTA disciplinado sustentando percepcao de valor.",
    note: "Dark ou hibrido com CTA concentrado",
    title: "Posicionamento e Elevacao",
  },
  slides: {
    name: "Slides premium",
    mode: "elevation",
    description:
      "Um conceito por slide, forte hierarquia tipografica e uso severo da cor.",
    note: "Dark mode prioritario para palco e keynote",
    title: "Posicionamento e Elevacao",
  },
  social: {
    name: "Social premium",
    mode: "care",
    description:
      "Poucos elementos, muito respiro e assinatura visual reconhecivel sem barulho.",
    note: "Light editorial para educacao, dark para posicionamento",
    title: "Acolhimento Estrategico",
  },
};

const elements = {
  body: document.body,
  root: document.documentElement,
  heroTitle: document.querySelector("#hero-title"),
  heroDescription: document.querySelector("#hero-description"),
  channelName: document.querySelector("#channel-name"),
  channelNote: document.querySelector("#channel-note"),
  themeButtons: document.querySelectorAll("[data-theme-option]"),
  modeButtons: document.querySelectorAll("[data-mode-option]"),
  channelSelect: document.querySelector("#channel-select"),
  tokenSurface: document.querySelector("#token-surface"),
  tokenText: document.querySelector("#token-text"),
  tokenAction: document.querySelector("#token-action"),
  tokenFocus: document.querySelector("#token-focus"),
  openModal: document.querySelector("#open-modal"),
  closeModal: document.querySelector("#close-modal"),
  modalBackdrop: document.querySelector("#modal-backdrop"),
};

function applyTheme() {
  elements.root.setAttribute("data-theme", state.theme);

  elements.themeButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.themeOption === state.theme,
    );
  });
}

function applyMode() {
  elements.body.classList.remove("mode-care", "mode-elevation");
  elements.body.classList.add(`mode-${state.mode}`);

  elements.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modeOption === state.mode);
  });
}

function cssVar(name) {
  return getComputedStyle(elements.root).getPropertyValue(name).trim();
}

function syncTokenPanel() {
  elements.tokenSurface.textContent = cssVar("--eds-color-surface-base");
  elements.tokenText.textContent = cssVar("--eds-color-text-primary");
  elements.tokenAction.textContent = cssVar("--eds-color-action-primary");
  elements.tokenFocus.textContent = cssVar("--eds-color-focus-ring");
}

function renderChannel() {
  const channel = channels[state.channel];
  state.mode = channel.mode;
  elements.heroTitle.textContent = channel.title;
  elements.heroDescription.textContent = channel.description;
  elements.channelName.textContent = channel.name;
  elements.channelNote.textContent = channel.note;
  elements.channelSelect.value = state.channel;
  applyMode();
}

function openModal() {
  elements.modalBackdrop.hidden = false;
}

function closeModal() {
  elements.modalBackdrop.hidden = true;
}

elements.themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.theme = button.dataset.themeOption;
    applyTheme();
    syncTokenPanel();
  });
});

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.modeOption;
    applyMode();
  });
});

elements.channelSelect.addEventListener("change", (event) => {
  state.channel = event.target.value;
  renderChannel();
});

elements.openModal.addEventListener("click", openModal);
elements.closeModal.addEventListener("click", closeModal);
elements.modalBackdrop.addEventListener("click", (event) => {
  if (event.target === elements.modalBackdrop) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

applyTheme();
renderChannel();
syncTokenPanel();
