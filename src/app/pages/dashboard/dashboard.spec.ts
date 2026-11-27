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

  function render(expenses: unknown[], incomes: unknown[], budgets: unknown[] = [], challenges = 0) {
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
    http.expectOne(`${api}/presupuestos`).flush(budgets);
    const participation = { idUsuarioDesafio: 1 };
    http.expectOne(`${api}/retos/resumen`).flush({ activos: Array(challenges).fill(participation), historial: [] });
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

  // First steps of a new user
  it('a new user sees the 3 first steps, each one with a link to its page', () => {
    const page = render([], []);
    const card = page.querySelector('.first-steps');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('0 of 3');
    const links = [...card!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/incomes', '/budgets', '/challenges']);
  });

  it('marks the steps already done and hides the card when the 3 are done', () => {
    const income = { idIngreso: 1, idUsuario: 7, idCategoria: 1, monto: 100, fecha: today };
    const budget = { idPresupuesto: 1, idUsuario: 7, idCategoria: 2, mes: 1, anio: 2026, montoAsignado: 50 };
    const halfway = render([], [income]);
    expect(halfway.querySelector('.first-steps')?.textContent).toContain('1 of 3');
    expect(halfway.querySelectorAll('.fs-steps li.done').length).toBe(1);

    TestBed.resetTestingModule();
    const finished = render([], [income], [budget], 1);
    expect(finished.querySelector('.first-steps')).toBeNull();
  });

  it('a budget of another user (seen by an ADMIN) does not count as my step', () => {
    const othersBudget = { idPresupuesto: 9, idUsuario: 99, idCategoria: 2, mes: 1, anio: 2026, montoAsignado: 50 };
    const page = render([], [], [othersBudget]);
    expect(page.querySelectorAll('.fs-steps li.done').length).toBe(0);
  });

  // Found in production: while the API was waking up the card said "S/ 0.00" and the greeting "Hello,"
  it('while the user is loading it shows placeholders, not a balance of S/ 0.00 or a greeting without a name', () => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(AuthService).user.set(null);
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.hero-skeleton')).not.toBeNull();
    expect(page.querySelector('.hello-skeleton')).not.toBeNull();
    expect(page.querySelector('.overview')?.textContent).not.toContain('0.00 ');
    expect(page.querySelector('.hero')?.textContent).not.toMatch(/S\/\s*0\.00/);
    expect(page.querySelector('h1')?.textContent?.trim()).not.toMatch(/^Hello,?$/);
    TestBed.inject(HttpTestingController)
      .match(() => true)
      .forEach((req) =>
        req.request.url.includes('/retos/resumen') ? req.flush({ activos: [], historial: [] })
          : req.request.url.includes('tip-del-dia') ? req.flush(null)
          : req.request.url.startsWith(api) ? req.flush([])
          : req.flush('down', { status: 503, statusText: 'Unavailable' }),
      );
  });
});
