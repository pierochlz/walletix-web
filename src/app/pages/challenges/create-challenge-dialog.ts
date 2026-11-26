import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { maxTwoDecimals } from '../../core/validators';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { apiErrorMessage } from '../../core/api-error';
import { CHALLENGE_TYPES, challengeIcon } from '../../core/challenges';
import { ChallengesService } from '../../core/challenges.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

// US29: "Crear nuevo reto": type, duration and savings goal (same limits as the API)
@Component({
  selector: 'app-create-challenge-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'challenges.create' | t }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="form">
        <p class="hint">{{ 'challenges.createHint' | t }}</p>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'challenges.type' | t }}</mat-label>
          <mat-select formControlName="tipo" required>
            @for (type of types; track type) {
              <mat-option [value]="type"><mat-icon aria-hidden="true">{{ icon(type) }}</mat-icon>{{ 'challengeType.' + type | t }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'challenges.titleOptional' | t }}</mat-label>
          <input matInput formControlName="titulo" maxlength="30" [placeholder]="'challengeType.' + form.value.tipo | t" />
          <mat-hint align="end">{{ form.value.titulo?.length ?? 0 }}/30</mat-hint>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'challenges.duration' | t }}</mat-label>
            <input matInput type="number" formControlName="duracionDias" min="1" max="90" required />
            <span matTextSuffix>{{ 'challenges.days' | t }}</span>
            <mat-error>{{ 'challenges.durationError' | t }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'challenges.goal' | t }}</mat-label>
            <input matInput type="number" formControlName="montoObjetivo" min="0.01" max="1000000" step="any" required />
            <mat-error>{{ 'challenges.goalError' | t }}</mat-error>
          </mat-form-field>
        </div>

        @if (error()) {
          <p class="api-error" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      @if (saving()) {
        <mat-progress-bar mode="indeterminate" [attr.aria-label]="'app.loading' | t" />
      }
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>{{ 'form.cancel' | t }}</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ 'challenges.createButton' | t }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .form { display: grid; gap: 4px; min-width: min(460px, 80vw); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .hint { margin: 0 0 12px; color: var(--mat-sys-on-surface-variant); }
    mat-option mat-icon { margin-right: 8px; }
    .api-error { margin: 0; padding: 10px 12px; border-radius: 8px; background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    @media (max-width: 480px) { .row { grid-template-columns: 1fr; } }
  `,
})
export class CreateChallengeDialog {
  private dialogRef = inject(MatDialogRef<CreateChallengeDialog>);
  private service = inject(ChallengesService);
  private i18n = inject(I18nService);

  readonly types = CHALLENGE_TYPES;
  readonly icon = challengeIcon;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    tipo: ['sin_delivery', Validators.required],
    titulo: ['', Validators.maxLength(30)],
    duracionDias: [7, [Validators.required, Validators.min(1), Validators.max(90)]],
    montoObjetivo: [70, [Validators.required, Validators.min(0.01), Validators.max(1_000_000), maxTwoDecimals]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.service
      .createPersonal({
        tipo: value.tipo!,
        titulo: value.titulo?.trim() || null, // empty: the API uses the name of the type
        duracionDias: Number(value.duracionDias),
        montoObjetivo: Number(value.montoObjetivo),
      })
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (err) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(err, this.i18n.t('form.error')));
        },
      });
  }
}
