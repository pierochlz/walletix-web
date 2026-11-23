import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { I18nService, Lang } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';

// Button to switch between English (en-US) and Spanish (es-419)
@Component({
  selector: 'app-language-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  template: `
    <button mat-button [matMenuTriggerFor]="menu" [attr.aria-label]="'app.language' | t">
      <mat-icon aria-hidden="true">translate</mat-icon>
      {{ i18n.lang() === 'es' ? 'ES' : 'EN' }}
    </button>
    <mat-menu #menu="matMenu">
      @for (option of languages; track option.code) {
        <button mat-menu-item (click)="i18n.setLang(option.code)" [attr.lang]="option.locale"
                [attr.aria-current]="i18n.lang() === option.code">
          {{ option.name }}
        </button>
      }
    </mat-menu>
  `,
})
export class LanguageMenu {
  readonly i18n = inject(I18nService);
  readonly languages: { code: Lang; locale: string; name: string }[] = [
    { code: 'en', locale: 'en-US', name: 'English (US)' },
    { code: 'es', locale: 'es-419', name: 'Español (Latinoamérica)' },
  ];
}
