import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Rentals", href: "#rentals" },
  { label: "Industries", href: "#industries" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a href="#" className="font-serif text-2xl font-bold tracking-tight text-primary transition-colors hover:text-accent">
            HAPYJO
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="gold-underline text-sm font-medium uppercase tracking-wider text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Button
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded px-7 py-5 text-sm font-semibold uppercase tracking-wider"
            >
              <a href="#contact">Get in Touch</a>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-foreground p-1"
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* Mobile slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-72 bg-background shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="font-serif text-xl font-bold text-primary">HAPYJO</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-0">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="gold-underline block py-3 text-base font-medium uppercase tracking-wider text-foreground/70 transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-4">
                <Button
                  asChild
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-5 text-sm font-semibold uppercase tracking-wider"
                >
                  <a href="#contact" onClick={() => setOpen(false)}>Get in Touch</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
