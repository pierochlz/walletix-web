import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('returns the plain text message sent by the API', () => {
    const error = new HttpErrorResponse({ status: 400, error: 'El monto debe ser mayor que cero' });
    expect(apiErrorMessage(error, 'fallback')).toBe('El monto debe ser mayor que cero');
  });

  it('reads the JSON { error } body of GlobalExceptionHandler', () => {
    const error = new HttpErrorResponse({ status: 403, error: { error: 'No tiene permiso para realizar esta acción' } });
    expect(apiErrorMessage(error, 'fallback')).toBe('No tiene permiso para realizar esta acción');
  });

  it('uses the fallback when the server could not be reached', () => {
    const error = new HttpErrorResponse({ status: 0, error: 'anything' });
    expect(apiErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('uses the fallback when the body is empty', () => {
    const error = new HttpErrorResponse({ status: 500, error: null });
    expect(apiErrorMessage(error, 'fallback')).toBe('fallback');
  });
});
