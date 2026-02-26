import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <header className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 animate-hero-image">
        <img
          src={heroBg}
          alt="Construction site with trucks and machinery at golden hour in Rwanda"
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p
          className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-accent opacity-0 animate-hero-text"
          style={{ animationDelay: "200ms" }}
        >
          Rwanda's Premier Operations Partner
        </p>
        <h1
          className="font-serif text-4xl font-bold leading-[1.1] text-primary-foreground opacity-0 animate-hero-text sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animationDelay: "400ms" }}
        >
          Site Operations, Fleet Control
          <span className="block mt-3">&amp; Financial Clarity</span>
        </h1>
        <p
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-primary-foreground/80 opacity-0 animate-hero-text sm:text-xl"
          style={{ animationDelay: "600ms" }}
        >
          Vehicle &amp; machinery rentals, expense management, and full operational
          visibility — all delivered with precision in RWF.
        </p>
        <div
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center opacity-0 animate-hero-text"
          style={{ animationDelay: "800ms" }}
        >
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-base font-semibold tracking-wide shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30"
          >
            <a href="#services">Explore Our Services</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-10 py-6 text-base backdrop-blur-sm"
          >
            <a href="#contact">Get in Touch</a>
          </Button>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </header>
  );
};

export default Hero;
