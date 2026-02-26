import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Button } from "@/components/ui/button";
import { Clock, Shield, TrendingUp } from "lucide-react";

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
              className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 text-base font-semibold"
            >
              <a href="#contact">Enquire About Rentals</a>
            </Button>
          </div>

          {/* Right — Visual block */}
          <div className="relative hidden lg:block">
            <div className="aspect-[4/5] rounded-lg bg-primary/5 border border-border overflow-hidden flex items-center justify-center">
              <div className="text-center px-8">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 17h4V5H2v12h3" />
                    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
                    <circle cx="7.5" cy="17.5" r="2.5" />
                    <circle cx="17.5" cy="17.5" r="2.5" />
                  </svg>
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">Trucks &amp; Heavy Machinery</p>
                <p className="mt-3 text-muted-foreground">Earthmoving · Construction · Logistics</p>
                <div className="mt-6 flex justify-center gap-6">
                  <div className="text-center">
                    <p className="font-serif text-3xl font-bold text-accent">24/7</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Availability</p>
                  </div>
                  <div className="text-center">
                    <p className="font-serif text-3xl font-bold text-accent">RWF</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Pricing</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative accent */}
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border-2 border-accent/20 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rentals;
