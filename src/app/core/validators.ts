import { AbstractControl, ValidationErrors } from '@angular/forms';

// Soles and cents: at most 2 decimals. Same rule as the API: with 10.555 the expense was saved
// as 10.56 while the balance subtracted 10.555 (1 cent of difference).
export function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  return /^-?\d+(\.\d{1,2})?$/.test(text) ? null : { cents: true };
}
