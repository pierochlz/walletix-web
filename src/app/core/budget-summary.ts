import { Budget, Expense } from './models';

// Month view of the budgets: for each budget of the month, how much was spent and how much is left.
// It uses the same rule as the API alert (US15): only the expenses of that category in that month count.

// From this percentage the budget is shown in amber ("close to the limit")
export const WARNING_PERCENT = 80;

export type BudgetLevel = 'ok' | 'warning' | 'over';

export interface BudgetRow {
  budget: Budget;
  spent: number;
  available: number; // negative when the budget was exceeded
  percent: number; // spent / assigned, can be more than 100
  level: BudgetLevel;
}

// Categories with expenses this month but without a budget
export interface UnbudgetedRow {
  idCategoria: number;
  spent: number;
}

export interface MonthSummary {
  rows: BudgetRow[];
  unbudgeted: UnbudgetedRow[];
  assigned: number;
  spent: number; // only the spending of the categories that have a budget
  available: number;
}

// "yyyy-MM", the same format as the start of fechaGasto ("2026-11-23")
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function budgetLevel(spent: number, assigned: number): BudgetLevel {
  if (spent > assigned) return 'over'; // the API sends the alert in this case
  if (assigned > 0 && (spent / assigned) * 100 >= WARNING_PERCENT) return 'warning';
  return 'ok';
}

// Adds amounts in cents to avoid float errors (0.1 + 0.2)
const toCents = (amount: number) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => cents / 100;

export function summarizeMonth(
  budgets: Budget[],
  expenses: Expense[],
  year: number,
  month: number,
  idUsuario?: number, // an ADMIN receives the records of every user: only keep their own
): MonthSummary {
  const key = monthKey(year, month);
  const mine = <T extends { idUsuario: number }>(item: T) => idUsuario === undefined || item.idUsuario === idUsuario;

  // Cents spent per category during the month
  const spentByCategory = new Map<number, number>();
  for (const expense of expenses) {
    if (!mine(expense) || !expense.fechaGasto?.startsWith(key)) continue;
    spentByCategory.set(expense.idCategoria, (spentByCategory.get(expense.idCategoria) ?? 0) + toCents(expense.montoGasto));
  }

  const monthBudgets = budgets.filter((b) => mine(b) && b.anio === year && b.mes === month && b.estado !== 0);

  const rows: BudgetRow[] = monthBudgets
    .map((budget) => {
      const assignedCents = toCents(budget.montoAsignado);
      const spentCents = spentByCategory.get(budget.idCategoria) ?? 0;
      const spent = fromCents(spentCents);
      const assigned = fromCents(assignedCents);
      return {
        budget,
        spent,
        available: fromCents(assignedCents - spentCents),
        percent: assignedCents > 0 ? Math.round((spentCents / assignedCents) * 100) : 0,
        level: budgetLevel(spent, assigned),
      };
    })
    // The most used budgets first: they are the ones the user has to look at
    .sort((a, b) => b.percent - a.percent);

  const withBudget = new Set(monthBudgets.map((b) => b.idCategoria));
  const unbudgeted = [...spentByCategory.entries()]
    .filter(([idCategoria]) => !withBudget.has(idCategoria))
    .map(([idCategoria, cents]) => ({ idCategoria, spent: fromCents(cents) }))
    .sort((a, b) => b.spent - a.spent);

  const assignedCents = monthBudgets.reduce((total, b) => total + toCents(b.montoAsignado), 0);
  const spentCents = monthBudgets.reduce((total, b) => total + (spentByCategory.get(b.idCategoria) ?? 0), 0);

  return {
    rows,
    unbudgeted,
    assigned: fromCents(assignedCents),
    spent: fromCents(spentCents),
    available: fromCents(assignedCents - spentCents),
  };
}

// Previous / next month, changing the year when needed
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
