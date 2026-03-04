import { useFadeInOnScroll } from "@/hooks/use-fade-in";

const badges = [
  { title: "Safety Compliance", description: "Operations meet safety and compliance standards." },
  { title: "Maintained Fleet", description: "Regular maintenance and inspection for reliability." },
  { title: "Skilled Operators", description: "Certified operators for equipment and site work." },
  { title: "Reliable Site Delivery", description: "On-time deployment and site logistics support." },
  { title: "Scalable Workforce", description: "Workforce and equipment scale to project needs." },
];

const WhyChoose = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-[hsl(var(--navy))] py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Our Advantage
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Why Choose HapyJo
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-white/30" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-5">
          {badges.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/10 bg-white/5 py-5 pl-5 pr-5 shadow-soft transition-all duration-300 hover:bg-white/10 hover:shadow-soft-lg sm:py-6 sm:pl-6 sm:pr-6"
            >
              <span className="block h-1 w-12 rounded-full bg-equipment-yellow" aria-hidden />
              <h3 className="mt-4 font-heading text-base font-bold text-white sm:text-lg">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
