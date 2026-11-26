import { Expense, Income, SavingGoal } from './models';
import { ageOn, daysBefore, financialStats, initials, spendingHabits, streak } from './profile-stats';

const expense = (fecha: string, monto: number, idCategoria = 1, metodo = 'yape', fijo = false): Expense =>
  ({ idGasto: 0, idUsuario: 1, idCategoria, idComerciante: 1, descripcionGasto: 'x', montoGasto: monto, fechaGasto: fecha, metodoPagoGasto: metodo, fijoGasto: fijo }) as Expense;
const income = (fecha: string, monto: number): Income => ({ idIngreso: 0, idUsuario: 1, idCategoria: 5, monto, fecha }) as unknown as Income;
const goal = (actual: number, objetivo: number, estado = 'activa'): SavingGoal =>
  ({ idMetaAhorro: 0, titulo: 'Meta', montoActual: actual, montoObjetivo: objetivo, fechaLimite: '2026-12-31', estadoMetaAhorro: estado, idUsuario: 1 }) as SavingGoal;

const TODAY = '2026-11-26'; // Thursday
const names = new Map([
  [1, 'Comida'],
  [2, 'Transporte'],
]);

describe('profile statistics (US36)', () => {
  it('works with dates, ages and initials', () => {
    expect(daysBefore(TODAY, 1)).toBe('2026-11-25');
    expect(daysBefore('2026-03-01', 1)).toBe('2026-02-28');
    expect(ageOn('2000-11-27', TODAY)).toBe(25); // the birthday is tomorrow
    expect(ageOn('2000-11-26', TODAY)).toBe(26);
    expect(ageOn(null, TODAY)).toBeNull();
    expect(initials('Ana Lucía Quispe')).toBe('AQ');
    expect(initials('mario')).toBe('M');
    expect(initials('  ')).toBe('?');
  });

  it('adds totals, the savings rate of the last 3 months and the completed goals', () => {
    const stats = financialStats(
      [expense('2026-11-02', 300), expense('2026-09-10', 200), expense('2026-06-01', 999)],
      [income('2026-11-01', 1000), income('2026-06-01', 500)],
      [goal(500, 500), goal(10, 100, 'cumplida'), goal(10, 100)],
      TODAY,
    );
    expect(stats.totalIncome).toBe(1500);
    expect(stats.totalExpense).toBe(1499);
    expect(stats.movements).toBe(5);
    // September to November: income 1000, expenses 500 -> 50%
    expect(stats.savingsRate).toBe(50);
    expect(stats.goalsDone).toBe(2);
    expect(stats.goalsTotal).toBe(3);
    expect(financialStats([], [], [], TODAY).savingsRate).toBeNull();
  });

  it('finds the spending habits of the last 90 days', () => {
    const habits = spendingHabits(
      [
        expense('2026-11-26', 60, 1, 'yape'), // Thursday
        expense('2026-11-19', 30, 1, 'yape'), // Thursday
        expense('2026-11-22', 3.5, 1, 'efectivo'), // Sunday, ant expense
        expense('2026-11-23', 3, 2, 'efectivo'), // bus fare: not an ant expense
        expense('2026-01-01', 5000, 2, 'tarjeta'), // outside the 90 days
      ],
      names,
      TODAY,
    );
    expect(habits.count).toBe(4);
    expect(habits.total).toBe(96.5);
    expect(habits.averageTicket).toBe(24.13);
    expect(habits.topCategory).toEqual({ idCategoria: 1, amount: 93.5, percent: 96.9 });
    expect(habits.topWeekday).toEqual({ day: 4, amount: 90 });
    expect(habits.topMethod).toEqual({ method: 'yape', percent: 50 });
    expect(habits.ant).toEqual({ count: 1, total: 3.5, percent: 3.6 });
  });

  it('has no habits without expenses', () => {
    const habits = spendingHabits([], names, TODAY);
    expect(habits.count).toBe(0);
    expect(habits.averageTicket).toBe(0);
    expect(habits.topCategory).toBeNull();
    expect(habits.topWeekday).toBeNull();
    expect(habits.topMethod).toBeNull();
    expect(habits.ant.percent).toBe(0);
  });

  it('counts the streak like the API: from today, or from yesterday if there is nothing today yet', () => {
    expect(streak(['2026-11-26', '2026-11-25', '2026-11-24', '2026-11-20'], TODAY)).toBe(3);
    expect(streak(['2026-11-25', '2026-11-24'], TODAY)).toBe(2);
    expect(streak(['2026-11-23'], TODAY)).toBe(0);
    expect(streak([], TODAY)).toBe(0);
  });
});
