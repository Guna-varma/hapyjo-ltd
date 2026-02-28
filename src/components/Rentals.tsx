import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { FLEET_STATS } from "@/lib/constants";

const equipment = [
  { title: "Excavators", description: "Digging and earthmoving for foundations, trenching, and demolition." },
  { title: "Dump Trucks", description: "Heavy-duty hauling for earthworks, mining, and road construction." },
  { title: "Wheel Loaders", description: "Material loading and site clearing for large-scale operations." },
  { title: "Transit Mixers", description: "On-demand concrete mixing and delivery for construction pours." },
  { title: "Hydraulic Cranes", description: "Heavy lifting and positioning for structural and industrial work." },
  { title: "Site Utility Vehicles", description: "Rugged site transport for personnel, tools, and light materials." },
];

const Rentals = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="rentals"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-stone py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
              Equipment Rental
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Select Equipment for Your Project
            </h2>
            <div className="divider-industrial mt-4" />
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
              Professional-grade vehicles and heavy machinery on flexible day or hourly terms. 
              Our maintained fleet of {FLEET_STATS.totalFleet} units ({FLEET_STATS.machines} machines, {FLEET_STATS.trucks} trucks) 
              is deployment-ready for construction, logistics, and industrial site work.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {equipment.map((e) => (
              <a
                key={e.title}
                href="/rentals"
                className="block rounded-xl border border-border bg-card p-4 text-left transition-[background-color,border-color] hover:bg-white hover:border-stone-dark sm:p-6"
              >
                <span className="block h-0.5 w-12 bg-navy" aria-hidden />
                <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                  {e.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {e.description}
                </p>
                <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wider text-navy">
                  Get Rental Quote →
                </span>
              </a>
            ))}
          </div>
          <div className="mt-10 flex justify-center lg:justify-start">
            <a href="/contact" className="btn-cta">
              Get Rental Quote
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rentals;
