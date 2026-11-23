import { computed, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { EN_US } from './en-us';
import { ES_419 } from './es-419';

export type Lang = 'en' | 'es';

const LANG_KEY = 'walletix_lang';
const DICTIONARIES: Record<Lang, Record<string, string>> = { en: EN_US, es: ES_419 };
const LOCALES: Record<Lang, string> = { en: 'en-US', es: 'es-419' };

// Internationalization: en-US and es-419 (Latin American Spanish).
// The language is a signal, so all texts change at once when the user switches it.
@Injectable({ providedIn: 'root' })
export class I18nService {
  private document = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.initialLang());
  readonly locale = computed(() => LOCALES[this.lang()]);

  constructor() {
    // Accessibility: <html lang="..."> tells screen readers which language to read
    effect(() => {
      this.document.documentElement.lang = this.locale();
      localStorage.setItem(LANG_KEY, this.lang());
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  // t('expenses.title') -> "Expenses" or "Gastos"; {name} is replaced with params.name
  t(key: string, params?: Record<string, string | number>): string {
    let text = DICTIONARIES[this.lang()][key] ?? DICTIONARIES.en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
  }

  private initialLang(): Lang {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'es') return saved;
    return navigator.language.startsWith('es') ? 'es' : 'en';
  }
}
