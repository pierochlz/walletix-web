import { computed, inject, Injectable, signal } from '@angular/core';
import { SelectOption } from '../shared/resource-config';
import { categoryIcon } from './category-icons';
import { Category, Merchant } from './models';
import { CategoryService, MerchantService } from './resource.services';

// Keeps categories and merchants in memory to fill the selects and show names in the tables
@Injectable({ providedIn: 'root' })
export class LookupStore {
  private categoryService = inject(CategoryService);
  private merchantService = inject(MerchantService);

  readonly categories = signal<Category[]>([]);
  readonly merchants = signal<Merchant[]>([]);

  readonly expenseCategories = computed(() => this.toOptions(this.categories().filter((c) => c.tipoCategoria === 'gasto')));
  readonly incomeCategories = computed(() => this.toOptions(this.categories().filter((c) => c.tipoCategoria === 'ingreso')));
  readonly allCategories = computed(() => this.toOptions(this.categories()));
  readonly merchantOptions = computed(() =>
    this.merchants().map((m) => ({ value: m.idComerciante, label: m.nombreComerciante })),
  );

  refresh(): void {
    this.categoryService.list().subscribe({ next: (list) => this.categories.set(list), error: () => {} });
    this.merchantService.list().subscribe({ next: (list) => this.merchants.set(list), error: () => {} });
  }

  // The selects show the icon of each category with its color
  private toOptions(list: Category[]): SelectOption[] {
    return list.map((c) => ({
      value: c.idCategoria,
      label: c.nombreCategoria,
      icon: categoryIcon(c.urlIconoCategoria),
      color: c.colorHexCategoria,
    }));
  }
}
