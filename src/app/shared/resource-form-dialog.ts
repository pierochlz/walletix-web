import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { apiErrorMessage } from '../core/api-error';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { FieldDef, ResourceConfig } from './resource-config';

export interface ResourceFormData {
  config: ResourceConfig;
  item: Record<string, any> | null; // null = new record
}

// Dialog with a reactive form built from the field definitions of the page
@Component({
  selector: 'app-resource-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './resource-form-dialog.html',
  styleUrl: './resource-form-dialog.css',
})
export class ResourceFormDialog {
  private dialogRef = inject(MatDialogRef<ResourceFormDialog>);
  private i18n = inject(I18nService);
  readonly data = inject<ResourceFormData>(MAT_DIALOG_DATA);

  readonly fields = this.data.config.fields.filter((f) => f.inForm !== false);
  readonly isEdit = this.data.item !== null;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.buildForm();

  // One FormControl per field, with its validators
  private buildForm(): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of this.fields) {
      const validators: ValidatorFn[] = [];
      if (field.required) validators.push(field.type === 'checkbox' ? Validators.requiredTrue : Validators.required);
      if (field.min !== undefined) validators.push(Validators.min(field.min));
      if (field.max !== undefined) validators.push(Validators.max(field.max));
      if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
      if (field.pattern) validators.push(Validators.pattern(field.pattern));
      const initial = this.data.item?.[field.key] ?? (field.type === 'checkbox' ? false : null);
      controls[field.key] = new FormControl(initial, validators);
    }
    return new FormGroup(controls);
  }

  errorFor(field: FieldDef): string {
    const control = this.form.get(field.key);
    if (!control?.errors) return '';
    if (control.errors['required']) return this.i18n.t('form.required');
    if (control.errors['min']) return this.i18n.t('form.min', { min: field.min ?? 0 });
    if (control.errors['max']) return this.i18n.t('form.pattern');
    return this.i18n.t('form.pattern');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { config, item } = this.data;
    // Final body = previous record (when editing) + defaults (idUsuario) + form values
    const body = { ...(item ?? {}), ...(config.defaults?.() ?? {}), ...this.form.getRawValue() };
    const request: Observable<unknown> = this.isEdit ? config.service.update(body) : config.service.create(body);

    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      // The page receives the API response (for example, a budget alert)
      next: (response) => this.dialogRef.close({ response }),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, this.i18n.t('form.error')));
      },
    });
  }
}
