import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin } from "lucide-react";

const Contact = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  return (
    <section
      id="contact"
      ref={ref as React.RefObject<HTMLElement>}
      className={`fade-in-section ${isVisible ? "is-visible" : ""} py-24 sm:py-32`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Get in Touch
          </p>
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Let's Work Together
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-accent" />
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          {/* Info */}
          <div>
            <h3 className="font-serif text-2xl font-semibold text-foreground">HapyJo Ltd</h3>
            <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
              Ready to bring clarity and control to your operations? 
              Reach out and let us discuss how Hapyjo can support your next project.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={18} className="text-accent" />
                <span>info@hapyjo.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin size={18} className="text-accent" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 rounded-lg border border-border bg-card p-8"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@company.com" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Tell us about your project or enquiry..." rows={5} className="bg-background" />
            </div>
            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-5 text-base font-semibold"
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
