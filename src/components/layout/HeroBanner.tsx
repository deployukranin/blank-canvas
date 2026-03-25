import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";

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

  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(next, autoPlayInterval);
    return () => clearInterval(interval);
  }, [next, autoPlayInterval, total]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: 380 }}>
      {/* All slides rendered, opacity toggled for smooth fade */}
      {images.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={src}
            alt={`Banner ${i + 1}`}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>
      ))}

      {/* Text overlay */}
      <div className="absolute bottom-16 left-0 right-0 z-10 px-6 md:px-16">
        <div className="max-w-2xl">
          {greeting && (
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl leading-tight mb-2 transition-all duration-500">
              {greeting}
            </h2>
          )}
          {subtitle && (
            <p className="text-base text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm text-foreground/80 hover:bg-background/50 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm text-foreground/80 hover:bg-background/50 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-1.5 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
