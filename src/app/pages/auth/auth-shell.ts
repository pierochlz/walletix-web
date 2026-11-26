import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LanguageMenu } from '../../shared/language-menu';
import { ThemeMenu } from '../../shared/theme-menu';

// Frame for the public pages (login, register): logo, language switch, content and footer
@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe, LanguageMenu, ThemeMenu],
  template: `
    <a class="skip-link" href="#main">{{ 'app.skip' | t }}</a>
    <header class="auth-top">
      <a routerLink="/" class="brand" aria-label="Walletix">
        <mat-icon aria-hidden="true">account_balance_wallet</mat-icon> Walletix
      </a>
      <div class="auth-actions">
        <app-theme-menu />
        <app-language-menu />
      </div>
    </header>
    <main id="main" class="auth-main" tabindex="-1">
      <ng-content />
    </main>
    <footer class="app-footer">
      <span>© {{ year }} {{ 'app.rights' | t }}</span>
      <a routerLink="/terms">{{ 'app.terms' | t }}</a>
    </footer>
  `,
  styleUrl: './auth.css',
})
export class AuthShell {
  readonly year = new Date().getFullYear();
}
