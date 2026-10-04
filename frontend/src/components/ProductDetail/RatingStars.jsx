import { Star, StarHalf } from "lucide-react";

const FILLED = "fill-amber-400 text-amber-400";
const EMPTY = "fill-slate-200 text-slate-200";

// Five stars rounded to the nearest half. Decorative: callers provide the readable rating text.
const RatingStars = ({ rating, size = 16, className = "" }) => {
  const halves = Math.round(rating * 2);

  return (
    <span aria-hidden="true" className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = halves - i * 2;
        if (fill >= 2) return <Star key={i} size={size} className={FILLED} />;
        if (fill === 1) {
          return (
            <span key={i} className="relative inline-flex">
              <Star size={size} className={EMPTY} />
              <StarHalf size={size} className={`absolute inset-0 ${FILLED}`} />
            </span>
          );
        }
        return <Star key={i} size={size} className={EMPTY} />;
      })}
    </span>
  );
};

export default RatingStars;
