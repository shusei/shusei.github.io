import { qs, setAriaPressed, updateTitle } from './dom.js';

const STORAGE_KEY = 'mlife-stealth';
const STEALTH_TITLE = '研究備忘錄';
const NORMAL_TITLE = '美麗人生｜2025 筆記';

function setStealthMode(enabled) {
  const body = document.body;
  body.classList.toggle('is-stealth', enabled);
  document.documentElement.dataset.stealth = enabled ? 'on' : 'off';
  setAriaPressed(qs('[data-stealth-toggle]'), enabled);
  updateTitle(enabled ? STEALTH_TITLE : NORMAL_TITLE);
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

function getStoredStealth() {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === null) return true;
  return value === '1';
}

function initStealth() {
  const toggle = qs('[data-stealth-toggle]');
  if (!toggle) return;
  let current = getStoredStealth();
  setStealthMode(current);

  toggle.addEventListener('click', () => {
    current = !current;
    setStealthMode(current);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && event.shiftKey) {
      event.preventDefault();
      current = !current;
      setStealthMode(current);
    }
  });
}

function initIntro() {
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    const intro = qs('[data-intro]');
    if (intro) {
      requestAnimationFrame(() => {
        intro.setAttribute('data-intro', 'hidden');
      });
    }
  });
}

function smoothScrollTo(target) {
  if (!target) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
}

function initViewTransitions() {
  const supportsViewTransition = typeof document.startViewTransition === 'function';
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (!id || id === '#') return;
    const target = qs(id);
    if (!target) return;
    event.preventDefault();
    if (!supportsViewTransition) {
      smoothScrollTo(target);
      history.pushState(null, '', id);
      return;
    }
    document.startViewTransition(() => {
      smoothScrollTo(target);
      history.pushState(null, '', id);
    });
  });
}

function initNavFocus() {
  const nav = qs('[data-nav]');
  if (!nav) return;
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      nav.classList.add('nav-focus');
    }
  });
  nav.addEventListener('focusout', () => {
    nav.classList.remove('nav-focus');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStealth();
  initIntro();
  initViewTransitions();
  initNavFocus();
});
