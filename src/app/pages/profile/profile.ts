import { localToday } from '../../core/dates';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NotificationStore } from '../../core/notification.store';
import { NotificationPreferences } from '../../core/models';
import { forkJoin, of } from 'rxjs';
import { maxTwoDecimals } from '../../core/validators';
import { FormsModule } from '@angular/forms';
import { Theme, THEMES, themeIcon, ThemeService } from '../../core/theme.service';
import { Lang } from '../../core/i18n/i18n.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChallengesService } from '../../core/challenges.service';
import { levelProgress } from '../../core/challenges';
import { LookupStore } from '../../core/lookup.store';
import { ChallengeSummary, Expense, Income, Medal, SavingGoal } from '../../core/models';
import { onlyOwn } from '../../core/ownership';
import { ageOn, financialStats, initials, spendingHabits } from '../../core/profile-stats';
import { ExpenseService, IncomeService, SavingGoalService } from '../../core/resource.services';
import { Skeleton } from '../../shared/skeleton';

// US36: my profile with my financial statistics and spending habits,
// plus edit my data (PUT /usuarios/actualiza) and change my password (PUT /usuarios/contrasena)
@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    FormsModule,
    MatProgressBarModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    TranslatePipe, Skeleton,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  readonly i18n = inject(I18nService);
  private expenseService = inject(ExpenseService);
  private incomeService = inject(IncomeService);
  private goalService = inject(SavingGoalService);
  private challenges = inject(ChallengesService);
  private lookups = inject(LookupStore);
  private themes = inject(ThemeService);
  private notificationStore = inject(NotificationStore);
  private route = inject(ActivatedRoute);

  // US25: null until the API answers (the checkboxes are disabled meanwhile)
  readonly notifyPrefs = signal<NotificationPreferences | null>(null);
  readonly notifyTypes: (keyof NotificationPreferences)[] = ['alerta', 'logro', 'reto'];
  readonly savingPrefs = signal(false);

  setNotify(type: keyof NotificationPreferences, value: boolean): void {
    this.notifyPrefs.update((p) => (p ? { ...p, [type]: value } : p));
  }

  // ---------- US37: preferences (applied and saved when the user confirms) ----------
  readonly themeOptions = THEMES;
  readonly themeIcon = themeIcon;
  // linkedSignal: if the theme or language changes from the toolbar, the card shows the new value
  readonly pendingTheme = linkedSignal<Theme>(() => this.themes.theme());
  readonly pendingLang = linkedSignal<Lang>(() => this.i18n.lang());

  savePreferences(): void {
    this.themes.setTheme(this.pendingTheme());
    this.i18n.setLang(this.pendingLang());
    // US25: the notification types are saved in the API (they apply on every device)
    const prefs = this.notifyPrefs();
    this.savingPrefs.set(true);
    forkJoin([prefs ? this.notificationStore.savePreferences(prefs) : of(null)]).subscribe({
      next: () => {
        this.savingPrefs.set(false);
        this.snackBar.open(this.i18n.t('preferences.saved'), 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.savingPrefs.set(false);
        this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 6000 });
      },
    });
  }

  // ---------- US36: statistics and spending habits (only MY records, also for an ADMIN) ----------
  private readonly allExpenses = signal<Expense[]>([]);
  private readonly allIncomes = signal<Income[]>([]);
  private readonly allGoals = signal<SavingGoal[]>([]);
  readonly loaded = signal(0); // how many of the 3 lists arrived
  readonly summary = signal<ChallengeSummary | null>(null);
  readonly medals = signal<Medal[]>([]);
  private readonly myId = computed(() => this.auth.user()?.idUsuario);
  private readonly expenses = computed(() => onlyOwn(this.allExpenses(), this.myId()));
  private readonly categoryNames = computed(() => new Map(this.lookups.categories().map((c) => [c.idCategoria, c.nombreCategoria])));

  readonly initials = computed(() => initials(this.auth.user()?.nombreUsuario));
  readonly age = computed(() => ageOn(this.auth.user()?.fechaNacimientoUsuario, localToday()));
  readonly stats = computed(() =>
    financialStats(this.expenses(), onlyOwn(this.allIncomes(), this.myId()), onlyOwn(this.allGoals(), this.myId()), localToday()),
  );
  readonly habits = computed(() => spendingHabits(this.expenses(), this.categoryNames(), localToday()));
  readonly levelPercent = computed(() => {
    const s = this.summary();
    return s ? levelProgress(s) : 0;
  });
  readonly medalsUnlocked = computed(() => this.medals().filter((m) => m.desbloqueada).length);

  categoryName(id: number): string {
    return this.categoryNames().get(id) ?? '—';
  }

  weekdayName(day: number): string {
    // 2026-11-22 was a Sunday (day 0)
    const name = new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 10, 22 + day)));
    return name.charAt(0).toUpperCase() + name.slice(1); // "martes" -> "Martes"
  }

  ngOnInit(): void {
    if (this.lookups.categories().length === 0) this.lookups.refresh();
    const done = () => this.loaded.update((n) => n + 1);
    this.expenseService.list().subscribe({ next: (list) => this.allExpenses.set(list), error: done, complete: done });
    this.incomeService.list().subscribe({ next: (list) => this.allIncomes.set(list), error: done, complete: done });
    this.goalService.list().subscribe({ next: (list) => this.allGoals.set(list), error: done, complete: done });
    // Level and medals of the challenges center (the summary also hands out the achievements already earned)
    this.challenges.summary().subscribe({ next: (s) => this.summary.set(s), error: () => {} });
    this.challenges.medals().subscribe({ next: (m) => this.medals.set(m), error: () => {} });
    this.notificationStore.preferences().subscribe({ next: (p) => this.notifyPrefs.set(p), error: () => this.notifyPrefs.set(null) });
    this.scrollToPreferences = this.route.snapshot.fragment === 'preferencias';
  }

  readonly segments = ['estudiante', 'trabajador', 'independiente'];
  readonly today = localToday();
  readonly profileError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombreUsuario: ['', [Validators.required, Validators.maxLength(50)]],
    correoUsuario: ['', [Validators.required, Validators.email]],
    telefonoUsuario: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    fechaNacimientoUsuario: ['', Validators.required],
    segmentoUsuario: ['', Validators.required],
    saldoActualUsuario: [0, [Validators.required, Validators.min(0), maxTwoDecimals]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    contrasenaActual: ['', Validators.required],
    contrasenaNueva: ['', [Validators.required, Validators.minLength(6)]],
  });

  // From "Choose which notifications to receive" (/profile#preferencias) the card at the end of the page is shown.
  // It waits for the statistics above: if it scrolled before, they would push the card out of view when they load.
  private scrollToPreferences = false;
  private readonly scrollWhenReady = effect(() => {
    if (this.scrollToPreferences && this.loaded() >= 3 && this.summary()) {
      this.scrollToPreferences = false;
      setTimeout(() => document.getElementById('preferencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  });

  constructor() {
    // When the user arrives from GET /usuarios/yo, the form is filled with their data
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.form.patchValue({ ...user, telefonoUsuario: String(user.telefonoUsuario) });
      }
    });
  }

  saveProfile(): void {
    const user = this.auth.user();
    if (this.form.invalid || !user) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const body = { ...user, ...values, telefonoUsuario: Number(values.telefonoUsuario) };
    this.profileError.set(null);
    // The session token is tied to the email: after changing it the old token is no longer valid.
    // Instead of being sent to the login without explanation, the user is told why.
    const emailChanged = values.correoUsuario.trim().toLowerCase() !== (user.correoUsuario ?? '').trim().toLowerCase();
    if (emailChanged) {
      this.auth.updateProfile(body).subscribe({
        next: () => {
          this.snackBar.open(this.i18n.t('profile.emailChanged'), 'OK', { duration: 8000 });
          this.auth.logout();
        },
        error: (err) => this.profileError.set(apiErrorMessage(err, this.i18n.t('form.error'))),
      });
      return;
    }
    this.auth
      .updateProfile(body)
      .pipe(switchMap(() => this.auth.loadCurrentUser())) // reload my data from the API
      .subscribe({
        next: () => this.snackBar.open(this.i18n.t('form.saved'), 'OK', { duration: 3000 }),
        error: (err) => this.profileError.set(apiErrorMessage(err, this.i18n.t('form.error'))),
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { contrasenaActual, contrasenaNueva } = this.passwordForm.getRawValue();
    this.passwordError.set(null);
    this.auth.changePassword(contrasenaActual, contrasenaNueva).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open(this.i18n.t('form.saved'), 'OK', { duration: 3000 });
      },
      error: (err) => this.passwordError.set(apiErrorMessage(err, this.i18n.t('form.error'))),
    });
  }
}
