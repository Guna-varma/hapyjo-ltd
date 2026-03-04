import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { getIndustriesForListing } from "@/lib/industries-data";
import { ArrowRight } from "lucide-react";

const Industries = () => {
  const { ref, isVisible } = useFadeInOnScroll();
  const industries = getIndustriesForListing();

  return (
    <section
      id="industries"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-background py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Hero / intro */}
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Sectors We Serve
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Industry Deployment
          </h2>
          <div className="divider-industrial mx-auto mt-4" />
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HapyJo supports contractors and project owners across road construction, mining, industrial logistics, infrastructure, and commercial building. Click any sector below to see how we deliver equipment, site support, and logistics for your industry.
          </p>
        </div>

        {/* Cards – each links to detail page */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {industries.map((ind) => {
            const img = getHapyjoImage(ind.imageIndex);
            return (
              <a
                key={ind.id}
                href={`/${ind.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft transition-all duration-300 hover:border-stone-dark hover:shadow-soft-lg"
              >
                {img && (
                  <div className="responsive-image-container overflow-hidden">
                    <img
                      src={img}
                      alt=""
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03] image-industrial"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between border-t border-border px-5 py-5 sm:px-6 sm:py-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold leading-snug text-foreground group-hover:text-navy sm:text-xl">
                      {ind.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {ind.shortDescription}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-navy">
                    View sector details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Need equipment or site support for a different sector?{" "}
          <a href="/contact" className="font-semibold text-navy underline-offset-4 hover:underline">
            Get in touch
          </a>{" "}
          and we’ll tailor a plan to your project.
        </p>
      </div>
    </section>
  );
};

export default Industries;
