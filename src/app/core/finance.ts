import { Expense, Income } from './models';

// Pure calculations of the dashboard (US06-US10). Dates are "yyyy-MM-dd" strings, months are "yyyy-MM".

// Ant expense ("gasto hormiga"): small daily purchase. Same rule as the API challenges:
// less than S/ 10, not a fixed expense and not transport (the bus fare is not an ant expense)
export const ANT_EXPENSE_LIMIT = 10;
export function isAntExpense(expense: Expense, categoryName: string | undefined): boolean {
  const name = (categoryName ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
  return Number(expense.montoGasto) < ANT_EXPENSE_LIMIT && !expense.fijoGasto && !name.includes('transporte');
}

// "2026-11" -> "2026-10"
export function addMonths(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// The last n months ending in "until", oldest first
export function lastMonths(until: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(until, i - n + 1));
}

// Every month from "from" to "to" (both included); empty if the range is reversed
export function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  for (let m = from; m <= to && months.length < 120; m = addMonths(m, 1)) months.push(m);
  return months;
}

// US09 unhappy path: "El mes inicial no puede ser posterior al mes final"
export function rangeError(from: string, to: string, today: string): string | null {
  if (!from || !to) return 'dashboard.rangeRequired';
  if (from > to) return 'dashboard.rangeReversed';
  if (to > today) return 'dashboard.rangeFuture';
  if (monthRange(from, to).length > 24) return 'dashboard.rangeTooLong';
  return null;
}

export interface MonthFlow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Income and expenses of each month (US09)
export function monthlyFlows(expenses: Expense[], incomes: Income[], months: string[]): MonthFlow[] {
  return months.map((month) => {
    const income = incomes.filter((i) => i.fecha.startsWith(month)).reduce((t, i) => t + Number(i.monto), 0);
    const expense = expenses.filter((e) => e.fechaGasto.startsWith(month)).reduce((t, e) => t + Number(e.montoGasto), 0);
    return { month, income: round2(income), expense: round2(expense), net: round2(income - expense) };
  });
}

// US07: balance at the end of each month. It goes back from today's balance undoing the
// income and expenses registered after that month.
export function balanceEvolution(currentBalance: number, expenses: Expense[], incomes: Income[], months: string[]): { month: string; balance: number }[] {
  return months.map((month) => {
    const laterIncome = incomes.filter((i) => i.fecha.slice(0, 7) > month).reduce((t, i) => t + Number(i.monto), 0);
    const laterExpense = expenses.filter((e) => e.fechaGasto.slice(0, 7) > month).reduce((t, e) => t + Number(e.montoGasto), 0);
    return { month, balance: round2(currentBalance - laterIncome + laterExpense) };
  });
}

export function average(values: number[]): number {
  return values.length ? round2(values.reduce((t, v) => t + v, 0) / values.length) : 0;
}

export interface Slice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

const FALLBACK_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];
export const OTHERS_COLOR = '#94a3b8';

// US10: total of each category, biggest first; from the 6th category on they are grouped in "others"
export function byCategory(
  records: { idCategoria: number; amount: number }[],
  categories: Map<number, { name: string; color?: string }>,
  othersLabel: string,
  maxSlices = 6,
): Slice[] {
  const totals = new Map<number, number>();
  for (const r of records) totals.set(r.idCategoria, (totals.get(r.idCategoria) ?? 0) + Number(r.amount));
  const total = [...totals.values()].reduce((t, v) => t + v, 0);
  if (total <= 0) return [];
  const sorted = [...totals.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const main = sorted.slice(0, sorted.length > maxSlices ? maxSlices - 1 : maxSlices);
  const rest = sorted.slice(main.length).reduce((t, [, v]) => t + v, 0);
  const slices: Slice[] = main.map(([id, value], i) => ({
    label: categories.get(id)?.name ?? '—',
    value: round2(value),
    percent: Math.round((value / total) * 1000) / 10,
    color: categories.get(id)?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));
  if (rest > 0) slices.push({ label: othersLabel, value: round2(rest), percent: Math.round((rest / total) * 1000) / 10, color: OTHERS_COLOR });
  return slices;
}
