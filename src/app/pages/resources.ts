import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { LookupStore } from '../core/lookup.store';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_ICON } from '../core/category-icons';
import { localToday } from '../core/dates';
import { Expense } from '../core/models';
import {
  CategoryService,
  ExpenseService,
  IncomeService,
  MerchantService,
  SavingGoalService,
} from '../core/resource.services';
import { ResourceConfig, SelectOption } from '../shared/resource-config';
import { ResourcePage } from '../shared/resource-page';

// Each page only describes its fields; ResourcePage draws the table and the form.

const options = (prefix: string, values: string[]): (() => SelectOption[]) => () =>
  values.map((v) => ({ value: v, label: `${prefix}.${v}` }));
export const months = (): SelectOption[] => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `month.${i + 1}` }));

// Same limits as the API:
// - incomes and expenses: from January 1st of last year until today
// - budgets: from this year to 5 years ahead, up to S/ 1,000,000 (see budgets/budgets.ts)
export const CURRENT_YEAR = new Date().getFullYear();
const firstAllowedDate = () => `${CURRENT_YEAR - 1}-01-01`;

// The logged-in user is the owner of every record that is created
export function ownerDefaults() {
  const auth = inject(AuthService);
  return () => ({ idUsuario: auth.user()?.idUsuario ?? 0 });
}

// Incomes and expenses change the balance in the API: reload the user so the dashboard shows the new balance
function reloadBalance() {
  const auth = inject(AuthService);
  return () => auth.loadCurrentUser().subscribe({ error: () => {} });
}

