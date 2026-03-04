import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { IMAGE_ALLOCATION } from "@/lib/image-allocation";

const services = [
  {
    title: "Construction Site Support",
    outcome: "Site logistics, coordination, and operational support to keep projects on track.",
    deployment: "Project-based and ongoing site coverage",
    cta: "Check Deployment Availability",
    ctaHref: "/contact",
    imageIndex: IMAGE_ALLOCATION.services[0],
  },
  {
    title: "Fleet Logistics Management",
    outcome: "End-to-end fleet deployment, tracking, and maintenance for maximum uptime.",
    deployment: "Full fleet deployment and tracking",
    cta: "Check Deployment Availability",
    ctaHref: "/contact",
    imageIndex: IMAGE_ALLOCATION.services[1],
  },
  {
    title: "Heavy Equipment Rentals",
    outcome: "Excavators, loaders, cranes, and earthmoving machinery on flexible terms.",
    deployment: "Day, weekly, or project-based rental",
    cta: "Request Rental Quote",
    ctaHref: "/rentals",
    imageIndex: IMAGE_ALLOCATION.services[2],
  },
  {
    title: "On-Site Workforce Transport",
    outcome: "Safe, reliable transport for crews and personnel to and from project sites.",
    deployment: "Scheduled and on-demand transport",
    cta: "Check Deployment Availability",
    ctaHref: "/contact",
    imageIndex: IMAGE_ALLOCATION.services[3],
  },
  {
    title: "Project-Based Machinery Deployment",
    outcome: "Tailored equipment packages for your project scope and timeline.",
    deployment: "Turnkey deployment to site",
    cta: "View Equipment Capability",
    ctaHref: "/services",
    imageIndex: IMAGE_ALLOCATION.services[4],
  },
  {
    title: "Material Handling Equipment Supply",
    outcome: "Forklifts, handlers, and material-moving equipment for construction needs.",
    deployment: "Warehouse and site delivery",
    cta: "Request Rental Quote",
    ctaHref: "/rentals",
    imageIndex: IMAGE_ALLOCATION.services[5],
  },
];

const Services = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="services"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-background ${isVisible ? "opacity-100" : ""} py-16 sm:py-20 lg:py-24`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Operational Services
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            What We Deliver
          </h2>
          <div className="mt-3 h-px w-12 bg-slate-300" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {services.map((s) => {
            const img = getHapyjoImage(s.imageIndex);
            return (
              <article
                key={s.title}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/80 shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:border-stone-dark"
              >
                {img && (
                  <div className="responsive-image-container rounded-t-2xl border-b border-border overflow-hidden">
                    <img
                      src={img}
                      alt=""
                      className="image-industrial"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex h-full flex-col justify-between p-6 sm:p-8">
                  <div>
                    <h3 className="font-heading text-left text-lg font-bold text-foreground md:text-xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {s.deployment}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {s.outcome}
                    </p>
                    <div className="mt-6 border-t border-border pt-4">
                      <span className="text-xs font-medium text-muted-foreground">
                        Available
                      </span>
                      <a
                        href={s.ctaHref}
                        className="mt-3 block text-sm font-semibold text-navy underline-offset-4 transition-colors hover:underline"
                      >
                        {s.cta}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
