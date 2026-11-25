import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { categoriesOf, categoryLabelKey, filterItems, learnIcon, LearnTab, setFavorite } from '../../core/learn';
import { LearnService } from '../../core/learn.service';
import { LearnItem } from '../../core/models';
import { MessageDialog } from '../challenges/message-dialog';

// "Consejos financieros" of the report (US31-US35): categories, search, tips, micro-lessons with quiz,
// favorites and locked content with the condition to unlock it.
@Component({
  selector: 'app-learn-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './learn.html',
  styleUrl: './learn.css',
})
export class LearnPage implements OnInit {
  private service = inject(LearnService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);

  readonly items = signal<LearnItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly tab = signal<LearnTab>('all');
  readonly category = signal<string | null>(null);
  readonly search = signal('');
  readonly busy = signal<number | null>(null); // favorite being saved

  // The categories come from all the content (not only from the current search)
  private readonly allCategories = signal<string[]>([]);
  readonly categories = this.allCategories.asReadonly();
  readonly shown = computed(() => filterItems(this.items(), this.tab(), this.category()));
  readonly favoritesCount = computed(() => this.items().filter((i) => i.favorito).length);
  readonly icon = learnIcon;
  readonly categoryLabel = categoryLabelKey;

  private searches = new Subject<string>();

  ngOnInit(): void {
    // The API searches inside titles, descriptions and the content of the lessons
    this.searches
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((text) => {
          this.loading.set(true);
          return this.service.list(text);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          this.items.set(items);
          if (!this.search().trim()) this.allCategories.set(categoriesOf(items));
          this.loading.set(false);
          this.loadError.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(apiErrorMessage(err, this.i18n.t('form.error')));
        },
      });
    this.searches.next('');
  }

  onSearch(text: string): void {
    this.search.set(text);
    this.searches.next(text.trim());
  }

  clearSearch(): void {
    this.onSearch('');
    this.category.set(null);
    this.tab.set('all');
  }

  selectCategory(category: string | null): void {
    this.category.set(this.category() === category ? null : category);
  }

  // US33: a locked card explains what to do instead of opening
  open(item: LearnItem): void {
    if (item.bloqueado) {
      this.dialog.open(MessageDialog, {
        data: { icon: 'lock', title: 'learn.lockedTitle', text: 'learn.lockedText', textParams: { condition: item.condicion ?? '' }, accept: 'learn.goChallenges', cancel: 'learn.close' },
        width: '440px',
        maxWidth: '95vw',
      })
        .afterClosed()
        .subscribe((goToChallenges) => {
          if (goToChallenges) this.router.navigate(['/challenges']);
        });
      return;
    }
    this.router.navigate(['/learn', item.idMicroleccion]);
  }

  // US32: the star changes at once; if the API fails it goes back
  toggleFavorite(item: LearnItem, event: Event): void {
    event.stopPropagation();
    this.busy.set(item.idMicroleccion);
    this.items.update((list) => setFavorite(list, item.idMicroleccion, !item.favorito));
    this.service.toggleFavorite(item.idMicroleccion).subscribe({
      next: (result) => {
        this.busy.set(null);
        this.items.update((list) => setFavorite(list, result.idMicroleccion, result.favorito));
        this.snackBar.open(this.i18n.t(result.favorito ? 'learn.favoriteAdded' : 'learn.favoriteRemoved', { count: result.totalFavoritos }), 'OK', {
          duration: 3000,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(null);
        this.items.update((list) => setFavorite(list, item.idMicroleccion, item.favorito));
        this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 5000 });
      },
    });
  }
}
