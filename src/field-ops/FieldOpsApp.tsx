/**
 * Field Operations app shell for the web.
 *
 * This is the browser counterpart of the mobile app/index.tsx: the same provider
 * stack, the same auth gate, the same loading state, and the same AppNavigation
 * shell — with React Router supplying real URLs under /app.
 *
 * Provider order is kept identical to the mobile app, because the data store reads
 * auth and the screens read locale/toast/loading from above them.
 */

import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/field-ops/context/AuthContext';
import { LoadingProvider } from '@/field-ops/context/LoadingContext';
import { MockAppStoreProvider } from '@/field-ops/context/MockAppStoreContext';
import { ToastProvider } from '@/field-ops/context/ToastContext';
import { NotificationNavigationProvider } from '@/field-ops/context/NotificationNavigationContext';
import { LocaleProvider, useLocale } from '@/field-ops/context/LocaleContext';
import { LoginScreen } from '@/field-ops/components/auth/LoginScreen';
import { AppNavigation } from '@/field-ops/components/navigation/AppNavigation';
import { PushTokenRegistration } from '@/field-ops/components/PushTokenRegistration';
import { AppErrorBoundary } from '@/field-ops/components/ui/AppErrorBoundary';
import { ActivityIndicator, AlertHost, Text, View, useWindowDimensions } from '@/field-ops/components/primitives';
import { getTabsForRole } from '@/field-ops/lib/rbac';
import { APP_BASENAME, LOGIN_PATH, pathForTab } from '@/field-ops/lib/appRoutes';
import * as Location from '@/field-ops/lib/location';

/**
 * Requests location permission shortly after the app opens so it can be granted
 * upfront (for GPS capture, driver tracking and issue reporting), mirroring the
 * mobile app. In a browser the prompt only appears on an actual position request,
 * so this asks only when permission has not already been decided — it never
 * prompts a user who previously denied it.
 */
function RequestLocationPermissionOnAppOpen() {
  const requested = useRef(false);
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    const run = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'undetermined') {
          await Location.requestForegroundPermissionsAsync();
        }
      } catch {
        /* ignore; permission may be requested later on relevant screens */
      }
    };
    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, []);
  return null;
}

/** Full-screen loader shown until the first session check completes. */
function AuthLoadingScreen() {
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const fontSize = Math.max(14, Math.min(18, width * 0.045));
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: Math.max(16, width * 0.05),
      }}
    >
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={{ marginTop: 12, fontSize, color: '#475569' }}>{t('common_loading')}</Text>
    </View>
  );
}

/**
 * Sends a signed-in user who is sitting on /app/login (or /app) to the first tab
 * their role can access — the web equivalent of the mobile app swapping the login
 * screen for AppNavigation.
 */
function RedirectToRoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to={LOGIN_PATH} replace />;
  const tabs = getTabsForRole(user.role);
  return <Navigate to={pathForTab(tabs[0])} replace />;
}

/** Signed-out users are bounced to the login route from any app URL. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to={LOGIN_PATH} replace />;
  return <>{children}</>;
}

/** The login route: already-signed-in users are redirected to their dashboard. */
function LoginRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <AuthLoadingScreen />;
  if (isAuthenticated) return <RedirectToRoleHome />;
  return <LoginScreen />;
}

/**
 * After sign-in the user must land on a tab route rather than stay on /app/login,
 * and after sign-out they must be returned to it. AppNavigation owns tab routing,
 * so this effect only handles those two transitions.
 */
function AuthRouteSync() {
  const { isAuthenticated, authLoading, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (authLoading) return;
    const onLogin = window.location.pathname.replace(/\/+$/, '').endsWith(LOGIN_PATH);
    if (isAuthenticated && user && onLogin) {
      navigate(pathForTab(getTabsForRole(user.role)[0]), { replace: true });
    } else if (!isAuthenticated && !onLogin) {
      navigate(LOGIN_PATH, { replace: true });
    }
  }, [isAuthenticated, authLoading, user, navigate]);
  return null;
}

/** Routes: the login screen, plus the authenticated shell for every tab path. */
function FieldOpsRoutes() {
  return (
    <>
      <AuthRouteSync />
      <Routes>
        <Route path={LOGIN_PATH} element={<LoginRoute />} />
        <Route path="/" element={<RedirectToRoleHome />} />
        {/*
          Every tab renders the same AppNavigation shell, which reads the active tab
          from the URL. A single wildcard route keeps the shell mounted across tab
          changes, so screen state and the data store are not torn down on navigation.
        */}
        <Route
          path="*"
          element={
            <RequireAuth>
              <NotificationNavigationProvider>
                <PushTokenRegistration />
                <AppNavigation />
              </NotificationNavigationProvider>
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}

export default function FieldOpsApp() {
  return (
    <AppErrorBoundary>
    <BrowserRouter basename={APP_BASENAME}>
      <AuthProvider>
        <LocaleProvider>
          <MockAppStoreProvider>
            <ToastProvider>
              <LoadingProvider>
                <RequestLocationPermissionOnAppOpen />
                {/* Hosts RN Alert.alert() dialogs raised from anywhere in the app. */}
                <AlertHost />
                <View style={{ flex: 1, minHeight: 0 }}>
                  <FieldOpsRoutes />
                </View>
              </LoadingProvider>
            </ToastProvider>
          </MockAppStoreProvider>
        </LocaleProvider>
      </AuthProvider>
    </BrowserRouter>
    </AppErrorBoundary>
  );
}
