import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <header className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-primary">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(230,22%,18%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-accent">
          Rwanda's Premier Operations Partner
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Site Operations, Fleet Control
          <span className="block mt-2">& Financial Clarity</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
          Vehicle &amp; machinery rentals, expense management, and full operational
          visibility — all delivered with precision in RWF.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-10 py-6 text-base font-semibold tracking-wide"
          >
            <a href="#services">Explore Our Services</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 px-10 py-6 text-base"
          >
            <a href="#contact">Get in Touch</a>
          </Button>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </header>
  );
};

export default Hero;
