import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityIndicator, Alert, Dimensions, Haptics, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, useSafeAreaInsets, View } from '@/field-ops/components/primitives';
import { useAuth } from '@/field-ops/context/AuthContext';
import { useLocale } from '@/field-ops/context/LocaleContext';
import { useMockAppStore } from '@/field-ops/context/MockAppStoreContext';
import { useLoading } from '@/field-ops/context/LoadingContext';
import { useNotificationNavigation } from '@/field-ops/context/NotificationNavigationContext';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';
import { colors, dimensions, scrollConfig } from '@/field-ops/theme/tokens';
import { getTabsForRole, type TabId } from '@/field-ops/lib/rbac';
import type { SurveyNavParams } from '@/field-ops/components/RoleBasedDashboard';
import { RoleBasedDashboard } from '@/field-ops/components/RoleBasedDashboard';
import { ReportsScreen } from '@/field-ops/components/screens/ReportsScreen';
import { SettingsScreen } from '@/field-ops/components/screens/SettingsScreen';
import { UsersScreen } from '@/field-ops/components/screens/UsersScreen';
import { SitesScreen } from '@/field-ops/components/screens/SitesScreen';
import {
  LayoutDashboard,
  FileText,
  Settings,
  ClipboardList,
  Users,
  Building2,
  Truck,
  Receipt,
  ClipboardCheck,
  AlertCircle,
  Camera,
  RefreshCw,
  Bell,
  LogOut,
} from 'lucide-react';
import { LanguageSwitcher } from '@/field-ops/components/ui/LanguageSwitcher';
import { NotificationsModal } from '@/field-ops/components/ui/NotificationsModal';
import { GpsCameraScreen } from '@/field-ops/features/gpsCamera/GpsCameraScreen';
import { VehiclesScreen } from '@/field-ops/components/screens/VehiclesScreen';
import { ExpensesScreen } from '@/field-ops/components/screens/ExpensesScreen';
import { DriverTripsScreen } from '@/field-ops/components/screens/DriverTripsScreen';
import { SurveysScreen } from '@/field-ops/components/screens/SurveysScreen';
import { IssuesScreen } from '@/field-ops/components/screens/IssuesScreen';
import { SiteTasksScreen } from '@/field-ops/components/screens/SiteTasksScreen';
import { useNavigate, useLocation } from 'react-router-dom';
import { pathForTab, tabForPath } from '@/field-ops/lib/appRoutes';

const TAB_CONFIG: Record<TabId, { labelKey: string; icon: typeof LayoutDashboard }> = {
  dashboard: { labelKey: 'tab_dashboard', icon: LayoutDashboard },
  reports: { labelKey: 'tab_reports', icon: FileText },
  tasks: { labelKey: 'tab_tasks', icon: ClipboardList },
  users: { labelKey: 'tab_users', icon: Users },
  sites: { labelKey: 'tab_sites', icon: Building2 },
  vehicles: { labelKey: 'tab_vehicles', icon: Truck },
  expenses: { labelKey: 'tab_expenses', icon: Receipt },
  surveys: { labelKey: 'tab_surveys', icon: ClipboardCheck },
  issues: { labelKey: 'tab_issues', icon: AlertCircle },
  gps_camera: { labelKey: 'tab_gps_camera', icon: Camera },
  settings: { labelKey: 'tab_settings', icon: Settings },
};

/**
 * At this width the tab bar moves from the bottom of the screen to a left sidebar.
 * Below it, the layout is the mobile one unchanged.
 */
const SIDEBAR_MIN_WIDTH = 1024;

/** Sidebar width at wide viewports; wide enough for the longest tab label. */
const SIDEBAR_WIDTH = 232;

/**
 * Caps how wide screen content grows on very large monitors so rows and forms stay
 * readable, instead of stretching across the full width of a 4K display.
 */
const CONTENT_MAX_WIDTH = 1400;

/** Top inset so header bar and screen content render below the system status bar (Android notch/punch-hole safe). */
function useTopSafeInset(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    // Prefer runtime inset; fallback to status bar height only when inset is unavailable.
    return insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 0);
  }
  return insets.top;
}

