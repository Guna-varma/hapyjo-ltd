import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { getGalleryImageIndices, getGalleryTotalPages, GALLERY_IMAGES_PER_PAGE } from "@/lib/image-allocation";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const GalleryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const totalPages = getGalleryTotalPages();
  const currentPage = Math.min(page, totalPages || 1);

  const allIndices = useMemo(() => getGalleryImageIndices(), []);
  const start = (currentPage - 1) * GALLERY_IMAGES_PER_PAGE;
  const pageIndices = allIndices.slice(start, start + GALLERY_IMAGES_PER_PAGE);

  const setPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    setSearchParams(next === 1 ? {} : { page: String(next) });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent">
              Our Fleet &amp; Projects
            </p>
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Gallery
            </h1>
            <div className="mx-auto mt-5 gold-divider w-24" />
            <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
              Equipment, sites, and operations across our fleet and project portfolio.
            </p>
          </div>

          <GalleryGrid indices={pageIndices} />

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function GalleryGrid({ indices }: { indices: number[] }) {
  const { ref, isVisible } = useFadeInOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 stagger-children ${isVisible ? "is-visible" : ""}`}
    >
      {indices.map((index, i) => {
        const src = getHapyjoImage(index);
        if (!src) return null;
        return (
          <div
            key={index}
            className="card-glow group overflow-hidden rounded-lg border border-border bg-card aspect-square"
          >
            <OptimizedImage
              src={src}
              alt={`Fleet and project gallery image ${i + 1}`}
              aspectRatio="1"
              rounded="rounded-lg"
              className="group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        );
      })}
    </div>
  );
}

export default GalleryPage;
