import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AppNotification } from './models';
import { countByFilter } from './notifications';
import { onlyOwn } from './ownership';

// Notifications of the logged-in user, shared by the bell of the toolbar and the notifications page.
// They are signals: when one is marked as read, the bell counter changes at the same time.
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private url = `${environment.apiUrl}/notificaciones`;

  private readonly all = signal<AppNotification[]>([]);
  readonly loaded = signal(false);
  readonly error = signal(false);

  // An ADMIN receives everyone's notifications: the panel only shows mine
  readonly mine = computed(() => onlyOwn(this.all(), this.auth.user()?.idUsuario));
  readonly counts = computed(() => countByFilter(this.mine()));
  readonly unreadCount = computed(() => this.counts().unread);

  // GET /notificaciones (the API returns them from the newest to the oldest)
  refresh(): void {
    this.http.get<AppNotification[]>(this.url).subscribe({
      next: (list) => {
        this.all.set(list);
        this.loaded.set(true);
        this.error.set(false);
      },
      error: () => {
        this.loaded.set(true);
        this.error.set(true);
      },
    });
  }

  // US24: PUT /notificaciones/{id}/leida?leida=true|false
  setRead(notification: AppNotification, read: boolean): Observable<AppNotification> {
    return this.http
      .put<AppNotification>(`${this.url}/${notification.idNotificacion}/leida`, null, { params: { leida: read } })
      .pipe(tap((updated) => this.replace(updated)));
  }

  // US24: PUT /notificaciones/leer-todas
  markAllAsRead(): Observable<{ marcadas: number }> {
    return this.http
      .put<{ marcadas: number }>(`${this.url}/leer-todas`, null)
      .pipe(tap(() => this.all.update((list) => list.map((n) => ({ ...n, estadoNotificacion: true })))));
  }

  remove(notification: AppNotification): Observable<string> {
    return this.http
      .delete(`${this.url}/${notification.idNotificacion}`, { responseType: 'text' })
      .pipe(tap(() => this.all.update((list) => list.filter((n) => n.idNotificacion !== notification.idNotificacion))));
  }

  private replace(updated: AppNotification): void {
    this.all.update((list) => list.map((n) => (n.idNotificacion === updated.idNotificacion ? updated : n)));
  }
}
