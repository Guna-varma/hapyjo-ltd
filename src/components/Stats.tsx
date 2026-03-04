import { FLEET_STATS } from "@/lib/constants";
import { Truck, Cog, Clock, Phone } from "lucide-react";

const items = [
  { value: FLEET_STATS.machines, label: "Machines Available", subtitle: "Heavy equipment ready", icon: Cog },
  { value: FLEET_STATS.trucks, label: "Transport Trucks", subtitle: "Fleet capacity", icon: Truck },
  { value: "24/7", label: "Deployment Ready Today", subtitle: "Same-day support", icon: Clock },
  { value: "24/7", label: "Active Site Support", subtitle: "Operational coverage", icon: Phone },
];

const Stats = () => {
  return (
    <section className="border-y border-stone-dark bg-gradient-to-b from-stone to-stone/95 py-10 sm:py-14" aria-label="Fleet credibility">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
          {items.map(({ value, label, subtitle, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-6 text-center shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:border-stone-dark md:px-6 md:py-8"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy md:h-12 md:w-12">
                <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
              </div>
              <p className="font-heading text-2xl font-bold text-navy sm:text-3xl md:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-navy/90">
                {label}
              </p>
              <p className="mt-0.5 text-[10px] text-steel sm:text-xs">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
