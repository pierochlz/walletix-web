import { effect, inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from './i18n.service';

// Texts of the Angular Material paginator ("Items per page", "1 – 10 of 25") in the chosen language
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private i18n = inject(I18nService);

  constructor() {
    super();
    effect(() => {
      this.i18n.lang(); // re-run when the language changes
      this.itemsPerPageLabel = this.i18n.t('paginator.itemsPerPage');
      this.firstPageLabel = this.i18n.t('paginator.first');
      this.previousPageLabel = this.i18n.t('paginator.previous');
      this.nextPageLabel = this.i18n.t('paginator.next');
      this.lastPageLabel = this.i18n.t('paginator.last');
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return this.i18n.t('paginator.range', { start: 0, end: 0, length: 0 });
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return this.i18n.t('paginator.range', { start: start + 1, end, length });
  };
}
