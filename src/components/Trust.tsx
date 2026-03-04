import { useFadeInOnScroll } from "@/hooks/use-fade-in";
import { getHapyjoImage } from "@/lib/hapyjo-images";
import { PROJECT_PROOF_CLUSTERS } from "@/lib/image-allocation";

const clusterLabels: Record<keyof typeof PROJECT_PROOF_CLUSTERS, string> = {
  activeExcavation: "Active excavation site",
  roadConstructionFleet: "Road construction fleet",
  materialLoading: "Material loading operation",
  workforceTransport: "Workforce transport",
};

const Trust = () => {
  const { ref, isVisible } = useFadeInOnScroll();

  const clusters = Object.entries(PROJECT_PROOF_CLUSTERS) as [
    keyof typeof PROJECT_PROOF_CLUSTERS,
    readonly number[],
  ][];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`bg-stone py-16 sm:py-20 lg:py-24 ${isVisible ? "opacity-100" : ""}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-equipment-yellow">
            Project Proof
          </p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl md:text-4xl">
            Fleet &amp; Operations in Action
          </h2>
          <div className="divider-industrial mx-auto mt-4" />
        </div>

        <div className="space-y-10 sm:space-y-16">
          {clusters.map(([key, indices]) => (
            <div key={key}>
              <h3 className="mb-4 font-heading text-base font-semibold uppercase tracking-wider text-navy sm:mb-6 sm:text-lg">
                {clusterLabels[key]}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {indices.slice(0, 6).map((idx) => {
                  const img = getHapyjoImage(idx);
                  if (!img) return null;
                  return (
                    <div
                      key={idx}
                      className="responsive-image-container overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:shadow-soft-lg"
                    >
                      <img
                        src={img}
                        alt={`${clusterLabels[key]} – HapyJo`}
                        className="image-industrial"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Trust;
