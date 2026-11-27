import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../core/i18n/translate.pipe';

// Gray placeholders with the shape of the content while the API answers (the API and the database are in
// different regions, so a screen can take a few seconds). Screen readers hear "Loading..." once.
//   cards: a grid of cards (dashboard, challenges, learn, profile)
//   list:  lines with an icon (notifications, latest expenses)
//   rows:  rows of a table
@Component({
  selector: 'app-skeleton',
  imports: [TranslatePipe],
  template: `
    <div class="skeleton" [class]="variant()" role="status">
      <span class="sr-only">{{ 'app.loading' | t }}</span>
      @for (i of items(); track i) {
        @switch (variant()) {
          @case ('cards') {
            <div class="card" aria-hidden="true">
              <span class="wx-skeleton icon"></span>
              <span class="wx-skeleton line short"></span>
              <span class="wx-skeleton line big"></span>
            </div>
          }
          @case ('list') {
            <div class="item" aria-hidden="true">
              <span class="wx-skeleton icon"></span>
              <span class="text">
                <span class="wx-skeleton line"></span>
                <span class="wx-skeleton line short"></span>
              </span>
            </div>
          }
          @default {
            <div class="row" aria-hidden="true">
              <span class="wx-skeleton line"></span>
              <span class="wx-skeleton line short"></span>
              <span class="wx-skeleton line short"></span>
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .skeleton {
      display: block;
      width: 100%;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
      gap: 16px;
      margin: 8px 0 16px;
    }
    .card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      background: var(--wx-card-bg);
    }
    .item,
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
    }
    .row {
      padding: 12px 16px;
    }
    .text {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
    }
    .icon {
      flex: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .line {
      flex: 1;
      height: 12px;
      min-width: 40px;
    }
    .line.short {
      flex: 0 0 30%;
      max-width: 140px;
    }
    .card .line.short {
      width: 50%;
    }
    .line.big {
      height: 24px;
      width: 70%;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  `,
})
export class Skeleton {
  readonly variant = input<'cards' | 'list' | 'rows'>('cards');
  readonly count = input(3);
  readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
