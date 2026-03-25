import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroBannerProps {
  images: string[];
  greeting?: string;
  subtitle?: string;
  autoPlayInterval?: number;
}

export function HeroBanner({
  images,
  greeting,
  subtitle,
  autoPlayInterval = 6000,
}: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [next, autoPlayInterval, total]);

  return (
    <div className="relative w-full h-[55vh] min-h-[300px] overflow-hidden rounded-2xl">
      {/* Slides with fade */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${images[current]}-${current}`}
          src={images[current]}
          alt={`Banner ${current + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          loading={current === 0 ? "eager" : "lazy"}
        />
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent pointer-events-none" />

      {/* Text */}
      <div className="absolute bottom-16 left-6 right-6 z-10 pointer-events-none">
        {greeting && (
          <h2 className="font-display text-xl md:text-2xl font-bold mb-1 text-foreground">
            {greeting}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Navigation buttons */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground/80 hover:bg-background/50 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center text-foreground/80 hover:bg-background/50 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Ir para slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
