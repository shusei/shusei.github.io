export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export const createEl = (tag, options = {}) => {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text) el.textContent = options.text;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, value);
      }
    });
  }
  return el;
};

export const safeNumber = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : NaN;
};

export const formatRatio = (value, digits = 2) => {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(digits);
};

export const formatBadge = (label, state) => {
  const span = createEl('span', { className: 'badge', text: label });
  if (state) span.dataset.state = state;
  return span;
};

export const setAriaPressed = (el, pressed) => {
  el.setAttribute('aria-pressed', String(Boolean(pressed)));
};

export const updateTitle = (title) => {
  if (document.title !== title) {
    document.title = title;
  }
};

export const focusMain = () => {
  const main = qs('#main');
  if (main) main.focus({ preventScroll: false });
};
