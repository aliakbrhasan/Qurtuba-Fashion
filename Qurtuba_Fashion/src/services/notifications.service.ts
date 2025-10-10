export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationTarget {
  page: string;
  id?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  target?: NotificationTarget;
}

type NotificationListener = (notification: AppNotification) => void;

class NotificationsService {
  private listeners: Set<NotificationListener> = new Set();

  public on(listener: NotificationListener): void {
    this.listeners.add(listener);
  }

  public off(listener: NotificationListener): void {
    this.listeners.delete(listener);
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }

  public emit(input: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & Partial<Pick<AppNotification, 'read'>>): AppNotification {
    const notification: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      title: input.title,
      message: input.message,
      timestamp: new Date(),
      read: input.read ?? false,
      target: input.target,
    };

    this.listeners.forEach((l) => {
      try {
        l(notification);
      } catch (err) {
        // Listener errors should not break others
        // eslint-disable-next-line no-console
        console.warn('Notification listener error:', err);
      }
    });

    return notification;
  }
}
// Ensure a single instance across HMR/Reloads
const g = globalThis as any;
export const notifications: NotificationsService = g.__qf_notifications || (g.__qf_notifications = new NotificationsService());


