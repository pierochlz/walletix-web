import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { localMonth } from '../../core/dates';
import { Dashboard } from './dashboard';

// Balance card (hero) of the redesign: the sentence under the balance summarizes the month
// (the tests run in English, the default language)
describe('Dashboard balance card', () => {
  const api = environment.apiUrl;
  const today = `${localMonth()}-10`;

  function render(expenses: unknown[], incomes: unknown[]) {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).user.set({ idUsuario: 7, nombreUsuario: 'Ana', saldoActualUsuario: 1500, puntosGamificacionUsuario: 0 } as never);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    http.expectOne(`${api}/gastos`).flush(expenses);
    http.expectOne(`${api}/ingresos`).flush(incomes);
    http.expectOne(`${api}/metas-ahorro`).flush([]);
    // Tip of the day (none), categories and merchants (empty), exchange rates (service down)
    http.match(() => true).forEach((req) => {
      if (req.request.url.includes('tip-del-dia')) req.flush(null);
      else if (req.request.url.startsWith(api)) req.flush([]);
      else req.flush('down', { status: 503, statusText: 'Unavailable' });
    });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('without movements this month it does not say "S/ 0.00 ahead"', () => {
    const page = render([], []);
    expect(page.querySelector('.hero-value')?.textContent).toContain('1,500.00');
    expect(page.querySelector('.hero-note')?.textContent).toContain('No movements this month yet');
  });

  it('says how much is left in favor (or overspent) this month', () => {
    const income = { idIngreso: 1, idUsuario: 7, idCategoria: 1, monto: 1000, fecha: today };
    const expense = { idGasto: 1, idUsuario: 7, idCategoria: 2, idComerciante: 1, descripcionGasto: 'Mercado', montoGasto: 250.5, fechaGasto: today };
    const page = render([expense], [income]);
    expect(page.querySelector('.hero-note')?.textContent).toContain('S/ 749.50 ahead');
  });

  it('an expense greater than the income of the month is shown as overspent', () => {
    const income = { idIngreso: 1, idUsuario: 7, idCategoria: 1, monto: 100, fecha: today };
    const expense = { idGasto: 1, idUsuario: 7, idCategoria: 2, idComerciante: 1, descripcionGasto: 'Laptop', montoGasto: 300, fechaGasto: today };
    const page = render([expense], [income]);
    expect(page.querySelector('.hero-note')?.textContent).toContain('spent S/ 200.00 more');
  });
});
