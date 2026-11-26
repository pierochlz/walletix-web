import { localMonth } from '../../core/dates';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ExchangeRates, ExchangeRateService } from '../../core/exchange-rate.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Expense, Income, SavingGoal } from '../../core/models';
import { onlyOwn } from '../../core/ownership';
import { average, balanceEvolution, byCategory, isAntExpense, lastMonths, monthlyFlows, monthRange, rangeError } from '../../core/finance';
import { LookupStore } from '../../core/lookup.store';
import { blobErrorMessage, reportFileName, ReportService, saveFile } from '../../core/report.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarChart, DonutChart, LineChart } from '../../shared/charts';
import { ExpenseService, IncomeService, SavingGoalService } from '../../core/resource.services';
import { LearnService } from '../../core/learn.service';
import { LearnDetail } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    LineChart,
    BarChart,
    DonutChart,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TranslatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  private expenseService = inject(ExpenseService);
  private incomeService = inject(IncomeService);
  private goalService = inject(SavingGoalService);
  private exchangeRateService = inject(ExchangeRateService);
  private learnService = inject(LearnService);
  private lookups = inject(LookupStore);
  private reports = inject(ReportService);
  private snackBar = inject(MatSnackBar);

  // "Tip de 30 segundos" of the report: a different financial tip each day
  readonly tip = signal<LearnDetail | null>(null);

  // What the API returns (for an ADMIN, the records of all users)
  private readonly allExpenses = signal<Expense[]>([]);
  private readonly allIncomes = signal<Income[]>([]);
  private readonly allGoals = signal<SavingGoal[]>([]);

  // The dashboard is about MY finances: only the records of the logged-in user
  private readonly myId = computed(() => this.auth.user()?.idUsuario);
  readonly expenses = computed(() => onlyOwn(this.allExpenses(), this.myId()));
  readonly incomes = computed(() => onlyOwn(this.allIncomes(), this.myId()));
  readonly goals = computed(() => onlyOwn(this.allGoals(), this.myId()));
  readonly rates = signal<ExchangeRates | null>(null);
  readonly ratesError = signal(false);

  // "yyyy-MM" of today, to add up only this month's records
  private readonly thisMonth = localMonth();

  readonly monthExpense = computed(() =>
    this.expenses()
      .filter((e) => e.fechaGasto.startsWith(this.thisMonth))
      .reduce((total, e) => total + Number(e.montoGasto), 0),
  );
  readonly monthIncome = computed(() =>
    this.incomes()
      .filter((i) => i.fecha.startsWith(this.thisMonth))
      .reduce((total, i) => total + Number(i.monto), 0),
  );
  readonly latestExpenses = computed(() =>
    [...this.expenses()].sort((a, b) => b.fechaGasto.localeCompare(a.fechaGasto)).slice(0, 5),
  );

  // ---------- US08: views of the dashboard ----------
  readonly view = signal<'summary' | 'compare' | 'category'>('summary');

  private readonly categoryInfo = computed(
    () => new Map(this.lookups.categories().map((c) => [c.idCategoria, { name: c.nombreCategoria, color: c.colorHexCategoria }])),
  );
  readonly currency = (n: number) =>
    new Intl.NumberFormat(this.i18n.locale(), { style: 'currency', currency: 'PEN', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })
      .format(n)
      .replace('PEN', 'S/');
  // With cents, for the amounts of the legend
  readonly money = (n: number) =>
    new Intl.NumberFormat(this.i18n.locale(), { style: 'currency', currency: 'PEN', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(n)
      .replace('PEN', 'S/');
  monthLabel(month: string, withYear = false): string {
    const [y, m] = month.split('-').map(Number);
    return new Intl.DateTimeFormat(this.i18n.locale(), { month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' }).format(
      new Date(Date.UTC(y, m - 1, 1)),
    );
  }

  // US06: ant expenses of this month
  readonly monthAnt = computed(() => {
    const names = this.categoryInfo();
    const ants = this.expenses().filter((e) => e.fechaGasto.startsWith(this.thisMonth) && isAntExpense(e, names.get(e.idCategoria)?.name));
    return { total: ants.reduce((t, e) => t + Number(e.montoGasto), 0), count: ants.length };
  });

  // US07: balance at the end of each of the last 6 months
  readonly evolution = computed(() =>
    balanceEvolution(Number(this.auth.user()?.saldoActualUsuario ?? 0), this.expenses(), this.incomes(), lastMonths(this.thisMonth, 6)).map((p) => ({
      label: this.monthLabel(p.month),
      value: p.balance,
    })),
  );
  readonly hasMovements = computed(() => this.expenses().length + this.incomes().length > 0);

  // US09: month range ("Desde" - "Hasta") with shortcuts and "Actualizar"
  readonly from = signal(lastMonths(this.thisMonth, 3)[0]);
  readonly to = signal(this.thisMonth);
  readonly applied = signal({ from: lastMonths(this.thisMonth, 3)[0], to: this.thisMonth });
  readonly rangeErrorKey = signal<string | null>(null);
  readonly maxMonth = this.thisMonth;
  readonly flows = computed(() => monthlyFlows(this.expenses(), this.incomes(), monthRange(this.applied().from, this.applied().to)));
  readonly avgIncome = computed(() => average(this.flows().map((f) => f.income)));
  readonly avgExpense = computed(() => average(this.flows().map((f) => f.expense)));
  readonly flowLabels = computed(() => this.flows().map((f) => this.monthLabel(f.month)));
  readonly flowSeries = computed(() => [
    { name: this.i18n.t('dashboard.incomes'), color: '#16a34a', values: this.flows().map((f) => f.income) },
    { name: this.i18n.t('dashboard.expenses'), color: '#dc2626', values: this.flows().map((f) => f.expense) },
  ]);

  shortcut(months: number): void {
    this.from.set(lastMonths(this.thisMonth, months)[0]);
    this.to.set(this.thisMonth);
    this.applyRange();
  }

  // US39: PDF of the months of the comparison (the range that is on screen)
  readonly downloading = signal(false);
  downloadPdf(): void {
    const { from, to } = this.applied();
    this.downloading.set(true);
    this.reports.pdf(from, to).subscribe({
      next: (file) => {
        this.downloading.set(false);
        saveFile(file, reportFileName(from, to));
        this.snackBar.open(this.i18n.t('dashboard.pdfDone'), 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: async (err) => {
        this.downloading.set(false);
        this.snackBar.open(await blobErrorMessage(err, this.i18n.t('dashboard.pdfError')), 'OK', { duration: 6000 });
      },
    });
  }

  applyRange(): void {
    const error = rangeError(this.from(), this.to(), this.thisMonth);
    this.rangeErrorKey.set(error);
    if (!error) this.applied.set({ from: this.from(), to: this.to() });
  }

  // US10: distribution by category of the chosen month
  readonly categoryType = signal<'expense' | 'income'>('expense');
  readonly categoryMonth = signal(this.thisMonth);
  readonly slices = computed(() => {
    const month = this.categoryMonth();
    const records =
      this.categoryType() === 'expense'
        ? this.expenses().filter((e) => e.fechaGasto.startsWith(month)).map((e) => ({ idCategoria: e.idCategoria, amount: Number(e.montoGasto) }))
        : this.incomes().filter((i) => i.fecha.startsWith(month)).map((i) => ({ idCategoria: i.idCategoria, amount: Number(i.monto) }));
    return byCategory(records, this.categoryInfo(), this.i18n.t('dashboard.others'));
  });

  // The user's balance converted with the rates of the external service
  readonly currencies = ['USD', 'EUR', 'BRL', 'CLP', 'MXN', 'COP'];
  readonly converted = computed(() => {
    const rates = this.rates()?.rates;
    const balance = Number(this.auth.user()?.saldoActualUsuario ?? 0);
    if (!rates) return [];
    return this.currencies.filter((c) => rates[c]).map((code) => ({ code, value: balance * rates[code] }));
  });

  ngOnInit(): void {
    if (this.lookups.categories().length === 0) this.lookups.refresh(); // category names and colors of the charts
    this.learnService.tipOfTheDay().subscribe({ next: (tip) => this.tip.set(tip), error: () => this.tip.set(null) });
    this.expenseService.list().subscribe({ next: (list) => this.allExpenses.set(list), error: () => {} });
    this.incomeService.list().subscribe({ next: (list) => this.allIncomes.set(list), error: () => {} });
    this.goalService.list().subscribe({ next: (list) => this.allGoals.set(list), error: () => {} });
    this.exchangeRateService.latestFromPen().subscribe({
      next: (rates) => this.rates.set(rates),
      error: () => this.ratesError.set(true),
    });
  }

  progress(goal: SavingGoal): number {
    if (!goal.montoObjetivo) return 0;
    return Math.min(100, Math.round((Number(goal.montoActual) / Number(goal.montoObjetivo)) * 100));
  }
}
