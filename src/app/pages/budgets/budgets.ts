import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, forkJoin, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { BudgetLevel, shiftMonth, summarizeMonth, WARNING_PERCENT } from '../../core/budget-summary';
import { categoryIcon } from '../../core/category-icons';
import { onlyOwn } from '../../core/ownership';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LookupStore } from '../../core/lookup.store';
import { Budget, Expense } from '../../core/models';
import { BudgetService, ExpenseService } from '../../core/resource.services';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { ResourceConfig } from '../../shared/resource-config';
import { ResourceFormDialog } from '../../shared/resource-form-dialog';
import { CURRENT_YEAR, months, ownerDefaults } from '../resources';

// Budgets by month: the user moves between months and sees, per category,
// how much was assigned, how much was spent and how much is left (green / amber / red).
@Component({
  selector: 'app-budgets-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatTooltipModule, CurrencyPipe, TranslatePipe],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css',
})
export class BudgetsPage implements OnInit {
  readonly i18n = inject(I18nService);
  private auth = inject(AuthService);
  private lookups = inject(LookupStore);
  private budgetService = inject(BudgetService);
  private expenseService = inject(ExpenseService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly warningPercent = WARNING_PERCENT;

  // Same form (and same limits as the API) for creating and editing a budget
  private readonly config: ResourceConfig = {
    titleKey: 'budgets.title',
    icon: 'account_balance_wallet',
    idKey: 'idPresupuesto',
    service: this.budgetService,
    defaults: ownerDefaults(),
    fields: [
      { key: 'idCategoria', label: 'budgets.category', type: 'select', required: true, options: this.lookups.expenseCategories },
      { key: 'mes', label: 'budgets.month', type: 'select', required: true, translate: true, options: months },
      { key: 'anio', label: 'budgets.year', type: 'number', required: true, min: CURRENT_YEAR, max: CURRENT_YEAR + 5 },
      { key: 'montoAsignado', label: 'budgets.amount', type: 'number', required: true, min: 0.01, max: 1_000_000, format: 'currency' },
    ],
  };

  private readonly today = new Date();
  readonly year = signal(this.today.getFullYear());
  readonly month = signal(this.today.getMonth() + 1);

  readonly budgets = signal<Budget[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Everything on the screen comes from here: it is recalculated when the month or the data change
  readonly summary = computed(() => {
    const myId = this.auth.user()?.idUsuario; // an ADMIN receives everyone's records: only mine count here
    return summarizeMonth(onlyOwn(this.budgets(), myId), onlyOwn(this.expenses(), myId), this.year(), this.month());
  });

  readonly monthTitle = computed(() => `${this.i18n.t('month.' + this.month())} ${this.year()}`);
  readonly isCurrentMonth = computed(
    () => this.year() === this.today.getFullYear() && this.month() === this.today.getMonth() + 1,
  );
  // The API only accepts budgets from this year on, so past years are read-only
  readonly canCreate = computed(() => this.year() >= CURRENT_YEAR);

  // Navigation limits: expenses go back to January of last year, budgets up to 5 years ahead
  readonly canGoBack = computed(() => this.year() > CURRENT_YEAR - 1 || this.month() > 1);
  readonly canGoForward = computed(() => this.year() < CURRENT_YEAR + 5 || this.month() < 12);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ budgets: this.budgetService.list(), expenses: this.expenseService.list() }).subscribe({
      next: ({ budgets, expenses }) => {
        this.budgets.set(budgets);
        this.expenses.set(expenses);
        this.loading.set(false);
        this.loadError.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(err, this.i18n.t('app.connectionError')));
      },
    });
  }

  move(delta: number): void {
    const next = shiftMonth(this.year(), this.month(), delta);
    this.year.set(next.year);
    this.month.set(next.month);
  }

  goToCurrentMonth(): void {
    this.year.set(this.today.getFullYear());
    this.month.set(this.today.getMonth() + 1);
  }

  categoryName(idCategoria: number): string {
    return this.lookups.categories().find((c) => c.idCategoria === idCategoria)?.nombreCategoria ?? '—';
  }

  categoryColor(idCategoria: number): string {
    return this.lookups.categories().find((c) => c.idCategoria === idCategoria)?.colorHexCategoria ?? 'inherit';
  }

  categoryIconOf(idCategoria: number): string {
    return categoryIcon(this.lookups.categories().find((c) => c.idCategoria === idCategoria)?.urlIconoCategoria);
  }

  levelIcon(level: BudgetLevel): string {
    return { ok: 'check_circle', warning: 'warning', over: 'error' }[level];
  }

  // New budget: the month on screen (and the category, from "expenses without a budget") is already filled
  create(idCategoria?: number): void {
    this.openForm(null, { idCategoria, mes: this.month(), anio: this.year() });
  }

  edit(budget: Budget): void {
    this.openForm(budget);
  }

  remove(budget: Budget): void {
    this.dialog
      .open(ConfirmDialog, { width: '420px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.budgetService.delete(budget.idPresupuesto)),
      )
      .subscribe({
        next: () => this.done('form.deleted'),
        error: (err) => this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 5000 }),
      });
  }

  private openForm(item: Budget | null, initial?: Record<string, unknown>): void {
    this.dialog
      .open(ResourceFormDialog, { data: { config: this.config, item, initial }, width: '640px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter((result): result is { body: Budget } => !!result))
      .subscribe(({ body }) => {
        // Show the month where the budget was saved (it may be another one), so it does not "disappear"
        this.year.set(Number(body.anio));
        this.month.set(Number(body.mes));
        this.done('form.saved');
      });
  }

  private done(messageKey: string): void {
    this.snackBar.open(this.i18n.t(messageKey), 'OK', { duration: 3000 });
    this.load();
  }
}
