const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Rentals", href: "#rentals" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => {
  return (
    <footer className="bg-primary py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-serif text-2xl font-bold text-primary-foreground">Hapyjo</p>
            <p className="mt-2 text-sm text-primary-foreground/50">
              Site operations, fleet management &amp; financial control.
            </p>
          </div>
          <div className="flex gap-8">
            {footerLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-primary-foreground/60 transition-colors hover:text-accent"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} HapyJo Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
