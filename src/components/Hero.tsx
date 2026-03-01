import { useRef, useEffect, useState } from "react";
import { FLEET_STATS } from "@/lib/constants";

const CLOUDINARY_VIDEO =
  "https://res.cloudinary.com/dfxce3jm2/video/upload/v1772351081/Hapyjohero_background_video_rfdhvu.mp4";
const localVideo = new URL("../assets/hapyjo/Hapyjohero background video.mp4", import.meta.url).href;
const fallbackImage = new URL("../assets/hapyjo/4.jpeg", import.meta.url).href;

const overlayStats = [
  { value: FLEET_STATS.totalFleet, label: "Fleet Units" },
  { value: "On-Time", label: "Deployment" },
  { value: "Certified", label: "Operators" },
  { value: "Full", label: "Site Logistics Support" },
];

type VideoSource = "cloudinary" | "local" | "image";

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<VideoSource>("cloudinary");

  const videoSrc = source === "cloudinary" ? CLOUDINARY_VIDEO : source === "local" ? localVideo : null;

  const handleVideoError = () => {
    setSource((prev) => (prev === "cloudinary" ? "local" : "image"));
  };

  useEffect(() => {
    if (source === "image") return;
    const video = videoRef.current;
    if (!video) return;
    const play = () => {
      video.play().catch(() => {});
    };
    play();
    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    return () => {
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
    };
  }, [source]);

  return (
    <header className="relative min-h-[90vh] overflow-hidden bg-[hsl(var(--navy))]">
      {/* Background: video (Cloudinary → local) or fallback image */}
      {source === "image" ? (
        <img
          src={fallbackImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      ) : (
        <video
          ref={videoRef}
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={handleVideoError}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-[hsl(var(--navy))]/75" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-[1200px] flex-col px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:px-8 lg:py-20">
        {/* Left: Operational headline */}
        <div className="flex flex-1 flex-col justify-center lg:pr-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-equipment-yellow sm:mb-4">
            HAPYJO LTD
          </p>
          <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl lg:text-[2.75rem]">
            Site &amp; Fleet Control
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg">
            Integrated construction support, heavy equipment rentals, and operational site services for infrastructure contractors across the region.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <a href="/contact" className="btn-cta-on-dark inline-flex justify-center">
              Request Equipment Deployment
            </a>
            <a href="/services" className="btn-cta-secondary inline-flex justify-center">
              Schedule Site Support
            </a>
          </div>
        </div>

        {/* Right: Overlay stats card */}
        <div className="mt-8 flex flex-1 items-center justify-center lg:mt-0 lg:pl-8">
          <div className="w-full max-w-xl rounded-xl border border-stone-dark bg-white p-4 shadow-xl sm:p-6 lg:p-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {overlayStats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-heading text-xl font-bold text-navy sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-steel">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
