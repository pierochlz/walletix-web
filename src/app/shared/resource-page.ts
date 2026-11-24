import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { apiErrorMessage } from '../core/api-error';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { ConfirmDialog } from './confirm-dialog';
import { FieldDef, ResourceConfig } from './resource-config';
import { ResourceFormDialog } from './resource-form-dialog';

// Generic CRUD page: table with sort, filter and pagination + dialogs to create, edit and delete
@Component({
  selector: 'app-resource-page',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    TranslatePipe,
  ],
  templateUrl: './resource-page.html',
  styleUrl: './resource-page.css',
})
export class ResourcePage implements OnInit, AfterViewInit {
  readonly config = input.required<ResourceConfig>();

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly i18n = inject(I18nService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  readonly dataSource = new MatTableDataSource<Record<string, any>>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly tableFields = computed(() => this.config().fields.filter((f) => f.inTable !== false));
  readonly canEdit = computed(() => this.config().canEdit?.() ?? true);
  readonly columns = computed(() => [
    ...this.tableFields().map((f) => f.key),
    ...(this.canEdit() ? ['actions'] : []),
  ]);

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator();
    this.dataSource.sort = this.sort();
  }

  load(): void {
    this.loading.set(true);
    this.config().service.list().subscribe({
      next: (rows) => {
        this.dataSource.data = rows;
        this.loading.set(false);
        this.loadError.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(err, this.i18n.t('app.connectionError')));
      },
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  // Text shown in a select-type column (the name of the category instead of its id)
  optionLabel(field: FieldDef, value: unknown): string {
    const option = field.options?.().find((o) => o.value === value);
    if (!option) return String(value ?? '');
    return field.translate ? this.i18n.t(option.label) : option.label;
  }

  openForm(item: Record<string, any> | null = null): void {
    this.dialog
      .open(ResourceFormDialog, { data: { config: this.config(), item }, width: '640px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter((result): result is { response: unknown } => !!result))
      .subscribe(({ response }) => this.changed('form.saved', response));
  }

  remove(item: Record<string, any>): void {
    const id = item[this.config().idKey];
    this.dialog
      .open(ConfirmDialog, { width: '420px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.config().service.delete(id)),
      )
      .subscribe({
        next: () => this.changed('form.deleted'),
        error: (err) => this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 5000 }),
      });
  }

  private changed(messageKey: string, response?: unknown): void {
    const warning = this.config().warningFromResponse?.(response);
    if (warning) {
      // Warnings stay longer and use the warning style (see styles.css)
      this.snackBar.open(`⚠️ ${warning}`, 'OK', { duration: 8000, panelClass: 'snack-warning', politeness: 'assertive' });
    } else {
      this.snackBar.open(this.i18n.t(messageKey), 'OK', { duration: 3000 });
    }
    this.config().afterChange?.();
    this.load();
  }
}
