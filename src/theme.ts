import { ThemePref } from './types';

const KEY = 'rawpilot-theme';

export function resolveTheme(pref: ThemePref): 'dark' | 'light' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return pref;
}

export function applyTheme(pref: ThemePref) {
  const resolved = resolveTheme(pref);
  document.documentElement.dataset.theme = resolved;
  try {
    localStorage.setItem(KEY, pref);
  } catch (e) {
    /* stockage indisponible : sans conséquence */
  }
  window.rawpilot.app.applyTheme({ resolved }).catch(() => {});
}

// Appliqué avant le premier affichage pour éviter un flash de mauvais thème.
export function initThemeFromCache() {
  let pref: ThemePref = 'dark';
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') pref = v;
  } catch (e) {
    /* ignore */
  }
  document.documentElement.dataset.theme = resolveTheme(pref);
}
