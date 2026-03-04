import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const logoImg = new URL("../assets/Hapyjoimage.png", import.meta.url).href;

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Rentals", href: "/rentals" },
  { label: "Industries", href: "/industries" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

function isActive(href: string, pathname: string): boolean {
  const path = pathname.replace(/^\//, "").replace(/\.html$/, "").toLowerCase();
  const base = href.replace(/^\//, "");
  if (base === "blog") return path === "blog" || path.startsWith("blog-");
  if (base === "gallery") return path === "gallery" || path.startsWith("gallery-");
  if (base === "industries") return path === "industries" || path.startsWith("industry-");
  return path === base || (path === "" && base === "index");
}

const NAV_DRAWER_DURATION_MS = 300;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(true); // start off-screen so enter animation runs
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  const startClose = () => {
    setIsClosing(true);
  };

  // Run slide-in: after mount with open=true, trigger transition to translate-x-0
  useEffect(() => {
    if (!open || isClosing) return;
    const frame = requestAnimationFrame(() => {
      setIsEntering(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, isClosing]);

  // Reset entering when drawer is closed so next open animates in
  useEffect(() => {
    if (!open && !isClosing) setIsEntering(true);
  }, [open, isClosing]);

  useEffect(() => {
    if (!isClosing) return;
    const t = setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, NAV_DRAWER_DURATION_MS);
    return () => clearTimeout(t);
  }, [isClosing]);

  return (
    <>
      <nav
        className="sticky top-0 z-[1000] border-b border-stone-dark bg-stone/95 backdrop-blur-sm py-4 shadow-soft"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[1200px] flex-shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:gap-4 lg:px-8">
          <a
            href="/"
            className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-xl"
            aria-label="HapyJo Ltd home"
          >
            <img
              src={logoImg}
              alt="HapyJo Ltd"
              className="h-8 w-auto object-contain sm:h-9 md:h-10 lg:h-10 drop-shadow-sm"
              fetchPriority="high"
            />
          </a>

          <div className="hidden items-center gap-5 lg:gap-6 xl:flex">
            {navLinks.map((l) => {
              const active = isActive(l.href, pathname);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-colors hover:text-navy lg:text-sm ${
                    active ? "border-b-2 border-navy font-bold text-navy" : "text-steel"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </a>
              );
            })}
            <a
              href="/contact#contact"
              className="shrink-0 whitespace-nowrap rounded-lg border-2 border-navy bg-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-navy-light"
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

      {(open || isClosing) && (
        <div
          className={`fixed inset-0 z-[1001] transition-opacity duration-300 ease-out ${
            open && !isClosing && !isEntering ? "opacity-100" : "opacity-0"
          } ${isClosing ? "pointer-events-none" : ""}`}
          onClick={startClose}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-navy/20" />
          <div
            className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-stone-dark bg-stone shadow-xl transition-transform duration-300 ease-out ${
              open && !isClosing && !isEntering ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-dark p-4 sm:p-6">
              <a href="/" onClick={startClose} className="flex shrink-0">
                <img
                  src={logoImg}
                  alt="HapyJo Ltd"
                  className="h-15 w-auto object-contain sm:h-20"
                />
              </a>
              <button
                type="button"
                onClick={startClose}
                aria-label="Close menu"
                className="p-2 text-steel hover:text-navy"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-0 overflow-y-auto p-4 sm:p-6">
              {navLinks.map((l) => {
                const active = isActive(l.href, pathname);
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={startClose}
                    className={`block border-b border-stone-dark py-4 text-base font-semibold uppercase tracking-wider ${
                      active ? "border-l-4 border-navy pl-4 font-bold text-navy" : "text-navy"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </a>
                );
              })}
              <div className="pt-4">
                <a
                  href="/contact#contact"
                  onClick={startClose}
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
