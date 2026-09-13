import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * The site a supervisor is currently "looking at". Picked on the assistant
 * supervisor dashboard and remembered while the app is open, so the Expenses,
 * Surveys and Issues tabs open on the same site instead of mixing every site the
 * user is responsible for. Screens read it as a default only; the user can still
 * switch to any site (or "All") on each screen.
 */
interface SiteSelectionValue {
  selectedSiteId: string | null;
  setSelectedSiteId: (siteId: string | null) => void;
}

const SiteSelectionContext = createContext<SiteSelectionValue | null>(null);

export function SiteSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedSiteId, setSelected] = useState<string | null>(null);
  const setSelectedSiteId = useCallback((siteId: string | null) => setSelected(siteId), []);
  const value = useMemo(() => ({ selectedSiteId, setSelectedSiteId }), [selectedSiteId, setSelectedSiteId]);
  return <SiteSelectionContext.Provider value={value}>{children}</SiteSelectionContext.Provider>;
}

/** Safe outside the provider (tests, isolated renders): no selection. */
export function useSiteSelection(): SiteSelectionValue {
  const ctx = useContext(SiteSelectionContext);
  return ctx ?? { selectedSiteId: null, setSelectedSiteId: () => {} };
}
