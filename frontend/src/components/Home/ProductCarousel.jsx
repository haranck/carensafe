import { Children, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CONTAINER_BLEED, FOCUS_RING } from "../../constants/customerTheme";

const NAV_BUTTON = `absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-pink-100 bg-white text-[#1e1a3a] shadow-[0_6px_18px_rgba(59,42,138,0.12)] hover:text-[#d6008a] disabled:pointer-events-none disabled:opacity-0 transition-all md:inline-flex ${FOCUS_RING}`;

// Horizontal snap-scroll row: swipe on touch, prev/next buttons from md up (shown only when it overflows)
const ProductCarousel = ({ label, children }) => {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateEdges = () => {
      const atStart = track.scrollLeft <= 4;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
    };

    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    track.addEventListener("scroll", updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", updateEdges);
    };
  }, []);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={edges.atStart}
        aria-label="Previous products"
        className={`${NAV_BUTTON} -left-5`}
      >
        <ChevronLeft size={20} />
      </button>

      <ul
        ref={trackRef}
        aria-label={label}
        className={`${CONTAINER_BLEED} flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {Children.map(children, (child) => (
          <li className="w-[78%] flex-shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[calc((100%-48px)/4)] xl:w-[calc((100%-64px)/5)] 2xl:w-[calc((100%-80px)/6)]">
            {child}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={edges.atEnd}
        aria-label="Next products"
        className={`${NAV_BUTTON} -right-5`}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default ProductCarousel;
