import { addMonths, isAntExpense } from './finance';
import { Expense, Income, SavingGoal } from './models';

// Pure calculations of the profile statistics and spending habits (US36).
// Dates are "yyyy-MM-dd" strings in the user's time zone.

const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (values: number[]) => values.reduce((t, v) => t + v, 0);

// "2026-11-26" minus 89 days -> first day of the "last 90 days" window
export function daysBefore(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - days));
  return date.toISOString().slice(0, 10);
}

export function ageOn(birthdate: string | null | undefined, today: string): number | null {
  if (!birthdate) return null;
  const [by, bm, bd] = birthdate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

// "Ana Lucía Quispe" -> "AQ"
export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  movements: number;
  // Savings rate of the last 3 months: (income - expenses) / income; null without income
  savingsRate: number | null;
  goalsDone: number;
  goalsTotal: number;
}

export function financialStats(expenses: Expense[], incomes: Income[], goals: SavingGoal[], today: string): FinancialStats {
  const from = addMonths(today.slice(0, 7), -2); // this month and the 2 before
  const income3 = sum(incomes.filter((i) => i.fecha.slice(0, 7) >= from).map((i) => Number(i.monto)));
  const expense3 = sum(expenses.filter((e) => e.fechaGasto.slice(0, 7) >= from).map((e) => Number(e.montoGasto)));
  const done = goals.filter((g) => Number(g.montoActual) >= Number(g.montoObjetivo) || (g.estadoMetaAhorro ?? '').toLowerCase() === 'cumplida');
  return {
    totalIncome: round2(sum(incomes.map((i) => Number(i.monto)))),
    totalExpense: round2(sum(expenses.map((e) => Number(e.montoGasto)))),
    movements: expenses.length + incomes.length,
    savingsRate: income3 > 0 ? Math.round(((income3 - expense3) / income3) * 1000) / 10 : null,
    goalsDone: done.length,
    goalsTotal: goals.length,
  };
}

export interface Habits {
  count: number; // expenses in the window
  total: number;
  averageTicket: number;
  topCategory: { idCategoria: number; amount: number; percent: number } | null;
  topWeekday: { day: number; amount: number } | null; // 0 = Sunday
  topMethod: { method: string; percent: number } | null;
  ant: { count: number; total: number; percent: number };
  streak: number; // days in a row registering expenses, until today (or yesterday)
}

// US36 "hábitos de gasto": the expenses of the last `days` days
export function spendingHabits(
  expenses: Expense[],
  categoryNames: Map<number, string>,
  today: string,
  days = 90,
): Habits {
  const from = daysBefore(today, days - 1);
  const recent = expenses.filter((e) => e.fechaGasto >= from && e.fechaGasto <= today);
  const total = sum(recent.map((e) => Number(e.montoGasto)));

  const byCategory = new Map<number, number>();
  const byWeekday = new Map<number, number>();
  const byMethod = new Map<string, number>();
  for (const e of recent) {
    byCategory.set(e.idCategoria, (byCategory.get(e.idCategoria) ?? 0) + Number(e.montoGasto));
    const [y, m, d] = e.fechaGasto.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + Number(e.montoGasto));
    byMethod.set(e.metodoPagoGasto, (byMethod.get(e.metodoPagoGasto) ?? 0) + 1);
  }
  const max = <K>(map: Map<K, number>) => [...map.entries()].sort((a, b) => b[1] - a[1])[0];

  const category = max(byCategory);
  const weekday = max(byWeekday);
  const method = max(byMethod);
  const ants = recent.filter((e) => isAntExpense(e, categoryNames.get(e.idCategoria)));
  const antTotal = sum(ants.map((e) => Number(e.montoGasto)));

  return {
    count: recent.length,
    total: round2(total),
    averageTicket: recent.length ? round2(total / recent.length) : 0,
    topCategory: category && total > 0 ? { idCategoria: category[0], amount: round2(category[1]), percent: Math.round((category[1] / total) * 1000) / 10 } : null,
    topWeekday: weekday ? { day: weekday[0], amount: round2(weekday[1]) } : null,
    topMethod: method ? { method: method[0], percent: Math.round((method[1] / recent.length) * 1000) / 10 } : null,
    ant: { count: ants.length, total: round2(antTotal), percent: total > 0 ? Math.round((antTotal / total) * 1000) / 10 : 0 },
    streak: streak(expenses.map((e) => e.fechaGasto), today),
  };
}

// Days in a row with at least one expense, counting back from today (or from yesterday, so the
// streak is not lost in the morning before registering today's expenses). Same rule as the API.
export function streak(dates: string[], today: string): number {
  const days = new Set(dates);
  let day = days.has(today) ? today : daysBefore(today, 1);
  let count = 0;
  while (days.has(day)) {
    count++;
    day = daysBefore(day, 1);
  }
  return count;
}
