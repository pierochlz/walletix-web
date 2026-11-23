import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '../core/i18n/translate.pipe';

// "Are you sure?" dialog. Closes with true when the user confirms.
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'form.confirmTitle' | t }}</h2>
    <mat-dialog-content>
      <p>{{ 'form.confirmText' | t }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" cdkFocusInitial>{{ 'form.no' | t }}</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true">{{ 'form.yes' | t }}</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {}
