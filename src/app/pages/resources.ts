import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { LookupStore } from '../core/lookup.store';
import { Expense } from '../core/models';
import {
  BudgetService,
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
const months = (): SelectOption[] => Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `month.${i + 1}` }));

// The logged-in user is the owner of every record that is created
function ownerDefaults() {
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
      { key: 'fechaGasto', label: 'expenses.date', type: 'date', required: true, format: 'date' },
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
      { key: 'fecha', label: 'incomes.date', type: 'date', required: true, format: 'date' },
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
  selector: 'app-budgets-page',
  imports: [ResourcePage],
  template: `<app-resource-page [config]="config" />`,
})
export class BudgetsPage {
  private lookups = inject(LookupStore);
  readonly config: ResourceConfig = {
    titleKey: 'budgets.title',
    icon: 'account_balance_wallet',
    idKey: 'idPresupuesto',
    service: inject(BudgetService),
    defaults: ownerDefaults(),
    fields: [
      { key: 'idCategoria', label: 'budgets.category', type: 'select', required: true, options: this.lookups.expenseCategories, format: 'option' },
      { key: 'mes', label: 'budgets.month', type: 'select', required: true, translate: true, options: months, format: 'option' },
      { key: 'anio', label: 'budgets.year', type: 'number', required: true, min: 2000, max: 2100 },
      { key: 'montoAsignado', label: 'budgets.amount', type: 'number', required: true, min: 0.01, format: 'currency' },
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
  readonly config: ResourceConfig = {
    titleKey: 'categories.title',
    icon: 'category',
    idKey: 'idCategoria',
    service: inject(CategoryService),
    defaults: ownerDefaults(),
    afterChange: () => this.lookups.refresh(),
    fields: [
      { key: 'nombreCategoria', label: 'categories.name', type: 'text', required: true, maxLength: 50 },
      {
        key: 'tipoCategoria', label: 'categories.type', type: 'select', required: true, translate: true, format: 'option',
        options: options('categoryType', ['gasto', 'ingreso']),
      },
      { key: 'colorHexCategoria', label: 'categories.color', type: 'color', required: true, pattern: '^#[0-9A-Fa-f]{6}$', format: 'color' },
      { key: 'urlIconoCategoria', label: 'categories.icon', type: 'url', required: true, maxLength: 100, inTable: false },
      { key: 'predeterminadoCategoria', label: 'categories.default', type: 'checkbox', format: 'bool', inForm: false },
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
  readonly config: ResourceConfig = {
    titleKey: 'merchants.title',
    icon: 'storefront',
    idKey: 'idComerciante',
    service: inject(MerchantService),
    canEdit: () => this.auth.isAdmin(), // the API only lets ADMIN create, edit or delete merchants
    noteKey: 'merchants.adminOnly',
    afterChange: () => this.lookups.refresh(),
    fields: [
      { key: 'nombreComerciante', label: 'merchants.name', type: 'text', required: true, maxLength: 50 },
      { key: 'idCategoria', label: 'merchants.category', type: 'select', required: true, options: this.lookups.expenseCategories, format: 'option' },
      { key: 'urlLogoComerciante', label: 'merchants.logo', type: 'url', required: true, maxLength: 100, inTable: false },
    ],
  };
}
