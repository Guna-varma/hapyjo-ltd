import { useFadeInOnScroll } from "@/hooks/use-fade-in";

const GalleryCTA = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="gallery-cta"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-background py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto mb-6 block h-0.5 w-16 bg-navy" aria-hidden />
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Our Fleet &amp; Projects
          </h2>
          <p className="mt-3 mx-auto max-w-md text-muted-foreground">
            Browse equipment, sites, and operations in our gallery.
          </p>
          <a href="/gallery" className="btn-cta mt-8">
            Check Fleet Availability
          </a>
        </div>
      </div>
    </section>
  );
};

export default GalleryCTA;
