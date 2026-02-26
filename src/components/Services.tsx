import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import {
  MapPin,
  Truck,
  Wrench,
  Fuel,
  BarChart3,
  Landmark,
} from "lucide-react";

const services = [
  {
    icon: MapPin,
    title: "Site Operations & Field Management",
    description:
      "End-to-end coordination of field activities, workforce, and site logistics — ensuring every project runs on schedule.",
  },
  {
    icon: Truck,
    title: "Fleet & Vehicle Management",
    description:
      "Real-time oversight of your entire fleet: deployment, maintenance, utilisation, and performance tracking.",
  },
  {
    icon: Wrench,
    title: "Vehicle & Machinery Rentals",
    description:
      "Trucks, earthmoving, and construction equipment available on flexible day or hour terms for your projects.",
  },
  {
    icon: Fuel,
    title: "Expenses, Fuel & Cost Control",
    description:
      "Granular tracking of fuel consumption, maintenance costs, and operational expenses — no surprises, full transparency.",
  },
  {
    icon: BarChart3,
    title: "Surveys, Volume & Revenue Visibility",
    description:
      "Volume surveys, trip tracking, and revenue analytics that give you a clear picture of project performance.",
  },
  {
    icon: Landmark,
    title: "Financial Control & Reporting (RWF)",
    description:
      "Comprehensive financial oversight in Rwandan Francs: budgets, invoicing, profit margins, and compliance reporting.",
  },
];

const Services = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="services"
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} bg-secondary py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            What We Do
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Comprehensive Operations & Control
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-accent" />
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-lg border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-accent/10 text-accent">
                <s.icon size={24} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
