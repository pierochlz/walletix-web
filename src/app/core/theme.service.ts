import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';
export const THEMES: Theme[] = ['light', 'dark', 'auto'];
const THEME_KEY = 'walletix_theme';

// US37: light, dark or "system" theme. Angular Material builds its colors with light-dark(),
// so changing color-scheme on <html> switches the whole app (including dialogs and menus).
// index.html applies the saved theme before Angular starts, so the page does not flash in light.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  readonly theme = signal<Theme>(readTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme;
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // private window or blocked storage: the theme still applies until the page is closed
      }
    });
  }

  setTheme(theme: Theme): void {
    if (THEMES.includes(theme)) this.theme.set(theme);
  }
}

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved as Theme) ? (saved as Theme) : 'light';
  } catch {
    return 'light';
  }
}

export function themeIcon(theme: Theme): string {
  return theme === 'dark' ? 'dark_mode' : theme === 'auto' ? 'brightness_auto' : 'light_mode';
}
