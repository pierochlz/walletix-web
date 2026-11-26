import { addMonths, average, balanceEvolution, byCategory, isAntExpense, lastMonths, monthlyFlows, monthRange, rangeError } from './finance';
import { Expense, Income } from './models';

const expense = (fecha: string, monto: number, idCategoria = 1, fijo = false): Expense =>
  ({ idGasto: 0, idUsuario: 1, idCategoria, idComerciante: 1, descripcionGasto: 'x', montoGasto: monto, fechaGasto: fecha, metodoPagoGasto: 'efectivo', fijoGasto: fijo }) as Expense;
const income = (fecha: string, monto: number, idCategoria = 5): Income => ({ idIngreso: 0, idUsuario: 1, idCategoria, monto, fecha }) as unknown as Income;

describe('dashboard calculations', () => {
  it('moves between months and builds ranges (US09)', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(lastMonths('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
    expect(monthRange('2026-10', '2026-12')).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(monthRange('2026-12', '2026-10')).toEqual([]);
  });

  it('validates the month range (US09 unhappy path)', () => {
    expect(rangeError('2026-12', '2026-10', '2026-11')).toBe('dashboard.rangeReversed');
    expect(rangeError('2026-09', '2027-01', '2026-11')).toBe('dashboard.rangeFuture');
    expect(rangeError('', '2026-10', '2026-11')).toBe('dashboard.rangeRequired');
    expect(rangeError('2023-01', '2026-11', '2026-11')).toBe('dashboard.rangeTooLong');
    expect(rangeError('2026-09', '2026-11', '2026-11')).toBeNull();
  });

  it('adds income and expenses per month and their averages (US09)', () => {
    const flows = monthlyFlows([expense('2026-10-05', 100), expense('2026-11-01', 40.5)], [income('2026-10-01', 1500)], ['2026-10', '2026-11']);
    expect(flows).toEqual([
      { month: '2026-10', income: 1500, expense: 100, net: 1400 },
      { month: '2026-11', income: 0, expense: 40.5, net: -40.5 },
    ]);
    expect(average(flows.map((f) => f.expense))).toBe(70.25);
    expect(average([])).toBe(0);
  });

  it('rebuilds the balance at the end of each month from today\'s balance (US07)', () => {
    // Today: S/ 1,359.50. In November +0 income and -40.50; in October +1,500 and -100
    const evolution = balanceEvolution(1359.5, [expense('2026-10-05', 100), expense('2026-11-01', 40.5)], [income('2026-10-01', 1500)], ['2026-09', '2026-10', '2026-11']);
    expect(evolution).toEqual([
      { month: '2026-09', balance: 0 },
      { month: '2026-10', balance: 1400 },
      { month: '2026-11', balance: 1359.5 },
    ]);
  });

  it('detects ant expenses with the same rule as the API (US06)', () => {
    expect(isAntExpense(expense('2026-11-01', 3.5), 'Comida')).toBe(true);
    expect(isAntExpense(expense('2026-11-01', 10), 'Comida')).toBe(false);
    expect(isAntExpense(expense('2026-11-01', 9.9, 1, true), 'Entretenimiento')).toBe(false);
    expect(isAntExpense(expense('2026-11-01', 3), 'Transporte')).toBe(false);
  });

  it('splits by category with percentages and groups the small ones (US10)', () => {
    const names = new Map([
      [1, { name: 'Comida', color: '#16a34a' }],
      [2, { name: 'Transporte' }],
    ]);
    const slices = byCategory(
      [
        { idCategoria: 1, amount: 75 },
        { idCategoria: 2, amount: 25 },
      ],
      names,
      'Otros',
    );
    expect(slices.map((s) => [s.label, s.value, s.percent])).toEqual([
      ['Comida', 75, 75],
      ['Transporte', 25, 25],
    ]);
    expect(slices[0].color).toBe('#16a34a');
    expect(byCategory([], names, 'Otros')).toEqual([]);
    const many = byCategory([1, 2, 3, 4].map((id) => ({ idCategoria: id, amount: 10 })), new Map(), 'Otros', 3);
    expect(many.map((s) => s.label)).toEqual(['—', '—', 'Otros']);
    expect(many[2].value).toBe(20);
  });
});
