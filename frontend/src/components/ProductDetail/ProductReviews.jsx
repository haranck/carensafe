import { useId } from "react";
import { MessageSquareHeart, PenLine } from "lucide-react";
import Reveal from "../Home/Reveal";
import SectionHeading from "../Home/SectionHeading";
import RatingStars from "./RatingStars";
import { CONTAINER } from "../../constants/customerTheme";
import { DUMMY_RATING_SUMMARY, DUMMY_REVIEWS } from "../../constants/dummyReviews";

const STAR_LEVELS = [5, 4, 3, 2, 1];

// Bar fill in 5% steps (full class names so Tailwind generates them)
const BAR_WIDTHS = [
  "w-0", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-[25%]", "w-[30%]", "w-[35%]", "w-[40%]", "w-[45%]", "w-[50%]",
  "w-[55%]", "w-[60%]", "w-[65%]", "w-[70%]", "w-[75%]", "w-[80%]", "w-[85%]", "w-[90%]", "w-[95%]", "w-full",
];

const barWidth = (count, total) => {
  if (!total || !count) return BAR_WIDTHS[0];
  return BAR_WIDTHS[Math.max(1, Math.round((count / total) * 20))];
};

// TODO: swap the dummy summary/reviews for the reviews API; "Write a Review" becomes the feedback form
const ProductReviews = ({ summary = DUMMY_RATING_SUMMARY, reviews = DUMMY_REVIEWS }) => {
  const headingId = useId();
  const { average, total, breakdown } = summary;

  return (
    <Reveal
      id="reviews"
      aria-labelledby={headingId}
      className="scroll-mt-28 bg-gradient-to-br from-[#fff5fa] via-[#fdf7fd] to-[#f3eeff]"
    >
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading id={headingId} eyebrow="Customer Voice" before="Ratings &" accent="Reviews" />

        <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-5 rounded-2xl border border-pink-100 bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex-shrink-0 text-center sm:w-32">
              <p className="text-[48px] font-extrabold leading-none text-[#1e1a3a]">{average.toFixed(1)}</p>
              <RatingStars rating={average} size={15} className="mt-2 justify-center" />
              <p className="mt-1.5 text-[12px] font-medium text-slate-500">Based on {total} ratings</p>
              <p className="sr-only">Rated {average} out of 5</p>
            </div>

            <ul className="flex-1 space-y-2" aria-label="Rating breakdown">
              {STAR_LEVELS.map((level) => (
                <li key={level} className="flex items-center gap-3 text-[12.5px] font-semibold text-slate-500">
                  <span className="w-12 flex-shrink-0">{level} star</span>
                  <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className={`block h-full rounded-full bg-amber-400 ${barWidth(breakdown[level], total)}`} />
                  </span>
                  <span className="w-7 text-right">{breakdown[level] || 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-2xl border border-pink-100 bg-white p-6">
            <MessageSquareHeart size={28} aria-hidden="true" className="text-pink-200" />
            <p className="mt-3 flex-1 font-accent text-[19px] font-medium italic leading-snug text-[#1e1a3a]">
              Tried this pack? Your feedback helps other women choose with confidence.
            </p>
            <button
              type="button"
              disabled
              className="mt-5 inline-flex h-11 w-fit cursor-not-allowed items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 text-[13.5px] font-bold text-slate-400"
            >
              <PenLine size={16} aria-hidden="true" />
              Write a Review
              <span className="rounded-full bg-[#d6008a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Soon
              </span>
            </button>
          </div>
        </div>

        <ul className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map(({ id, name, rating, date, title, text }) => (
            <li key={id} className="flex flex-col rounded-2xl border border-pink-100 bg-white p-6">
              <RatingStars rating={rating} size={15} />
              <p className="sr-only">Rated {rating} out of 5</p>
              <h3 className="mt-3 text-[15px] font-bold text-[#1e1a3a]">{title}</h3>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-slate-600">{text}</p>
              <div className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3b2a8a] to-[#d6008a] text-[14px] font-bold text-white"
                >
                  {name[0]}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#d6008a]">{name}</p>
                  <p className="text-[11.5px] text-slate-400">{date}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
};

export default ProductReviews;
