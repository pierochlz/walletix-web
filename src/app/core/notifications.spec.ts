import { AppNotification } from './models';
import { countByFilter, filterNotifications, notificationIcon, relativeTime } from './notifications';

const notification = (id: number, read: boolean, tipo = 'alerta'): AppNotification => ({
  idNotificacion: id,
  idUsuario: 1,
  titulo: `N${id}`,
  tipo,
  mensaje: 'test',
  estadoNotificacion: read,
  fechaNotificacion: null,
});

describe('notifications panel', () => {
  const list = [notification(1, false), notification(2, true), notification(3, false)];

  it('US23: counts all, unread and read notifications', () => {
    expect(countByFilter(list)).toEqual({ all: 3, unread: 2, read: 1 });
  });

  it('US23: filters by tab', () => {
    expect(filterNotifications(list, 'unread').map((n) => n.idNotificacion)).toEqual([1, 3]);
    expect(filterNotifications(list, 'read').map((n) => n.idNotificacion)).toEqual([2]);
    expect(filterNotifications(list, 'all').length).toBe(3);
  });

  it('shows how long ago it arrived, in the user language', () => {
    const now = new Date(2026, 10, 24, 18, 0, 0);
    expect(relativeTime('2026-11-24T17:55:00', 'es-419', now)).toBe('hace 5 minutos');
    expect(relativeTime('2026-11-23T18:00:00', 'en-US', now)).toBe('yesterday');
    expect(relativeTime(null, 'es-419', now)).toBe(''); // old notifications have no date
  });

  it('uses an icon for each type', () => {
    expect(notificationIcon('alerta')).toBe('warning');
    expect(notificationIcon('otro')).toBe('notifications');
  });
});
