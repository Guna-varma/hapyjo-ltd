import { useState, useEffect, useRef } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { MAP_LOCATION } from "@/lib/constants";
import { useFadeInOnScroll } from "@/hooks/use-fade-in";

/**
 * Our Location section: interactive map (iframe) + address card.
 * Map is lazy-loaded when section enters viewport for performance.
 * No API key required (embed URL).
 */
export function LocationMap() {
  const { ref, isVisible } = useFadeInOnScroll();
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    setShouldLoadMap(true);
  }, [isVisible]);

  return (
    <section
      id="location"
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-stone/80 py-16 sm:py-20 lg:py-24 ${isVisible ? "animate-fade-in opacity-100" : "opacity-0"}`}
      aria-labelledby="location-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Find Us
          </p>
          <h2 id="location-heading" className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Our Location
          </h2>
          <div className="divider-industrial mx-auto mt-4" />
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Visit our operational base at SIBLINGS BUUM HOTEL. We coordinate site support, fleet deployment, and equipment rentals from this location in Bugesera.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Map container: lazy-loaded iframe */}
          <div
            ref={mapContainerRef}
            className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-muted shadow-soft-xl transition-all duration-300"
          >
            <div className="h-[400px] w-full sm:h-[450px]">
              {shouldLoadMap ? (
                <iframe
                  title="Our location – SIBLINGS BUUM HOTEL on Google Maps"
                  src={MAP_LOCATION.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground"
                  aria-hidden
                >
                  <span className="text-sm font-medium">Loading map…</span>
                </div>
              )}
            </div>
          </div>

          {/* Address & directions card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 sm:p-8 shadow-soft-lg transition-all duration-300 hover:shadow-soft-xl">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-navy/10 p-2.5">
                  <MapPin className="h-5 w-5 text-navy" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {MAP_LOCATION.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {MAP_LOCATION.address}
                  </p>
                </div>
              </div>
              <a
                href={MAP_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:bg-navy-light"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Get Directions
              </a>
            </div>
            <p className="text-xs text-muted-foreground text-center lg:text-left">
              Opens Google Maps in a new tab for navigation and directions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
