import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { maxTwoDecimals } from '../core/validators';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { apiErrorMessage } from '../core/api-error';
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryIcon } from '../core/category-icons';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { FieldDef, ResourceConfig } from './resource-config';

export interface ResourceFormData {
  config: ResourceConfig;
  item: Record<string, any> | null; // null = new record
  initial?: Record<string, unknown>; // values already filled in a new record (e.g. the month of the budget view)
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
    MatIconModule,
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
  readonly icons = CATEGORY_ICONS;

  // Palette of the color fields. A record saved before with another color shows it too, first.
  paletteFor(value: unknown): { hex: string; name: string }[] {
    const current = typeof value === 'string' ? value.toUpperCase() : '';
    const known = CATEGORY_COLORS.some((c) => c.hex === current);
    return /^#[0-9A-F]{6}$/.test(current) && !known
      ? [{ hex: current, name: 'color.current' }, ...CATEGORY_COLORS]
      : CATEGORY_COLORS;
  }

  isChosen(value: unknown, hex: string): boolean {
    return typeof value === 'string' && value.toUpperCase() === hex;
  }
  // Color chosen in the same form (categories): the selected icon is shown with it
  readonly currentColor = () => {
    const color = this.form.get('colorHexCategoria')?.value;
    return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null;
  };

  constructor() {
    // When the user corrects the data, the API error of the previous attempt no longer applies
    this.form.valueChanges.subscribe(() => this.error.set(null));
  }

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
      // Amounts in soles: at most 2 decimals (cents)
      if (field.format === 'currency') validators.push(maxTwoDecimals);
      let initial = this.data.item?.[field.key] ?? this.data.initial?.[field.key] ?? (field.type === 'checkbox' ? false : null);
      // Old categories have an image URL: the gallery starts on the same generic icon the table shows
      if (field.type === 'icon') initial = categoryIcon(initial);
      controls[field.key] = new FormControl(initial, validators);
    }
    return new FormGroup(controls);
  }

  errorFor(field: FieldDef): string {
    const control = this.form.get(field.key);
    if (!control?.errors) return '';
    if (control.errors['required']) return this.i18n.t('form.required');
    if (control.errors['min']) return this.i18n.t('form.min', { min: this.limit(field, field.min) });
    if (control.errors['max']) return this.i18n.t('form.max', { max: this.limit(field, field.max) });
    if (control.errors['cents']) return this.i18n.t('form.cents');
    return this.i18n.t('form.pattern');
  }

  // Amounts with thousands separators ("1,000,000"); other numbers, like the year, as they are ("2031")
  private limit(field: FieldDef, value = 0): string {
    if (field.format !== 'currency') return String(value);
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 2 }).format(value);
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
      next: (response) => this.dialogRef.close({ response, body }),
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, this.i18n.t('form.error')));
      },
    });
  }
}
