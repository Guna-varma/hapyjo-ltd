import { COMPANY } from "@/lib/constants";

const logoImg = new URL("../assets/Hapyjoimage.png", import.meta.url).href;

const footerNavLinks = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Rentals", href: "/rentals" },
  { label: "Industries", href: "/industries" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-900/95 text-slate-300 py-16 sm:py-20 shadow-soft-xl">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="mb-10 flex shrink-0 items-center gap-2 justify-center lg:justify-start"
          aria-label="HapyJo Ltd home"
        >
          <img
            src={logoImg}
            alt=""
            className="h-12 w-auto object-contain sm:h-14"
          />
          <span className="font-heading text-lg font-bold text-white">HapyJo Ltd</span>
        </a>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Operational Address */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
            <h3 className="font-heading mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Operational Address
            </h3>
            <address className="not-italic space-y-1 text-sm leading-relaxed">
              <p>{COMPANY.address.country}</p>
              <p>{COMPANY.address.province}</p>
              <p>{COMPANY.address.district}</p>
              <p>{COMPANY.address.sector}</p>
            </address>
            <a
              href="/contact#location"
              className="mt-4 inline-block text-xs font-semibold text-equipment-yellow transition-colors hover:underline"
            >
              View on map →
            </a>
          </div>

          {/* Column 2: Corporate Support */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
            <h3 className="font-heading mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Corporate Support
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {COMPANY.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {COMPANY.phone}
                </a>
              </p>
            </div>
          </div>

          {/* Column 3: Navigation */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-sm">
            <h3 className="font-heading mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Navigation
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {footerNavLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="/contact#location" className="text-sm transition-colors duration-200 hover:text-white">
                    Our Location
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Section divider */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {COMPANY.name}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
