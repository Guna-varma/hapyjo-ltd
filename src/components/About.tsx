import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { IMAGE_ALLOCATION } from "@/lib/image-allocation";
import { FLEET_STATS } from "@/lib/constants";

const About = () => {
  const { ref, isVisible } = useFadeInOnScroll();
  const [main, sub1] = IMAGE_ALLOCATION.about.map(getHapyjoImage);

  return (
    <section
      id="about"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-background py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Company Overview
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Who We Are
          </h2>
          <div className="divider-industrial mx-auto mt-4" />
        </div>

        <div className="mt-12 grid items-center gap-10 sm:mt-14 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            {main && (
              <div className="responsive-image-container overflow-hidden rounded-2xl border border-border shadow-soft">
                <img
                  src={main}
                  alt="Professional construction site operations and machinery"
                  className="image-industrial"
                  loading="lazy"
                />
              </div>
            )}
            {sub1 && (
              <div className="responsive-image-container overflow-hidden rounded-2xl border border-border shadow-soft">
                <img
                  src={sub1}
                  alt="Site and fleet operations"
                  className="image-industrial"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="text-base leading-relaxed text-muted-foreground">
              HapyJo Ltd is a professionally managed site support and fleet operations company
              delivering reliable construction logistics, machinery rentals, and on-site
              operational services.
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              With an expanding fleet of {FLEET_STATS.totalFleet} units ({FLEET_STATS.machines} machines and {FLEET_STATS.trucks} trucks),
              HapyJo supports infrastructure contractors, logistics operators,
              and project developers across multiple sectors.
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              We specialize in site-ready equipment deployment, workforce logistics, and
              dependable fleet availability for uninterrupted project execution.
            </p>
            <p className="text-sm text-muted-foreground/90">
              Our operational base is at SIBLINGS BUUM HOTEL in Bugesera—visit our location page for directions and to plan your site visit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
