import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { filter, forkJoin, of, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { addActive, applyProgress, challengeIcon, levelProgress, medalProgress, moveToHistory, verificationKey } from '../../core/challenges';
import { ChallengesService } from '../../core/challenges.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AvailableChallenge, ChallengeSummary, Medal, Participation, ProgressResult } from '../../core/models';
import { NotificationStore } from '../../core/notification.store';
import { CreateChallengeDialog } from './create-challenge-dialog';
import { MessageDialog, MessageDialogData } from './message-dialog';
import { ShareMedalDialog } from './share-medal-dialog';

// "Centro de Retos y Logros" of the report (US26-US30):
// summary (level, effectiveness, protected money, streak), active challenges with daily progress,
// available challenges with requirements, "create a new challenge" and the medal showcase.
@Component({
  selector: 'app-challenges-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule, CurrencyPipe, DatePipe, DecimalPipe, TranslatePipe],
  templateUrl: './challenges.html',
  styleUrl: './challenges.css',
})
export class ChallengesPage implements OnInit {
  private service = inject(ChallengesService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly i18n = inject(I18nService);

  readonly summary = signal<ChallengeSummary | null>(null);
  readonly available = signal<AvailableChallenge[]>([]);
  readonly medals = signal<Medal[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false); // thin bar while the rest of the data is reloaded in the background
  readonly loadError = signal<string | null>(null);
  readonly busy = signal<number | null>(null); // id of the challenge being saved (disables its button)

  readonly levelPercent = computed(() => {
    const s = this.summary();
    return s ? levelProgress(s) : 0;
  });
  // Challenges the user is already in (or completed) do not appear again in "Available"
  readonly availableToShow = computed(() => {
    const s = this.summary();
    const taken = new Set([...(s?.activos ?? []), ...(s?.historial ?? []).filter((p) => p.estadoDesafio === 'COMPLETADO')].map((p) => p.idDesafio));
    return this.available().filter((c) => !taken.has(c.idDesafio));
  });
  readonly unlocked = computed(() => this.medals().filter((m) => m.desbloqueada).length);
  // Unlocked medals first, then the ones with more progress
  readonly sortedMedals = computed(() =>
    [...this.medals()].sort((a, b) => Number(b.desbloqueada) - Number(a.desbloqueada) || (medalProgress(b) ?? -1) - (medalProgress(a) ?? -1)),
  );
  readonly icon = challengeIcon;
  readonly verification = verificationKey;
  readonly medalPercent = medalProgress;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.refreshing.set(true);
    // First the summary (it unlocks the new medals), then the rest: so the medals are never checked twice at once
    this.service
      .summary()
      .pipe(switchMap((summary) => forkJoin({ summary: of(summary), available: this.service.available(), medals: this.service.medals() })))
      .subscribe({
      next: ({ summary, available, medals }) => {
        this.summary.set(summary);
        this.available.set(available);
        this.medals.set(medals);
        this.loading.set(false);
        this.refreshing.set(false);
        this.loadError.set(null);
        this.afterChange();
      },
      error: (err) => {
        this.loading.set(false);
        this.refreshing.set(false);
        this.loadError.set(apiErrorMessage(err, this.i18n.t('app.connectionError')));
      },
    });
  }

  // Points and notifications may have changed (XP, medals, "challenge completed")
  private afterChange(): void {
    this.auth.loadCurrentUser().subscribe({ error: () => {} });
    this.notifications.refresh();
  }

  registerProgress(participation: Participation): void {
    this.busy.set(participation.idUsuarioDesafio);
    this.service.registerProgress(participation.idUsuarioDesafio).subscribe({
      next: (result) => {
        this.busy.set(null);
        this.updateNow((s) => applyProgress(s, participation.idUsuarioDesafio, result)); // the card changes at once
        this.celebrate(participation, result);
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        // Unhappy path of the report: "Ya registraste tu progreso de hoy" -> "Entendido"
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.openMessage({ icon: 'schedule', title: 'challenges.alreadyTitle', text: 'challenges.alreadyText', accept: 'challenges.understood' });
          this.load();
        } else if (err instanceof HttpErrorResponse && err.status === 422) {
          // Verified with the expenses: today there is an expense that breaks the challenge
          this.openMessage({
            icon: 'block',
            title: 'challenges.brokenTitle',
            text: 'challenges.brokenText',
            textParams: { reason: apiErrorMessage(err, this.i18n.t('form.error')) },
            accept: 'challenges.understood',
          });
        } else {
          this.showError(err);
        }
      },
    });
  }

  // "¡Progreso registrado! +20 XP · Día 6 de 7" or, on the last day, the "challenge completed" message
  private celebrate(participation: Participation, result: ProgressResult): void {
    if (result.completado) {
      this.openMessage({
        icon: 'emoji_events',
        tone: 'success',
        title: 'challenges.completedTitle',
        text: (result.puntosRecompensa > 0 ? 'challenges.completedText' : 'challenges.completedTextPersonal') + (result.xpGanado > 0 ? '' : 'NoXp'),
        textParams: { title: participation.titulo, points: result.puntosRecompensa, xp: result.xpGanado },
        accept: 'challenges.great',
      });
    } else {
      this.snackBar.open(
        // The +20 XP of the daily progress are earned once a day, even with several challenges
        this.i18n.t(result.xpGanado > 0 ? 'challenges.progressSaved' : 'challenges.progressSavedNoXp', {
          xp: result.xpGanado,
          day: result.diaActual,
          total: result.duracionDias,
        }),
        'OK',
        { duration: 4000, panelClass: 'snack-success' },
      );
    }
    for (const medal of result.logrosDesbloqueados) {
      this.snackBar.open(this.i18n.t('challenges.medalUnlocked', { name: medal }), 'OK', { duration: 5000, panelClass: 'snack-success' });
    }
  }

  join(challenge: AvailableChallenge): void {
    this.busy.set(challenge.idDesafio);
    this.service.join(challenge.idDesafio).subscribe({
      next: (joined) => {
        this.busy.set(null);
        this.updateNow((s) => addActive(s, joined));
        this.snackBar.open(this.i18n.t('challenges.joined', { title: challenge.titulo }), 'OK', { duration: 4000 });
        this.load();
      },
      error: (err) => {
        this.busy.set(null);
        this.showError(err); // US28: the API explains the missing requirement
        this.load();
      },
    });
  }

  abandon(participation: Participation): void {
    this.openMessage({
      icon: 'flag', tone: 'danger', title: 'challenges.abandonTitle', text: 'challenges.abandonText',
      textParams: { title: participation.titulo }, accept: 'challenges.abandon', cancel: 'form.cancel',
    })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.service.abandon(participation.idUsuarioDesafio)),
      )
      .subscribe({
        next: (abandoned) => {
          this.updateNow((s) => moveToHistory(s, abandoned));
          this.load();
        },
        error: (err) => this.showError(err),
      });
  }

  create(): void {
    this.dialog
      .open(CreateChallengeDialog, { width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter((created) => !!created))
      .subscribe((created: Participation) => {
        this.updateNow((s) => addActive(s, created));
        this.snackBar.open(this.i18n.t('challenges.createdOk', { title: created.titulo }), 'OK', { duration: 4000 });
        this.load();
      });
  }

  private updateNow(change: (summary: ChallengeSummary) => ChallengeSummary): void {
    const current = this.summary();
    if (current) this.summary.set(change(current));
  }

  share(medal: Medal): void {
    this.dialog.open(ShareMedalDialog, { data: medal, width: '520px', maxWidth: '95vw' });
  }

  private openMessage(data: MessageDialogData) {
    return this.dialog.open(MessageDialog, { data, width: '440px', maxWidth: '95vw' });
  }

  private showError(err: unknown): void {
    this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 6000 });
  }
}
