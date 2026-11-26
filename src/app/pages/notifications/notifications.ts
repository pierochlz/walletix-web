import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AppNotification } from '../../core/models';
import { NotificationStore } from '../../core/notification.store';
import { filterNotifications, NotificationFilter, notificationIcon, relativeTime } from '../../core/notifications';
import { ConfirmDialog } from '../../shared/confirm-dialog';

// US22: panel with all the notifications · US23: tabs All / Unread / Read · US24: mark as read / unread
@Component({
  selector: 'app-notifications-page',
  imports: [RouterLink, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressBarModule, MatTooltipModule, DatePipe, TranslatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsPage implements OnInit {
  readonly store = inject(NotificationStore);
  readonly i18n = inject(I18nService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly filter = signal<NotificationFilter>('all');
  readonly filters: NotificationFilter[] = ['all', 'unread', 'read'];
  readonly visible = computed(() => filterNotifications(this.store.mine(), this.filter()));
  readonly iconOf = notificationIcon;

  ngOnInit(): void {
    this.store.refresh();
  }

  ago(date: string | null): string {
    return relativeTime(date, this.i18n.locale());
  }

  toggleRead(notification: AppNotification): void {
    this.store.setRead(notification, !notification.estadoNotificacion).subscribe({
      error: (err) => this.showError(err),
    });
  }

  markAll(): void {
    this.store.markAllAsRead().subscribe({
      next: () => this.snackBar.open(this.i18n.t('notifications.allRead'), 'OK', { duration: 3000 }),
      error: (err) => this.showError(err),
    });
  }

  remove(notification: AppNotification): void {
    this.dialog
      .open(ConfirmDialog, { width: '420px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.store.remove(notification)),
      )
      .subscribe({
        next: () => this.snackBar.open(this.i18n.t('form.deleted'), 'OK', { duration: 3000 }),
        error: (err) => this.showError(err),
      });
  }

  private showError(err: unknown): void {
    this.snackBar.open(apiErrorMessage(err, this.i18n.t('form.error')), 'OK', { duration: 5000 });
  }
}