@Component({
  selector: 'app-expenses-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class ExpensesPage {
  private lookups = inject(LookupStore);
  readonly config: ResourceConfig = {
    titleKey: 'expenses.title',
    icon: 'shopping_cart',
    idKey: 'idGasto',
    service: inject(ExpenseService),
    defaults: ownerDefaults(),
    afterChange: reloadBalance(),
    // US15: the API answers with "alertaPresupuesto" when the expense goes over the monthly budget
    warningFromResponse: (response) => (response as Expense | null)?.alertaPresupuesto ?? null,
    fields: [
      { key: 'descripcionGasto', label: 'expenses.description', type: 'text', required: true, maxLength: 100 },
      { key: 'montoGasto', label: 'expenses.amount', type: 'number', required: true, min: 0.01, format: 'currency' },
      { key: 'fechaGasto', label: 'expenses.date', type: 'date', required: true, format: 'date', minDate: firstAllowedDate, maxDate: localToday },
      { key: 'idCategoria', label: 'expenses.category', type: 'select', required: true, options: this.lookups.expenseCategories, format: 'option' },
      { key: 'idComerciante', label: 'expenses.merchant', type: 'select', required: true, options: this.lookups.merchantOptions, format: 'option' },
      {
        key: 'metodoPagoGasto', label: 'expenses.method', type: 'select', required: true, translate: true, format: 'option',
        options: options('method', ['efectivo', 'tarjeta', 'yape', 'transferencia']),
      },
      { key: 'fijoGasto', label: 'expenses.fixed', type: 'checkbox', format: 'bool' },
    ],
  };
}

@Component({
  selector: 'app-incomes-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class IncomesPage {
  private lookups = inject(LookupStore);
  readonly config: ResourceConfig = {
    titleKey: 'incomes.title',
    icon: 'payments',
    idKey: 'idIngreso',
    service: inject(IncomeService),
    defaults: ownerDefaults(),
    afterChange: reloadBalance(),
    fields: [
      { key: 'fuente', label: 'incomes.source', type: 'text', required: true, maxLength: 100 },
      { key: 'monto', label: 'incomes.amount', type: 'number', required: true, min: 0.01, format: 'currency' },
      { key: 'fecha', label: 'incomes.date', type: 'date', required: true, format: 'date', minDate: firstAllowedDate, maxDate: localToday },
      { key: 'idCategoria', label: 'incomes.category', type: 'select', required: true, options: this.lookups.incomeCategories, format: 'option' },
      { key: 'tipoIngreso', label: 'incomes.type', type: 'select', required: true, translate: true, format: 'option', options: options('incomeType', ['fijo', 'variable']) },
      {
        key: 'frecuencia', label: 'incomes.frequency', type: 'select', required: true, translate: true, format: 'option',
        options: options('frequency', ['unica', 'semanal', 'quincenal', 'mensual']),
      },
      { key: 'descripcion', label: 'incomes.description', type: 'text', maxLength: 200, inTable: false },
    ],
  };
}

@Component({
  selector: 'app-goals-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class GoalsPage {
  readonly config: ResourceConfig = {
    titleKey: 'goals.title',
    icon: 'savings',
    idKey: 'idMetaAhorro',
    service: inject(SavingGoalService),
    defaults: ownerDefaults(),
    fields: [
      { key: 'titulo', label: 'goals.name', type: 'text', required: true, maxLength: 150 },
      { key: 'montoObjetivo', label: 'goals.target', type: 'number', required: true, min: 0.01, format: 'currency' },
      { key: 'montoActual', label: 'goals.current', type: 'number', required: true, min: 0, format: 'currency' },
      { key: 'fechaLimite', label: 'goals.deadline', type: 'date', required: true, format: 'date' },
      {
        key: 'estadoMetaAhorro', label: 'goals.status', type: 'select', required: true, translate: true, format: 'option',
        options: options('goalStatus', ['activa', 'cumplida', 'pausada']),
      },
    ],
  };
}

@Component({
  selector: 'app-categories-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class CategoriesPage {
  private lookups = inject(LookupStore);
  private auth = inject(AuthService);
  private readonly isAdmin = this.auth.isAdmin();
  readonly config: ResourceConfig = {
    titleKey: 'categories.title',
    icon: 'category',
    idKey: 'idCategoria',
    service: inject(CategoryService),
    defaults: ownerDefaults(),
    afterChange: () => this.lookups.refresh(),
    // Default categories belong to everyone: only an ADMIN can change them (the API checks it too)
    canEditRow: (row) => this.isAdmin || !row['predeterminadoCategoria'],
    lockedKey: 'categories.locked',
    infoKey: this.isAdmin ? 'categories.infoAdmin' : 'categories.info',
    initialValues: () => ({ urlIconoCategoria: DEFAULT_CATEGORY_ICON, colorHexCategoria: CATEGORY_COLORS[4].hex, tipoCategoria: 'gasto' }),
    fields: [
      { key: 'urlIconoCategoria', label: 'categories.icon', type: 'icon', required: true, format: 'icon' },
      { key: 'nombreCategoria', label: 'categories.name', type: 'text', required: true, maxLength: 50 },
      {
        key: 'tipoCategoria', label: 'categories.type', type: 'select', required: true, translate: true, format: 'option',
        options: options('categoryType', ['gasto', 'ingreso']),
      },
      { key: 'colorHexCategoria', label: 'categories.color', type: 'color', required: true, pattern: '^#[0-9A-Fa-f]{6}$', inTable: false },
      // Only an ADMIN sees the check to make a category visible to all users
      { key: 'predeterminadoCategoria', label: 'categories.default', type: 'checkbox', format: 'bool', inForm: this.isAdmin },
    ],
  };
}

@Component({
  selector: 'app-merchants-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class MerchantsPage {
  private lookups = inject(LookupStore);
  private auth = inject(AuthService);
  private readonly isAdmin = this.auth.isAdmin();
  readonly config: ResourceConfig = {
    titleKey: 'merchants.title',
    icon: 'storefront',
    idKey: 'idComerciante',
    service: inject(MerchantService),
    afterChange: () => this.lookups.refresh(),
    // Same pattern as categories: default merchants belong to everyone, only an ADMIN changes them
    canEditRow: (row) => this.isAdmin || !row['predeterminadoComerciante'],
    lockedKey: 'merchants.locked',
    infoKey: this.isAdmin ? 'merchants.infoAdmin' : 'merchants.info',
    fields: [
      { key: 'nombreComerciante', label: 'merchants.name', type: 'text', required: true, maxLength: 50 },
      // The merchant shows the icon of its category (no logo URL to type)
      { key: 'idCategoria', label: 'merchants.category', type: 'select', required: true, options: this.lookups.expenseCategories, format: 'option' },
      { key: 'predeterminadoComerciante', label: 'merchants.default', type: 'checkbox', format: 'bool', inForm: false },
    ],
  };
}
