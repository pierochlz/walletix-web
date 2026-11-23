import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { AuthShell } from './auth/auth-shell';

// Public page linked from the footer of the app (and from the landing page)
@Component({
  selector: 'app-terms',
  imports: [MatCardModule, MatButtonModule, MatIconModule, TranslatePipe, AuthShell],
  template: `
    <app-auth-shell>
      <mat-card appearance="outlined" class="terms">
        <mat-card-header>
          <mat-card-title><h1>{{ 'terms.title' | t }}</h1></mat-card-title>
          <mat-card-subtitle>{{ 'terms.updated' | t }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @for (section of sections; track section) {
            <h2>{{ 'terms.' + section + '.title' | t }}</h2>
            <p>{{ 'terms.' + section + '.text' | t }}</p>
          }
        </mat-card-content>
        <mat-card-actions>
          <button mat-button (click)="back()">
            <mat-icon aria-hidden="true">arrow_back</mat-icon> {{ 'terms.back' | t }}
          </button>
        </mat-card-actions>
      </mat-card>
    </app-auth-shell>
  `,
  styles: `
    .terms { width: 100%; max-width: 760px; padding: 8px; }
    h1 { margin: 0; font: var(--mat-sys-headline-small); }
    h2 { font: var(--mat-sys-title-medium); margin: 20px 0 4px; }
    p { line-height: 1.6; margin: 0; }
  `,
})
export class TermsPage {
  private location = inject(Location);
  readonly sections = ['s1', 's2', 's3', 's4', 's5', 's6'];

  back(): void {
    this.location.back();
  }
}
