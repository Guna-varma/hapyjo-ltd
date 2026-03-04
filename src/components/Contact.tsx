import { useRef, useState, useEffect } from "react";
import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Mail, Phone, MapPin } from "lucide-react";
import { COMPANY } from "@/lib/constants";
import { submitContactForm, type ContactFormData } from "@/lib/contact-form";
import { LocationMap } from "@/components/LocationMap";

const Contact = () => {
  const { ref, isVisible } = useFadeInOnScroll();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // When landing with #contact (e.g. "Request Equipment Deployment"), scroll to form section after mount
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#contact") return;
    const el = document.getElementById("contact");
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data: ContactFormData = {
      fullName: (form.elements.namedItem("fullName") as HTMLInputElement).value.trim(),
      company: (form.elements.namedItem("company") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim(),
    };
    setStatus("sending");
    setErrorMessage("");
    const result = await submitContactForm(data);
    if (result.ok) {
      setStatus("success");
      form.reset();
    } else {
      setStatus("error");
      setErrorMessage(result.error ?? "Something went wrong.");
    }
  };

  return (
    <>
      <LocationMap />
      <section
        id="contact"
        ref={ref as React.RefObject<HTMLElement>}
        className={`bg-background py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Deployment &amp; Support
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Request Project Logistics Plan
          </h2>
          <div className="divider-industrial mx-auto mt-4" />
        </div>

        <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="font-heading text-2xl font-bold text-foreground">{COMPANY.name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-equipment-yellow">
              {COMPANY.tagline}
            </p>
            <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
              Ready to bring control and reliability to your operations?
              Reach out and let us discuss how HapyJo can support your next project.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={18} className="text-steel shrink-0" />
                <a href={`mailto:${COMPANY.email}`} className="font-medium text-foreground hover:underline">
                  {COMPANY.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone size={18} className="text-steel shrink-0" />
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="font-medium text-foreground hover:underline">
                  {COMPANY.phone}
                </a>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin size={18} className="text-steel shrink-0 mt-0.5" />
                <span>
                  {COMPANY.address.country}, {COMPANY.address.province}, {COMPANY.address.district}, {COMPANY.address.sector}, {COMPANY.address.location}
                </span>
              </div>
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/80 p-8 shadow-soft-lg backdrop-blur-sm transition-all duration-300 sm:p-10"
          >
            {status === "success" && (
              <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
                Thanks! Your request has been sent. We&apos;ll get back to you at the email you provided.
              </div>
            )}
            {status === "error" && (
              <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200">
                {errorMessage}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-semibold text-foreground">
                  Company Name
                </label>
                <input
                  id="company"
                  name="company"
                  placeholder="Your company"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+250 ..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  required
                />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <label htmlFor="service" className="text-sm font-semibold text-foreground">
                Service Required
              </label>
              <select
                id="service"
                name="service"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <option value="">Select a service</option>
                <option value="site-support">Construction Site Support</option>
                <option value="fleet">Fleet Logistics Management</option>
                <option value="rentals">Heavy Equipment Rentals</option>
                <option value="transport">Workforce Transport</option>
                <option value="machinery">Machinery Deployment</option>
                <option value="material">Material Handling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mt-5 space-y-2">
              <label htmlFor="message" className="text-sm font-semibold text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <button
              type="submit"
              className="btn-cta mt-6 w-full min-w-0 disabled:opacity-60 disabled:pointer-events-none"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Request Project Logistics Plan"}
            </button>
          </form>
        </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
