import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Button } from "@/components/ui/button";
import { Clock, Shield, TrendingUp } from "lucide-react";
import rentalsFleet from "@/assets/rentals-fleet.jpg";

const features = [
  {
    icon: Clock,
    title: "Flexible Terms",
    description: "Rent by the day or hour — scaled to your project timeline and budget.",
  },
  {
    icon: Shield,
    title: "Professional Fleet",
    description: "Well-maintained trucks and heavy machinery, ready for demanding site conditions.",
  },
  {
    icon: TrendingUp,
    title: "Built for Scale",
    description: "From single-vehicle hires to multi-unit fleet deployments for large-scale projects.",
  },
];

const Rentals = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="rentals"
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — Content */}
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Vehicle &amp; Machinery Rentals
            </p>
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              The Fleet Your Projects Demand
            </h2>
            <div className="mt-4 h-px w-16 bg-accent" />
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Access trucks, earthmoving equipment, and construction machinery on flexible
              rental terms. Whether you need a single vehicle for a day or an entire fleet
              for a multi-month project, Hapyjo delivers — professionally maintained,
              competitively priced, and ready to work.
            </p>

            <div className="mt-10 space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              asChild
              className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 text-base font-semibold shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/25"
            >
              <a href="#contact">Enquire About Rentals</a>
            </Button>
          </div>

          {/* Right — Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-lg">
              <img
                src={rentalsFleet}
                alt="Fleet of heavy-duty trucks lined up at golden hour"
                className="h-auto w-full object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/5" />
            </div>
            {/* Decorative accent frame */}
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border-2 border-accent/20 -z-10" />
            {/* Stats overlay */}
            <div className="absolute -bottom-6 -left-6 rounded-lg bg-primary p-6 shadow-2xl">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-accent">24/7</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/60">Availability</p>
                </div>
                <div className="h-auto w-px bg-primary-foreground/10" />
                <div className="text-center">
                  <p className="font-serif text-2xl font-bold text-accent">RWF</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/60">Pricing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rentals;
