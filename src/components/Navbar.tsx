import { useState } from "react";
import { Menu, X } from "lucide-react";

const logoImg = new URL("../assets/Hapyjoimage.png", import.meta.url).href;

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Rentals", href: "/rentals" },
  { label: "Industries", href: "/industries" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-[1000] border-b border-stone-dark bg-stone/95 backdrop-blur-sm py-3 sm:py-4 shadow-soft"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[1200px] flex-shrink-0 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2 sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-xl"
            aria-label="HapyJo Ltd home"
          >
            <img
              src={logoImg}
              alt=""
              className="h-10 w-auto object-contain sm:h-12 md:h-14 lg:h-[3.5rem] drop-shadow-md"
              style={{ minHeight: 40, maxHeight: 60 }}
              fetchPriority="high"
            />
            <span className="hidden font-heading text-base font-bold tracking-tight text-navy sm:block md:text-lg">
              HapyJo Ltd
            </span>
          </a>

          <div className="hidden items-center gap-6 lg:gap-8 xl:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-steel transition-colors hover:text-navy"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/contact"
              className="btn-cta shrink-0 whitespace-nowrap text-center"
            >
              Request Equipment Deployment
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex shrink-0 p-2 text-navy xl:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[1001]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-navy/20" />
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-stone-dark bg-stone shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-dark p-4 sm:p-6">
              <a href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-2">
                <img
                  src={logoImg}
                  alt=""
                  className="h-10 w-auto object-contain sm:h-12"
                  style={{ minHeight: 40 }}
                />
                <span className="font-heading text-base font-bold text-navy">HapyJo Ltd</span>
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 text-steel hover:text-navy"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-0 overflow-y-auto p-4 sm:p-6">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-stone-dark py-4 text-base font-semibold uppercase tracking-wider text-navy"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-4">
                <a
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="btn-cta flex w-full justify-center"
                >
                  Request Equipment Deployment
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
