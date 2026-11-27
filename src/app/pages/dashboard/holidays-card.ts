import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { localToday } from '../../core/dates';
import { daysUntil, Holiday, upcomingHolidays, whenLabel } from '../../core/holidays';
import { HolidayService } from '../../core/holidays.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Skeleton } from '../../shared/skeleton';

// Second third-party API: the next public holidays in Peru (Nager.Date).
// Long weekends usually raise spending, so the card links to the budgets.
@Component({
  selector: 'app-holidays-card',
  imports: [DatePipe, MatCardModule, RouterLink, TranslatePipe, Skeleton],
  template: `
    <mat-card appearance="outlined" class="holidays">
      <mat-card-header>
        <mat-card-title><h2>{{ 'holidays.title' | t }}</h2></mat-card-title>
        <mat-card-subtitle>{{ 'holidays.hint' | t }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (error()) {
          <p class="muted" role="status">{{ 'holidays.error' | t }}</p>
        } @else if (loading()) {
          <app-skeleton variant="list" [count]="3" />
        } @else if (!next().length) {
          <p class="muted">{{ 'holidays.none' | t }}</p>
        } @else {
          <ul class="holiday-list">
            @for (h of next(); track h.date) {
              <li>
                <span class="holiday-date" aria-hidden="true">
                  <span class="day">{{ h.date | date: 'd' : 'UTC' : i18n.locale() }}</span>
                  <span class="month">{{ h.date | date: 'MMM' : 'UTC' : i18n.locale() }}</span>
                </span>
                <span class="holiday-main">
                  <span class="holiday-name">{{ h.name }}</span>
                  <small class="muted">{{ h.date | date: 'fullDate' : 'UTC' : i18n.locale() }}</small>
                </span>
                <span class="holiday-when">{{ h.when.key | t: h.when.params }}</span>
              </li>
            }
          </ul>
          <small class="muted">
            {{ 'holidays.source' | t }} · <a href="https://date.nager.at" target="_blank" rel="noopener">date.nager.at</a> ·
            <a routerLink="/budgets">{{ 'holidays.checkBudget' | t }}</a>
          </small>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .holidays {
      margin-bottom: 16px;
    }
    h2 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }
    .muted {
      color: var(--mat-sys-on-surface-variant);
    }
    .holiday-list {
      list-style: none;
      margin: 4px 0 12px;
      padding: 0;
    }
    .holiday-list li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .holiday-list li:last-child {
      border-bottom: none;
    }
    .holiday-date {
      display: flex;
      flex: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      line-height: 1.1;
    }
    .day {
      font-weight: 700;
      font-size: 18px;
    }
    .month {
      font-size: 11px;
      text-transform: uppercase;
    }
    .holiday-main {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }
    .holiday-name {
      font-weight: 600;
    }
    .holiday-when {
      flex: none;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-primary);
    }
  `,
})
export class HolidaysCard implements OnInit {
  readonly i18n = inject(I18nService);
  private service = inject(HolidayService);

  private readonly holidays = signal<Holiday[] | null>(null);
  readonly error = signal(false);
  readonly loading = computed(() => this.holidays() === null && !this.error());
  // Spanish or English name according to the language; "today", "tomorrow" or "in N days"
  readonly next = computed(() => {
    const today = localToday();
    return upcomingHolidays(this.holidays() ?? [], today).map((h) => ({
      ...h,
      name: this.i18n.lang() === 'en' ? h.name : h.localName,
      when: whenLabel(daysUntil(h.date, today)),
    }));
  });

  ngOnInit(): void {
    this.service.upcoming().subscribe({
      next: (list) => this.holidays.set(list),
      error: () => this.error.set(true),
    });
  }
}
