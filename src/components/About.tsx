import { useFadeInOnScroll } from "@/hooks/use-fade-in";

const About = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="about"
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Who We Are
        </p>
        <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
          Your Trusted Partner in Rwanda
        </h2>
        <div className="mx-auto mt-4 h-px w-16 bg-accent" />
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
    </section>
  );
};

export default About;
