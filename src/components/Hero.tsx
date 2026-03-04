import { useRef, useEffect, useState, useCallback } from "react";
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
  const userInteractedRef = useRef(false);

  const videoSrc = source === "cloudinary" ? CLOUDINARY_VIDEO : source === "local" ? localVideo : null;

  const handleVideoError = () => {
    setSource((prev) => (prev === "cloudinary" ? "local" : "image"));
  };

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || source === "image") return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("webkit-playsinline", "true");
    video.play().catch(() => {});
  }, [source]);

  useEffect(() => {
    if (source === "image") return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("webkit-playsinline", "true");
    const play = () => tryPlay();
    play();
    video.addEventListener("loadeddata", play);
    video.addEventListener("canplay", play);
    video.addEventListener("canplaythrough", play);
    video.addEventListener("loadedmetadata", play);
    return () => {
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
      video.removeEventListener("canplaythrough", play);
      video.removeEventListener("loadedmetadata", play);
    };
  }, [source, tryPlay]);

  useEffect(() => {
    const onInteraction = () => {
      if (userInteractedRef.current) return;
      userInteractedRef.current = true;
      tryPlay();
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("keydown", onInteraction);
    };
    document.addEventListener("click", onInteraction, { once: true, passive: true });
    document.addEventListener("touchstart", onInteraction, { once: true, passive: true });
    document.addEventListener("keydown", onInteraction, { once: true });
    return () => {
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("keydown", onInteraction);
    };
  }, [tryPlay]);

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
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={handleVideoError}
          onLoadedData={tryPlay}
          onCanPlay={tryPlay}
          onCanPlayThrough={tryPlay}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        >
          <source src={videoSrc ?? ""} type="video/mp4" />
        </video>
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
            <a href="/contact#contact" className="btn-cta-on-dark inline-flex justify-center">
              Request Equipment Deployment
            </a>
            <a href="/services" className="btn-cta-secondary inline-flex justify-center">
              Schedule Site Support
            </a>
          </div>
        </div>

        {/* Right: Overlay stats card – 2x2 grid only to prevent overlap on desktop */}
        <div className="mt-6 flex min-w-0 flex-1 items-center justify-center sm:mt-8 lg:mt-0 lg:pl-8">
          <div className="w-full min-w-0 max-w-xl rounded-2xl border border-white/20 bg-white/95 p-4 shadow-soft-xl backdrop-blur-sm sm:p-6 md:p-8 lg:max-w-md lg:p-10">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-5 md:gap-x-10 md:gap-y-6">
              {overlayStats.map((s) => (
                <div key={s.label} className="min-w-[6rem] text-center sm:min-w-[7rem]">
                  <p className="font-heading text-lg font-bold text-navy sm:text-2xl md:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wider text-steel sm:mt-2 sm:text-xs">
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
