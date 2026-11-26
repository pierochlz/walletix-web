import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

export interface MessageDialogData {
  icon: string;
  title: string; // i18n keys
  text: string;
  textParams?: Record<string, string | number>;
  accept: string;
  cancel?: string; // with cancel: it asks for confirmation and closes with true / false
  tone?: 'warning' | 'success' | 'danger';
}

// Small dialog of the challenges center. E.g. "Ya registraste tu progreso de hoy" -> "Entendido" (user flow of the report)
@Component({
  selector: 'app-message-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="head" [class]="data.tone ?? 'warning'">
      <mat-icon aria-hidden="true">{{ data.icon }}</mat-icon>
      <h2 mat-dialog-title>{{ data.title | t }}</h2>
    </div>
    <mat-dialog-content><p>{{ data.text | t: data.textParams }}</p></mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (data.cancel) {
        <button mat-button [mat-dialog-close]="false" cdkFocusInitial>{{ data.cancel | t }}</button>
      }
      <button mat-flat-button [class.danger]="data.tone === 'danger'" [mat-dialog-close]="true">{{ data.accept | t }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .head { display: flex; align-items: center; gap: 8px; padding: 20px 24px 0; }
    .head h2 { padding: 0; margin: 0; }
    .head.warning mat-icon { color: var(--wx-warning); }
    .head.success mat-icon { color: var(--wx-success); }
    .head.danger mat-icon { color: var(--mat-sys-error); }
  `,
})
export class MessageDialog {
  readonly data = inject<MessageDialogData>(MAT_DIALOG_DATA);
}
