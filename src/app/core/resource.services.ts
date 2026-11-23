import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Budget, Category, Expense, Income, Merchant, SavingGoal } from './models';

// One small service per resource of the API

@Injectable({ providedIn: 'root' })
export class ExpenseService extends CrudService<Expense> {
  constructor() {
    super('gastos');
  }
}

@Injectable({ providedIn: 'root' })
export class IncomeService extends CrudService<Income> {
  constructor() {
    super('ingresos');
  }
}

@Injectable({ providedIn: 'root' })
export class SavingGoalService extends CrudService<SavingGoal> {
  constructor() {
    super('metas-ahorro');
  }
}

@Injectable({ providedIn: 'root' })
export class BudgetService extends CrudService<Budget> {
  constructor() {
    super('presupuestos');
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryService extends CrudService<Category> {
  constructor() {
    super('categorias');
  }
}

@Injectable({ providedIn: 'root' })
export class MerchantService extends CrudService<Merchant> {
  constructor() {
    super('comercios');
  }
}
