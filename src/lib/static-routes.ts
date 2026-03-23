/**
 * Static page IDs derived from pathname.
 * No dynamic routing – each .html file maps to one page.
 */
import { INDUSTRY_PAGE_IDS } from "@/lib/industries-data";

export function getPageIdFromPathname(pathname: string): string {
  const base = pathname.replace(/^\//, "").replace(/\.html$/, "").toLowerCase();
  if (!base || base === "index") return "index";
  return base;
}

export const STATIC_PAGE_IDS = [
  "index",
  "about",
  "privacy",
  "services",
  "rentals",
  "industries",
  ...INDUSTRY_PAGE_IDS,
  "blog",
  "blog-fleet-deployment",
  "blog-machinery-planning",
  "blog-dump-truck",
  "blog-heavy-equipment-rental",
  "blog-site-logistics",
  "blog-transport-efficiency",
  "gallery",
  "gallery-page-2",
  "gallery-page-3",
  "gallery-page-4",
  "contact",
] as const;

export type StaticPageId = (typeof STATIC_PAGE_IDS)[number];

/** Clean URL path for a page (Vercel rewrites serve .html at these paths). */
export function pathForPageId(pageId: StaticPageId): string {
  if (pageId === "index") return "/";
  return `/${pageId}`;
}

/** First 6 blog posts for list page; static detail filenames. */
export const BLOG_STATIC_PAGES = [
  { slug: "fleet-deployment-construction", file: "blog-fleet-deployment.html" },
  { slug: "machinery-planning-road-projects", file: "blog-machinery-planning.html" },
  { slug: "dump-truck-usage-optimization", file: "blog-dump-truck.html" },
  { slug: "heavy-equipment-rental-planning", file: "blog-heavy-equipment-rental.html" },
  { slug: "site-logistics-management", file: "blog-site-logistics.html" },
  { slug: "transport-efficiency-industrial-projects", file: "blog-transport-efficiency.html" },
] as const;
