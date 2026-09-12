/**
 * Web counterpart of the mobile push-token registration.
 *
 * The mobile app registered an Expo device push token in `push_tokens`, which the
 * `send-push-on-notification` Edge Function reads to deliver background pushes via
 * Expo's service. A browser has no Expo push token, so writing a row here would put
 * an unusable token in that table and make the Edge Function fail for that user —
 * therefore registration is intentionally a no-op on web.
 *
 * What IS preserved: notification permission is still requested (Web Notifications
 * API), and every in-app + realtime notification path works identically, because
 * those are driven by the `notifications` table and Supabase Realtime, not by push.
 *
 * Documented limitation: background pushes (delivered while no tab is open) are not
 * available on web without a service worker and a Web Push subscription, which the
 * existing Expo-token-based Edge Function does not implement.
 */

import { requestNotificationPermissionAsync as requestBrowserNotificationPermission } from '@/field-ops/lib/localNotifications';

/**
 * Request notification permission so real-time system notifications show in the
 * browser's notification centre. Same call sites as on mobile.
 */
export async function requestNotificationPermissionAsync(): Promise<void> {
  await requestBrowserNotificationPermission();
}

/**
 * No-op on web (see module docs). Kept so the shared call site in the app shell
 * stays identical to the mobile app's PushTokenRegistration component.
 */
export async function registerPushTokenForUser(_userId: string): Promise<void> {
  // Intentionally empty: no Expo push token exists in a browser.
}
