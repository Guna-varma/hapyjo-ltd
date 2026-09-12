/**
 * Web counterpart of the mobile PushTokenRegistration.
 *
 * On mobile this registered an Expo device push token and listened for notification
 * taps. In a browser there is no Expo push token (see lib/registerPushToken), so
 * this component instead:
 *   - requests browser notification permission once the user is signed in, and
 *   - routes a notification tap to the right tab exactly as before, by listening for
 *     the event lib/localNotifications dispatches when a notification is clicked.
 */
import { useEffect, useRef } from 'react';
import { requestNotificationPermissionAsync } from '@/field-ops/lib/registerPushToken';
import { NOTIFICATION_TAP_EVENT, type NotificationData } from '@/field-ops/lib/localNotifications';
import { useAuth } from '@/field-ops/context/AuthContext';
import { useNotificationNavigation } from '@/field-ops/context/NotificationNavigationContext';
import { getTabForLinkType } from '@/field-ops/lib/notificationDeepLink';

export function PushTokenRegistration() {
  const { user } = useAuth();
  const requested = useRef(false);
  const nav = useNotificationNavigation();

  useEffect(() => {
    if (!user?.id) {
      requested.current = false;
      return;
    }
    if (requested.current) return;
    requested.current = true;
    requestNotificationPermissionAsync().catch(() => {
      // ignore (permission denied or unsupported)
    });
  }, [user?.id]);

  useEffect(() => {
    const onTap = (event: Event) => {
      const data = (event as CustomEvent<NotificationData>).detail;
      const linkType = data?.linkType;
      const setActiveTab = nav?.getSetActiveTab?.() ?? null;
      if (linkType && setActiveTab) {
        setActiveTab(getTabForLinkType(linkType));
      }
    };
    window.addEventListener(NOTIFICATION_TAP_EVENT, onTap);
    return () => window.removeEventListener(NOTIFICATION_TAP_EVENT, onTap);
  }, [nav]);

  return null;
}
