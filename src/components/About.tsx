import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import aboutSite from "@/assets/about-site.jpg";

const About = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="about"
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Image */}
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={aboutSite}
              alt="Aerial view of a construction site in Rwanda with earthworks and machinery"
              className="h-auto w-full object-cover rounded-lg"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/5" />
          </div>

          {/* Content */}
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Who We Are
            </p>
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              Your Trusted Partner in Rwanda
            </h2>
            <div className="mt-4 h-px w-16 bg-accent animate-gold-line" style={{ animationPlayState: isVisible ? "running" : "paused" }} />
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
              HapyJo Ltd brings order, clarity, and control to site operations across Rwanda.
              From managing fleets and tracking expenses to offering vehicle and machinery rentals,
              we serve as the operational backbone for businesses that demand precision and
              professional standards — all accounted for in Rwandan Francs.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              We partner with contractors, project owners, and institutional stakeholders who
              need reliable site management, cost control, and access to a professional fleet.
              When operations must run seamlessly, Hapyjo delivers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
