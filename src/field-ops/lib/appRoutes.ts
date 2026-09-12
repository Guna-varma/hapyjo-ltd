/**
 * Maps the mobile app's tabs onto real web URLs under /app.
 *
 * The mobile shell navigates by `activeTab: TabId` held in state. On the web every
 * destination needs an address so it can be bookmarked, refreshed and deep-linked,
 * so each TabId gets a path. The tab set and their order still come from
 * lib/rbac.getTabsForRole(), which stays the single source of truth for access.
 */

import type { TabId } from '@/field-ops/lib/rbac';

/** Base path the Field Operations app is mounted at (React Router basename). */
export const APP_BASENAME = '/app';

/** Path segment for each tab. Keep these stable: they are user-visible URLs. */
const TAB_PATHS: Record<TabId, string> = {
  dashboard: 'dashboard',
  reports: 'reports',
  tasks: 'tasks',
  users: 'users',
  sites: 'sites',
  vehicles: 'vehicles',
  expenses: 'expenses',
  surveys: 'surveys',
  issues: 'issues',
  // Owners see this tab labelled "Work Progress Gallery"; the path follows the feature.
  gps_camera: 'work-progress',
  settings: 'settings',
};

const PATH_TO_TAB: Record<string, TabId> = Object.fromEntries(
  (Object.entries(TAB_PATHS) as [TabId, string][]).map(([tab, path]) => [path, tab]),
) as Record<string, TabId>;

/** Route path (relative to the basename) for a tab, e.g. "/sites". */
export function pathForTab(tab: TabId): string {
  return '/' + TAB_PATHS[tab];
}

/** The tab a pathname addresses, or null when it matches none. */
export function tabForPath(pathname: string): TabId | null {
  const segment = pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase() ?? '';
  if (!segment) return null;
  return PATH_TO_TAB[segment] ?? null;
}

/** Every tab path, for route generation. */
export function allTabPaths(): { tab: TabId; path: string }[] {
  return (Object.entries(TAB_PATHS) as [TabId, string][]).map(([tab, path]) => ({ tab, path }));
}

/** Login route (relative to the basename). */
export const LOGIN_PATH = '/login';
