import { budgetLevel, shiftMonth, summarizeMonth } from './budget-summary';
import { Budget, Expense } from './models';

const budget = (idPresupuesto: number, idCategoria: number, montoAsignado: number, mes = 11, anio = 2026, idUsuario = 1): Budget => ({
  idPresupuesto, idCategoria, montoAsignado, mes, anio, idUsuario,
});

const expense = (idGasto: number, idCategoria: number, montoGasto: number, fechaGasto: string, idUsuario = 1): Expense => ({
  idGasto, idCategoria, montoGasto, fechaGasto, idUsuario,
  idComerciante: 1, descripcionGasto: 'test', metodoPagoGasto: 'efectivo', fijoGasto: false,
});

describe('budget month summary', () => {
  it('adds only the expenses of the same category and month', () => {
    const summary = summarizeMonth(
      [budget(1, 10, 100)],
      [
        expense(1, 10, 30, '2026-11-02'),
        expense(2, 10, 20.5, '2026-11-20'),
        expense(3, 10, 99, '2026-10-31'), // other month
        expense(4, 20, 99, '2026-11-05'), // other category
      ],
      2026,
      11,
    );
    expect(summary.rows[0].spent).toBe(50.5);
    expect(summary.rows[0].available).toBe(49.5);
    expect(summary.rows[0].percent).toBe(51);
    expect(summary.rows[0].level).toBe('ok');
  });

  it('shows amber from 80% and red only when the budget is exceeded', () => {
    expect(budgetLevel(79.99, 100)).toBe('ok');
    expect(budgetLevel(80, 100)).toBe('warning');
    expect(budgetLevel(100, 100)).toBe('warning'); // spending exactly the budget is not exceeding it
    expect(budgetLevel(100.01, 100)).toBe('over');
  });

  it('gives a negative balance when the budget is exceeded', () => {
    const summary = summarizeMonth([budget(1, 10, 100)], [expense(1, 10, 80, '2026-11-01'), expense(2, 10, 30, '2026-11-02')], 2026, 11);
    expect(summary.rows[0].available).toBe(-10);
    expect(summary.rows[0].level).toBe('over');
  });

  it('lists the categories with expenses but without a budget', () => {
    const summary = summarizeMonth([budget(1, 10, 100)], [expense(1, 20, 15, '2026-11-01'), expense(2, 20, 5, '2026-11-03')], 2026, 11);
    expect(summary.unbudgeted).toEqual([{ idCategoria: 20, spent: 20 }]);
    expect(summary.spent).toBe(0); // the totals only count categories with a budget
  });

  it('keeps only the records of the logged-in user (an ADMIN receives everyone)', () => {
    const summary = summarizeMonth(
      [budget(1, 10, 100, 11, 2026, 1), budget(2, 10, 500, 11, 2026, 2)],
      [expense(1, 10, 40, '2026-11-01', 1), expense(2, 10, 300, '2026-11-01', 2)],
      2026,
      11,
      1,
    );
    expect(summary.rows.length).toBe(1);
    expect(summary.assigned).toBe(100);
    expect(summary.spent).toBe(40);
  });

  it('orders the budgets from the most used to the least used', () => {
    const summary = summarizeMonth(
      [budget(1, 10, 100), budget(2, 20, 100)],
      [expense(1, 10, 10, '2026-11-01'), expense(2, 20, 90, '2026-11-01')],
      2026,
      11,
    );
    expect(summary.rows.map((r) => r.budget.idPresupuesto)).toEqual([2, 1]);
  });

  it('moves between months across years', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2026, month: 12 });
  });
});
