/**
 * Route mapping + URL-level RBAC.
 *
 * The second block is the important one: it asserts that for every role, only the
 * tabs lib/rbac grants are reachable, and that typing the URL of any other tab
 * resolves to null/denied. That is the guard AppNavigation applies when a user
 * enters an address directly.
 */
import { describe, it, expect } from 'vitest';
import { pathForTab, tabForPath, allTabPaths, LOGIN_PATH, APP_BASENAME } from '../appRoutes';
import { getTabsForRole, canAccessTab, type TabId } from '../rbac';
import type { UserRole } from '@/field-ops/types';

const ALL_ROLES: UserRole[] = [
  'admin',
  'owner',
  'head_supervisor',
  'accountant',
  'assistant_supervisor',
  'surveyor',
  'driver_truck',
  'driver_machine',
];

const ALL_TABS: TabId[] = [
  'dashboard',
  'reports',
  'tasks',
  'users',
  'sites',
  'vehicles',
  'expenses',
  'surveys',
  'issues',
  'gps_camera',
  'settings',
];

describe('appRoutes', () => {
  it('mounts the app under /app', () => {
    expect(APP_BASENAME).toBe('/app');
    expect(LOGIN_PATH).toBe('/login');
  });

  it('round-trips every tab through its path', () => {
    for (const tab of ALL_TABS) {
      const path = pathForTab(tab);
      expect(path.startsWith('/')).toBe(true);
      expect(tabForPath(path)).toBe(tab);
    }
  });

  it('gives every tab a distinct path', () => {
    const paths = allTabPaths().map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('covers every tab in the RBAC table', () => {
    expect(allTabPaths().map((e) => e.tab).sort()).toEqual([...ALL_TABS].sort());
  });

  it('resolves paths with and without a leading slash, case-insensitively', () => {
    expect(tabForPath('/sites')).toBe('sites');
    expect(tabForPath('sites')).toBe('sites');
    expect(tabForPath('/SITES')).toBe('sites');
  });

  it('ignores trailing segments so nested URLs still resolve to their tab', () => {
    expect(tabForPath('/sites/abc-123')).toBe('sites');
  });

  it('returns null for unknown, empty and login paths', () => {
    expect(tabForPath('/')).toBeNull();
    expect(tabForPath('')).toBeNull();
    expect(tabForPath('/not-a-tab')).toBeNull();
    expect(tabForPath(LOGIN_PATH)).toBeNull();
  });

  it('maps the GPS camera tab to the work-progress URL', () => {
    expect(pathForTab('gps_camera')).toBe('/work-progress');
    expect(tabForPath('/work-progress')).toBe('gps_camera');
  });
});

describe('URL-level RBAC guard', () => {
  /**
   * Mirrors AppNavigation's guard: a path is allowed only when it maps to a tab
   * the role is granted. Anything else is redirected to the role's first tab.
   */
  const resolveTabForRole = (role: UserRole, pathname: string): TabId => {
    const tabIds = getTabsForRole(role);
    const urlTab = tabForPath(pathname);
    if (urlTab === null || !tabIds.includes(urlTab)) return tabIds[0];
    return urlTab;
  };

  it.each(ALL_ROLES)('lets %s reach exactly the tabs RBAC grants', (role) => {
    const granted = getTabsForRole(role);
    for (const tab of granted) {
      expect(resolveTabForRole(role, pathForTab(tab))).toBe(tab);
    }
  });

  it.each(ALL_ROLES)('redirects %s away from tabs RBAC denies', (role) => {
    const granted = getTabsForRole(role);
    const denied = ALL_TABS.filter((tab) => !granted.includes(tab));
    for (const tab of denied) {
      const landed = resolveTabForRole(role, pathForTab(tab));
      expect(landed).not.toBe(tab);
      expect(granted).toContain(landed);
    }
  });

  it.each(ALL_ROLES)('sends %s to a granted tab for unknown paths', (role) => {
    const landed = resolveTabForRole(role, '/not-a-tab');
    expect(getTabsForRole(role)).toContain(landed);
  });

  it('keeps the guard consistent with canAccessTab', () => {
    for (const role of ALL_ROLES) {
      for (const tab of ALL_TABS) {
        const reachable = resolveTabForRole(role, pathForTab(tab)) === tab;
        expect(reachable).toBe(canAccessTab(role, tab));
      }
    }
  });

  it('denies drivers the users, sites and reports tabs by URL', () => {
    for (const role of ['driver_truck', 'driver_machine'] as UserRole[]) {
      for (const tab of ['users', 'sites', 'reports', 'vehicles'] as TabId[]) {
        expect(resolveTabForRole(role, pathForTab(tab))).not.toBe(tab);
      }
    }
  });

  it('denies the accountant write-oriented tabs by URL', () => {
    for (const tab of ['sites', 'users', 'expenses', 'issues'] as TabId[]) {
      expect(resolveTabForRole('accountant', pathForTab(tab))).not.toBe(tab);
    }
  });

  it('denies a surveyor the users tab by URL', () => {
    expect(resolveTabForRole('surveyor', pathForTab('users'))).not.toBe('users');
  });
});
