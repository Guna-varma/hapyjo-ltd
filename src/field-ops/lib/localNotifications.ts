/**
 * Real-time system notifications: shown when a new notification row arrives (Realtime INSERT).
 * Web port of the mobile localNotifications module — identical public API.
 *
 * On mobile this used expo-notifications to post into the OS tray. In a browser the
 * equivalent is the Notifications API: same trigger points, same title/body template,
 * and tap-to-deep-link is preserved by dispatching the same data payload through a
 * window event that NotificationNavigationContext listens to.
 *
 * Browser limitation: notifications only appear while a tab is open (no background
 * push without a service worker + Web Push subscription, which the existing
 * send-push-on-notification Edge Function targets Expo device tokens for).
 */

const APP_NAME = 'Hapyjo';

export interface NotificationData {
  linkId?: string;
  linkType?: string;
  notificationId?: string;
}

/** Event used so a notification tap can be routed by NotificationNavigationContext. */
export const NOTIFICATION_TAP_EVENT = 'hapyjo:notification-tap';

function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Current permission without prompting. */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Ask the browser for notification permission.
 * Mirrors requestNotificationPermissionAsync() on mobile; returns true when granted.
 */
export async function requestNotificationPermissionAsync(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/**
 * Show a system notification (browser notification tray).
 * Template: title as main line, body as detail — same as mobile.
 */
export async function showSystemNotification(title: string, body: string): Promise<void> {
  return showSystemNotificationWithData(title, body, undefined);
}

/**
 * Show a system notification with optional data for deep linking when the user taps.
 * Used by the realtime INSERT handler so a tap opens the correct tab/screen.
 */
export async function showSystemNotificationWithData(
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const displayTitle = title && title.trim() ? title.trim() : APP_NAME;
    const displayBody = body && body.trim() ? body.trim() : 'New update';
    const notification = new Notification(displayTitle, {
      body: displayBody,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      tag: data?.notificationId,
      data,
    });
    notification.onclick = () => {
      try {
        window.focus();
        if (data) {
          window.dispatchEvent(new CustomEvent(NOTIFICATION_TAP_EVENT, { detail: data }));
        }
      } finally {
        notification.close();
      }
    };
  } catch {
    // ignore (permission revoked mid-session, or constructor unsupported)
  }
}
