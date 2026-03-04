import { Mail, Phone, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export function ContactCTA() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 mt-12">
      <h3 className="font-heading text-xl font-bold text-foreground">
        Request Equipment Deployment
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Contact HapyJo Ltd for fleet and site support.
      </p>
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Phone size={18} className="text-steel shrink-0" />
          <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="text-foreground hover:underline">
            {COMPANY.phone}
          </a>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Mail size={18} className="text-steel shrink-0" />
          <a href={`mailto:${COMPANY.email}`} className="text-foreground hover:underline">
            {COMPANY.email}
          </a>
        </div>
        <div className="flex items-start gap-3 text-muted-foreground">
          <MapPin size={18} className="text-steel shrink-0 mt-0.5" />
          <span>
            {COMPANY.address.country}<br />
            {COMPANY.address.province}<br />
            {COMPANY.address.district}<br />
            {COMPANY.address.sector}<br />
            {COMPANY.address.location}
          </span>
        </div>
      </div>
      <div className="mt-8">
        <a href="/contact#contact" className="btn-cta w-full justify-center sm:w-auto">
          Contact Us
        </a>
      </div>
    </div>
  );
}
