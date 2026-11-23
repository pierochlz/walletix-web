import { HttpErrorResponse } from '@angular/common/http';

// The API answers errors as plain text ("El monto debe ser mayor que cero").
// This function gets a readable message from any HTTP error.
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return fallback;
    if (typeof error.error === 'string' && error.error.trim() !== '') return error.error;
    // GlobalExceptionHandler answers JSON: { "error": "mensaje" }
    if (typeof error.error?.error === 'string') return error.error.error;
  }
  return fallback;
}
