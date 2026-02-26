import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Target, Globe, Banknote, Award } from "lucide-react";

const points = [
  {
    icon: Target,
    title: "Precision & Control",
    stat: "100%",
    description: "Full visibility over every operation, trip, and transaction.",
  },
  {
    icon: Globe,
    title: "Local Expertise",
    stat: "Rwanda",
    description: "Deep understanding of the Rwandan market, regulations, and logistics landscape.",
  },
  {
    icon: Banknote,
    title: "RWF-Based Operations",
    stat: "RWF",
    description: "All financial reporting, invoicing, and cost control in Rwandan Francs.",
  },
  {
    icon: Award,
    title: "Professional Standards",
    stat: "A+",
    description: "Internationally credible processes adapted for the East African market.",
  },
];

const Trust = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} bg-primary py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Why Hapyjo
          </p>
          <h2 className="font-serif text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
            Built on Trust &amp; Precision
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-accent" />
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div key={p.title} className="text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 text-accent">
                <p.icon size={24} />
              </div>
              <p className="font-serif text-3xl font-bold text-accent">{p.stat}</p>
              <h3 className="mt-2 font-semibold text-primary-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/60">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Trust;