export function AppNavigation() {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const { refetch, loading, unreadNotificationCount } = useMockAppStore();
  const { withLoading } = useLoading();
  const topInset = useTopSafeInset();
  const insets = useSafeAreaInsets();
  const theme = useResponsiveTheme();
  const tabIds = useMemo(
    () => (user ? getTabsForRole(user.role) : (['dashboard', 'settings'] as TabId[])),
    [user]
  );
  const navigate = useNavigate();
  const location = useLocation();
  /**
   * Six or more tabs on a phone narrower than 360px: the bar scrolls, and only
   * the active tab shows its label so every tab stays visible at a glance.
   */
  const compactTabLabels = theme.width < 360 && tabIds.length >= 6;
  const roleLabel = user ? t(`role_${user.role}`) : '';
  const userInitials = (user?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  /**
   * The URL is the source of truth for the active tab, so refresh, Back/Forward and
   * bookmarks all work. It falls back to the role's first tab while the redirect
   * effect below fixes up an unknown or unauthorised path.
   */
  const urlTab = tabForPath(location.pathname);
  const activeTab: TabId = urlTab && tabIds.includes(urlTab) ? urlTab : tabIds[0];

  const setActiveTabState = useCallback(
    (tab: TabId) => {
      navigate(pathForTab(tab));
    },
    [navigate],
  );
  const [openNewSurveyModalOnce, setOpenNewSurveyModalOnce] = useState(false);
  const [openReviseSurveyIdOnce, setOpenReviseSurveyIdOnce] = useState<string | null>(null);
  const [surveyDateFilterOnce, setSurveyDateFilterOnce] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const setActiveTab = useCallback((tab: TabId, params?: SurveyNavParams) => {
    if (!tabIds.includes(tab)) return;
    if (tab === 'surveys' && params?.openNewSurvey) setOpenNewSurveyModalOnce(true);
    if (tab === 'surveys' && params?.openReviseSurveyId) setOpenReviseSurveyIdOnce(params.openReviseSurveyId);
    if (tab === 'surveys' && params?.filterByDate) setSurveyDateFilterOnce(params.filterByDate);
    setActiveTabState(tab);
  }, [tabIds]);

  const { registerSetActiveTab } = useNotificationNavigation() ?? {};
  useEffect(() => {
    if (!registerSetActiveTab) return;
    return registerSetActiveTab(setActiveTab);
  }, [registerSetActiveTab, setActiveTab]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await withLoading(() => refetch());
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshing, withLoading]);

  const handleLogout = useCallback(() => {
    Alert.alert(t('settings_confirm_logout'), t('settings_confirm_logout_message'), [
      { text: t('common_cancel'), style: 'cancel' },
      { text: t('settings_sign_out'), style: 'destructive', onPress: () => logout() },
    ]);
  }, [t, logout]);

  const tabIdsKey = tabIds.join(',');
  /**
   * URL-level RBAC: typing the address of a tab this role cannot access (or any
   * unknown path) replaces it with the role's first permitted tab. Supabase RLS
   * remains the authoritative guard on the data itself.
   */
  useEffect(() => {
    if (urlTab === null || !tabIds.includes(urlTab)) {
      navigate(pathForTab(tabIds[0]), { replace: true });
    }
  }, [urlTab, tabIdsKey, tabIds, navigate]);

  const visibleTabs = tabIds.map((id) => {
    const config = TAB_CONFIG[id];
    const labelKey = user?.role === 'owner' && id === 'gps_camera' ? 'tab_work_progress_gallery' : config.labelKey;
    return { id, ...config, label: t(labelKey) };
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <RoleBasedDashboard onNavigateTab={setActiveTab} />;
      case 'reports':
        return <ReportsScreen />;
      case 'tasks':
        return user?.role === 'driver_truck' || user?.role === 'driver_machine'
          ? <DriverTripsScreen />
          : user?.role === 'assistant_supervisor'
            ? <SiteTasksScreen />
            : <RoleBasedDashboard onNavigateTab={setActiveTab} />;
      case 'users':
        return <UsersScreen />;
      case 'sites':
        return <SitesScreen />;
      case 'vehicles':
        return <VehiclesScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'surveys':
        return (
          <SurveysScreen
            initialOpenNewSurveyModal={openNewSurveyModalOnce}
            onClearOpenNewSurveyModal={() => setOpenNewSurveyModalOnce(false)}
            initialOpenReviseSurveyId={openReviseSurveyIdOnce ?? undefined}
            onClearOpenReviseSurveyId={() => setOpenReviseSurveyIdOnce(null)}
            initialSurveyDateFilter={surveyDateFilterOnce ?? undefined}
            onClearSurveyDateFilter={() => setSurveyDateFilterOnce(null)}
          />
        );
      case 'issues':
        return <IssuesScreen />;
      case 'gps_camera':
        return <GpsCameraScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <RoleBasedDashboard />;
    }
  };

  /**
   * One tab button. Extracted from the two identical copies the mobile file had so
   * the bottom bar and the sidebar can never drift apart.
   */
  const renderTabButton = (
    tab: (typeof visibleTabs)[number],
    layout: 'bar' | 'sidebar',
  ) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    const isSidebar = layout === 'sidebar';
    const showLabel = isSidebar || !compactTabLabels || isActive;
    return (
      <TouchableOpacity
        key={tab.id}
        onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: isActive }}
        style={{
          // Sidebar lays the icon and label out in a row; the bar stacks them.
          flexDirection: isSidebar ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: isSidebar ? 'flex-start' : 'center',
          gap: isSidebar ? 12 : 0,
          paddingVertical: 8,
          paddingHorizontal: 12,
          minWidth: isSidebar ? undefined : compactTabLabels && !isActive ? dimensions.minTouchHeight : theme.tabItemMinWidth,
          minHeight: dimensions.minTouchHeight,
          backgroundColor: isActive ? colors.blue50 : 'transparent',
          borderRadius: 12,
        }}
      >
        <Icon
          size={theme.tabIconSize}
          color={isActive ? colors.primary : colors.gray500}
          strokeWidth={isActive ? 2.5 : 2}
        />
        {showLabel ? (
          <Text
            style={{
              fontSize: isSidebar ? 14 : theme.tabLabelSize,
              marginTop: isSidebar ? 0 : theme.spacingXs,
              fontWeight: '500',
              color: isActive ? colors.primary : colors.gray600,
              // The scrolling bar sizes each tab to its label; never ellipsise it.
              flexShrink: 0,
            }}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const isWideLayout = theme.width >= SIDEBAR_MIN_WIDTH;
  const tabCount = visibleTabs.length;
  const footerJustify = tabCount <= 3 ? 'center' : tabCount <= 5 ? 'space-evenly' : 'flex-start';
  const footerScrollable = tabCount >= 6;

  const androidNavFallback = Math.max(
    0,
    Dimensions.get('screen').height - Dimensions.get('window').height
  );
  const rawBottomInset = Platform.OS === 'ios'
    ? Math.max(0, insets.bottom)
    : (insets.bottom > 0 ? insets.bottom : androidNavFallback);
  const bottomSystemInset = Math.min(rawBottomInset, Platform.OS === 'ios' ? 48 : 40);
  const bottomTabPadding = theme.tabPaddingV + bottomSystemInset;
  const tabBarReservedHeight = dimensions.minTouchHeight + theme.spacingSm + bottomTabPadding + 12;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
      <View style={{ flex: 1, minHeight: 0, flexDirection: isWideLayout ? 'row' : 'column' }}>
        {/* Wide viewports: the same tabs as a left sidebar instead of the bottom bar */}
        {isWideLayout ? (
          <View
            style={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              backgroundColor: colors.surface,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              paddingTop: topInset + theme.spacingMd,
              paddingBottom: theme.spacingMd,
              paddingHorizontal: theme.spacingSm,
              gap: 4,
              overflowY: 'auto',
            }}
          >
            {visibleTabs.map((tab) => renderTabButton(tab, 'sidebar'))}
            {/* Who is signed in — the mobile layout shows this in the dashboard headline. */}
            {user ? (
              <View
                style={{
                  marginTop: 'auto',
                  paddingTop: theme.spacingMd,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 8,
                }}
                accessibilityLabel={`${t('sidebar_signed_in_as')} ${user.name}, ${roleLabel}`}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.blue50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{userInitials || '•'}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>
                    {roleLabel}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

      <View
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          paddingTop: isWideLayout ? 0 : topInset,
          paddingBottom: isWideLayout ? 0 : tabBarReservedHeight,
        }}
      >
        {/* Compact top bar: Refresh + Language – minimal height, no dead space */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.screenPadding,
            paddingVertical: 6,
            minHeight: 52,
            backgroundColor: 'transparent',
          }}
        >
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing || loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: 'transparent',
              minHeight: 44,
              minWidth: 44,
            }}
            accessibilityLabel={t('common_refresh')}
          >
            {refreshing || loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <RefreshCw size={20} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '600',
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  {t('common_refresh')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setNotificationsModalVisible(true)}
              style={{ position: 'relative', padding: 8, minHeight: dimensions.minTouchHeight, justifyContent: 'center' }}
              accessibilityLabel={t('settings_notifications')}
            >
              <Bell size={22} color={colors.gray600} />
              {unreadNotificationCount > 0 && (
                <View style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: colors.surface, fontSize: 10, fontWeight: '700' }}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ padding: 8, minHeight: dimensions.minTouchHeight, justifyContent: 'center' }} accessibilityLabel={t('settings_sign_out')}>
              <LogOut size={22} color={colors.gray600} />
            </TouchableOpacity>
            <LanguageSwitcher />
          </View>
        </View>
        <View
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            // Centres the content column once it hits its cap.
            alignSelf: 'center',
          }}
        >
          {renderContent()}
        </View>
      </View>
      </View>

      {/* Bottom Tab Bar – narrow viewports only; wide ones use the sidebar above */}
      {!isWideLayout ? (
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: theme.spacingSm,
          // The safe-area inset (iPhone home indicator, Android gesture bar) is
          // added in CSS: an absolutely positioned bar ignores the SafeAreaView's
          // padding, so it must reserve that space itself.
          paddingBottom: `calc(${bottomTabPadding}px + env(safe-area-inset-bottom, 0px))`,
          paddingHorizontal: theme.tabPaddingH,
        }}
      >
        {footerScrollable ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingBottom: 0,
            }}
            {...scrollConfig}
          >
            {visibleTabs.map((tab) => renderTabButton(tab, 'bar'))}
          </ScrollView>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: footerJustify,
              flexWrap: 'nowrap',
            }}
          >
            {visibleTabs.map((tab) => renderTabButton(tab, 'bar'))}
          </View>
        )}
      </View>
      ) : null}

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
    </SafeAreaView>
  );
}
