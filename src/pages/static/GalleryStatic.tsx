import { Layout } from "@/components/Layout";
import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { getGalleryImageIndices } from "@/lib/image-allocation";
import { GALLERY_IMAGES_PER_PAGE } from "@/lib/image-allocation";
import { OptimizedImage } from "@/components/OptimizedImage";

const GALLERY_PAGES = [
  "gallery.html",
  "gallery-page-2.html",
  "gallery-page-3.html",
  "gallery-page-4.html",
];

export default function GalleryStatic({ page }: { page: number }) {
  const { ref, isVisible } = useFadeInOnScroll();
  const allIndices = getGalleryImageIndices();
  const start = (page - 1) * GALLERY_IMAGES_PER_PAGE;
  const pageIndices = allIndices.slice(start, start + GALLERY_IMAGES_PER_PAGE);

  return (
    <Layout>
      <section className="section-classic" ref={ref as React.RefObject<HTMLElement>}>
        <div className="mx-auto max-w-[1200px] px-6">
          <header className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#C6A961]">Our Fleet &amp; Projects</p>
            <h1 className="font-serif text-3xl font-bold text-[#2C2C2C] sm:text-4xl">Gallery</h1>
            <div className="gold-divider mt-5 mx-auto" />
            <p className="mt-6 max-w-2xl mx-auto text-[#2C2C2C]/80" style={{ lineHeight: 1.7 }}>
              Equipment, sites, and operations across our fleet and project portfolio.
            </p>
          </header>

          <div className={`mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 stagger-children ${isVisible ? "is-visible" : ""}`}>
            {pageIndices.map((index, i) => {
              const src = getHapyjoImage(index);
              if (!src) return null;
              return (
                <div key={index} className="overflow-hidden rounded-lg border border-[#0A1F44]/10 bg-white aspect-square card-classic">
                  <OptimizedImage
                    src={src}
                    alt={`Fleet and project gallery image ${i + 1}`}
                    aspectRatio="1"
                    rounded="rounded-lg"
                  />
                </div>
              );
            })}
          </div>

          {GALLERY_PAGES.length > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Gallery pagination">
              {GALLERY_PAGES.map((file, i) => {
                const p = i + 1;
                const isCurrent = p === page;
                return (
                  <a
                    key={file}
                    href={p === 1 ? "/gallery" : `/${file.replace(".html", "")}`}
                    className={`inline-block px-4 py-2 text-sm font-medium ${
                      isCurrent ? "bg-[#0A1F44] text-[#F8F5F0]" : "bg-[#F8F5F0] text-[#2C2C2C] border border-[#0A1F44]/10"
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {p}
                  </a>
                );
              })}
            </nav>
          )}

          <p className="mt-8 text-center">
            <a href="/" className="text-sm text-[#2C2C2C]/70">Back to Home</a>
          </p>
        </div>
      </section>
    </Layout>
  );
}
