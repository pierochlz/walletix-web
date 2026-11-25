import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { allAnswered, categoryLabelKey, learnIcon, paragraphs } from '../../core/learn';
import { LearnService } from '../../core/learn.service';
import { LearnDetail, QuizResult } from '../../core/models';
import { NotificationStore } from '../../core/notification.store';

// An opened micro-lesson or tip (US34) and its quiz (US35). The API grades the answers.
@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatRadioModule, TranslatePipe],
  templateUrl: './lesson.html',
  styleUrl: './lesson.css',
})
export class LessonPage implements OnInit {
  private service = inject(LearnService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);
  private notifications = inject(NotificationStore);
  readonly i18n = inject(I18nService);

  private route = inject(ActivatedRoute); // /learn/:id

  readonly detail = signal<LearnDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly locked = signal(false);
  readonly answers = signal<Record<number, string>>({});
  readonly sending = signal(false);
  readonly result = signal<QuizResult | null>(null);
  readonly favoriteBusy = signal(false);

  readonly paragraphs = computed(() => paragraphs(this.detail()?.contenido));
  readonly canSend = computed(() => allAnswered(this.detail()?.preguntas ?? [], this.answers()) && !this.sending());
  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly categoryLabel = categoryLabelKey;
  readonly icon = learnIcon;

  private resultBox = viewChild<ElementRef<HTMLElement>>('resultBox');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // A typed address like /learn/abc goes back to the list instead of showing a technical error
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/learn']);
      return;
    }
    this.service.open(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        // US33: locked content -> the API answers 403 with the condition to unlock it
        this.locked.set(err.status === 403);
        this.loadError.set(apiErrorMessage(err, this.i18n.t('form.error')));
      },
    });
  }

  choose(idPregunta: number, letter: string): void {
    this.answers.update((a) => ({ ...a, [idPregunta]: letter }));
  }

  send(): void {
    const d = this.detail();
    if (!d || !this.canSend()) return;
    this.sending.set(true);
    this.service.sendQuiz(d.resumen.idMicroleccion, this.answers()).subscribe({
      next: (result) => {
        this.sending.set(false);
        this.result.set(result);
        if (result.aprobado) {
          this.detail.update((x) => (x ? { ...x, resumen: { ...x.resumen, aprobado: true, mejorPuntaje: Math.max(result.puntaje, x.resumen.mejorPuntaje ?? 0) } } : x));
        }
        // New points and medals: refresh the user (points on the dashboard) and the bell
        if (result.puntosGanados > 0 || result.logrosDesbloqueados.length > 0) {
          this.auth.loadCurrentUser().subscribe();
          this.notifications.refresh();
        }
        // Move the focus to the result so screen readers and keyboard users find it
        setTimeout(() => this.resultBox()?.nativeElement.focus());
      },
      error: (err) => {
        this.sending.set(false);
        this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 6000 });
      },
    });
  }

  retry(): void {
    this.result.set(null);
    this.answers.set({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFavorite(): void {
    const d = this.detail();
    if (!d) return;
    this.favoriteBusy.set(true);
    this.service.toggleFavorite(d.resumen.idMicroleccion).subscribe({
      next: (r) => {
        this.favoriteBusy.set(false);
        this.detail.set({ ...d, resumen: { ...d.resumen, favorito: r.favorito } });
        this.snackBar.open(this.i18n.t(r.favorito ? 'learn.favoriteAdded' : 'learn.favoriteRemoved', { count: r.totalFavoritos }), 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.favoriteBusy.set(false);
        this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 5000 });
      },
    });
  }

  back(): void {
    this.router.navigate(['/learn']);
  }
}
