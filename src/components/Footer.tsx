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
    <footer className="bg-slate-900 text-slate-300 py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="mb-10 flex shrink-0 justify-center lg:justify-start"
          aria-label="HapyJo Ltd home"
        >
          <img
            src={logoImg}
            alt={COMPANY.name}
            className="h-10 w-auto sm:h-11"
            width={140}
            height={44}
          />
        </a>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Operational Address */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Operational Address
            </h3>
            <address className="not-italic space-y-1 text-sm">
              <p>{COMPANY.address.country}</p>
              <p>{COMPANY.address.province}</p>
              <p>{COMPANY.address.district}</p>
              <p>{COMPANY.address.sector}</p>
            </address>
          </div>

          {/* Column 2: Corporate Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Corporate Support
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-colors hover:text-white"
                >
                  {COMPANY.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-white"
                >
                  {COMPANY.phone}
                </a>
              </p>
            </div>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Navigation
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                {footerNavLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Section divider */}
        <div className="mt-12 pt-6 border-t border-slate-800">
          {/* Bottom trust bar: centered copyright */}
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {COMPANY.name}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
