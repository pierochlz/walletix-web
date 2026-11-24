import { AppNotification } from './models';

// Pure logic of the notifications panel (US22-US24), without Angular, so it can be unit tested.

export type NotificationFilter = 'all' | 'unread' | 'read';

// estadoNotificacion in the API: true = read, false = unread
export function isUnread(notification: AppNotification): boolean {
  return !notification.estadoNotificacion;
}

export function filterNotifications(list: AppNotification[], filter: NotificationFilter): AppNotification[] {
  if (filter === 'unread') return list.filter(isUnread);
  if (filter === 'read') return list.filter((n) => !isUnread(n));
  return list;
}

// US23: number shown next to each tab
export function countByFilter(list: AppNotification[]): Record<NotificationFilter, number> {
  const unread = list.filter(isUnread).length;
  return { all: list.length, unread, read: list.length - unread };
}

// "5 minutes ago", "yesterday", "3 days ago"... in the user's language.
// The API sends Peru's local time without zone ("2026-11-24T17:32:19"): it is read as local time.
export function relativeTime(date: string | null | undefined, locale: string, now: Date = new Date()): string {
  if (!date) return '';
  const then = new Date(date);
  if (isNaN(then.getTime())) return '';
  const seconds = Math.round((then.getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'second'); // "now"
}

// Icon of each type of notification
export function notificationIcon(type: string): string {
  switch (type?.toLowerCase()) {
    case 'alerta':
      return 'warning';
    case 'logro':
      return 'emoji_events';
    case 'reto':
      return 'flag';
    case 'recordatorio':
      return 'event';
    default:
      return 'notifications';
  }
}
