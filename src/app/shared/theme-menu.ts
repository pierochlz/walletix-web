import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { THEMES, themeIcon, ThemeService } from '../core/theme.service';

// US37: quick switch between light, dark and system theme (next to the language button)
@Component({
  selector: 'app-theme-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu" [matTooltip]="'theme.title' | t"
            [attr.aria-label]="('theme.title' | t) + ': ' + ('theme.' + themes.theme() | t)">
      <mat-icon aria-hidden="true">{{ icon(themes.theme()) }}</mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      @for (option of options; track option) {
        <button mat-menu-item (click)="themes.setTheme(option)" [attr.aria-current]="themes.theme() === option">
          <mat-icon aria-hidden="true">{{ icon(option) }}</mat-icon>{{ 'theme.' + option | t }}
        </button>
      }
    </mat-menu>
  `,
})
export class ThemeMenu {
  readonly themes = inject(ThemeService);
  readonly options = THEMES;
  readonly icon = themeIcon;
}
