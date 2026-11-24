import { localMonth } from '../../core/dates';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
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
import { ExpenseService, IncomeService, SavingGoalService } from '../../core/resource.services';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
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

  // The user's balance converted with the rates of the external service
  readonly currencies = ['USD', 'EUR', 'BRL', 'CLP', 'MXN', 'COP'];
  readonly converted = computed(() => {
    const rates = this.rates()?.rates;
    const balance = Number(this.auth.user()?.saldoActualUsuario ?? 0);
    if (!rates) return [];
    return this.currencies.filter((c) => rates[c]).map((code) => ({ code, value: balance * rates[code] }));
  });

  ngOnInit(): void {
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
