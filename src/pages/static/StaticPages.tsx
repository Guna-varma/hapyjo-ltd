import { Layout } from "@/components/Layout";
import HomePage from "./HomePage";
import AboutPage from "./AboutPage";
import ServicesPage from "./ServicesPage";
import RentalsPage from "./RentalsPage";
import IndustriesPage from "./IndustriesPage";
import IndustryDetailPage from "./IndustryDetailPage";
import BlogListPage from "./BlogListPage";
import BlogDetailStatic from "./BlogDetailStatic";
import GalleryStatic from "./GalleryStatic";
import ContactPage from "./ContactPage";
import PrivacyPage from "./PrivacyPage";
import NotFound from "../NotFound";
import type { StaticPageId } from "@/lib/static-routes";
import { INDUSTRY_PAGE_IDS } from "@/lib/industries-data";

const industryPages: Partial<Record<StaticPageId, React.ReactNode>> = {};
INDUSTRY_PAGE_IDS.forEach((id) => {
  industryPages[id as StaticPageId] = <IndustryDetailPage pageId={id as StaticPageId} />;
});

const PAGE_MAP: Record<StaticPageId, React.ReactNode> = {
  index: <HomePage />,
  about: <AboutPage />,
  privacy: <PrivacyPage />,
  services: <ServicesPage />,
  rentals: <RentalsPage />,
  industries: <IndustriesPage />,
  ...industryPages,
  blog: <BlogListPage />,
  "blog-fleet-deployment": <BlogDetailStatic pageId="blog-fleet-deployment" />,
  "blog-machinery-planning": <BlogDetailStatic pageId="blog-machinery-planning" />,
  "blog-dump-truck": <BlogDetailStatic pageId="blog-dump-truck" />,
  "blog-heavy-equipment-rental": <BlogDetailStatic pageId="blog-heavy-equipment-rental" />,
  "blog-site-logistics": <BlogDetailStatic pageId="blog-site-logistics" />,
  "blog-transport-efficiency": <BlogDetailStatic pageId="blog-transport-efficiency" />,
  gallery: <GalleryStatic page={1} />,
  "gallery-page-2": <GalleryStatic page={2} />,
  "gallery-page-3": <GalleryStatic page={3} />,
  "gallery-page-4": <GalleryStatic page={4} />,
  contact: <ContactPage />,
};

export function getStaticPage(pageId: string): React.ReactNode {
  if (pageId in PAGE_MAP) return PAGE_MAP[pageId as StaticPageId];
  return <Layout><NotFound /></Layout>;
}
