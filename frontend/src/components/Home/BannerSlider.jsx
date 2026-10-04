import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "./Reveal";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

const INTERVAL_MS = 5000;

// Campaign banners (public/banners/, WebP made from the original PNGs). Their text is in the artwork, so alt repeats it.
const SLIDES = [
  {
    key: "confidence-bloom",
    src: "confidence-bloom",
    alt: "Two smiling women with a Care N Safe pack. Feel confident every day: leak protection, soft and comfortable, skin friendly, high absorbency.",
  },
  {
    key: "bold-fase",
    src: "bold-fase",
    alt: "Woman holding a Care N Safe pack. Confidence in every step: ultra soft comfort, superior absorbency, leakage protection, skin friendly.",
  },
];

// Full class strings per position (never built dynamically)
const TRACK_POSITIONS = ["translate-x-0", "-translate-x-full", "-translate-x-[200%]", "-translate-x-[300%]"];

const srcSet = (name) => [800, 1280, 2100].map((width) => `/banners/${name}-${width}.webp ${width}w`).join(", ");

/**
 * Big banner slider: slides right-to-left every 5 seconds (paused while hovered / focused, hidden tab or reduced
 * motion), with arrows, dots and swipe. Each banner links to the shop.
 */
const BannerSlider = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pointerStartRef = useRef(null);
  const count = SLIDES.length;

  const goTo = useCallback((next) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isPaused || reduceMotion || count < 2) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, count]);

  const onPointerDown = (event) => {
    pointerStartRef.current = event.clientX;
  };
  const onPointerUp = (event) => {
    if (pointerStartRef.current === null) return;
    const delta = event.clientX - pointerStartRef.current;
    pointerStartRef.current = null;
    if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
  };

  return (
    <Reveal aria-roledescription="carousel" aria-label="Care N Safe offers" className={`${CONTAINER} py-8 md:py-12`}>
      <div
        className="group relative overflow-hidden rounded-[1.25rem] border border-pink-100 bg-white shadow-[0_18px_44px_-24px_rgba(59,42,138,0.45)] sm:rounded-[2rem]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className={`flex transition-transform duration-700 ease-out motion-reduce:transition-none ${TRACK_POSITIONS[index]}`}>
          {SLIDES.map((slide, slideIndex) => (
            <Link
              key={slide.key}
              to={FRONTEND_ROUTES.SHOP}
              aria-label={`Slide ${slideIndex + 1} of ${count}: shop Care N Safe`}
              aria-hidden={slideIndex !== index}
              tabIndex={slideIndex === index ? 0 : -1}
              draggable={false}
              className="block w-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#d6008a]/30"
            >
              <img
                src={`/banners/${slide.src}-1280.webp`}
                srcSet={srcSet(slide.src)}
                sizes="(min-width: 1600px) 1536px, calc(100vw - 32px)"
                alt={slide.alt}
                width={2100}
                height={790}
                loading={slideIndex === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="block aspect-[53/20] h-auto w-full select-none object-cover"
              />
            </Link>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous banner"
              className={`absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1e1a3a] shadow-md transition-opacity hover:bg-white sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${FOCUS_RING}`}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next banner"
              className={`absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1e1a3a] shadow-md transition-opacity hover:bg-white sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${FOCUS_RING}`}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1 sm:bottom-4">
              {SLIDES.map((slide, slideIndex) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => goTo(slideIndex)}
                  aria-label={`Show banner ${slideIndex + 1}`}
                  aria-current={slideIndex === index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${FOCUS_RING}`}
                >
                  <span className={`block h-2 rounded-full transition-all ${slideIndex === index ? "w-6 bg-[#d6008a]" : "w-2 bg-white/90 shadow"}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Reveal>
  );
};

export default BannerSlider;
