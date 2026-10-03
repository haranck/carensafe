import { ChevronLeft, ChevronRight } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";

const BUTTON = `inline-flex h-10 min-w-10 items-center justify-center rounded-full text-[13.5px] font-bold transition-colors ${FOCUS_RING}`;
const ARROW = `${BUTTON} border border-slate-200 bg-white text-[#1e1a3a] hover:border-pink-200 hover:text-[#d6008a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-[#1e1a3a]`;

// Up to 7 slots: 1 2 3 4 5 … 10 / 1 … 4 5 6 … 10 / 1 … 6 7 8 9 10
const pageItems = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "end-gap", totalPages];
  if (page >= totalPages - 3) return [1, "start-gap", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  return [1, "start-gap", page - 1, page, page + 1, "end-gap", totalPages];
};

// Customer-theme pagination (the admin one in components/common stays indigo). Page numbers from sm up.
const ShopPagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={ARROW}
      >
        <ChevronLeft size={18} />
      </button>

      <p className="px-2 text-[13px] font-semibold text-slate-500 sm:hidden">
        Page <span className="text-[#1e1a3a]">{page}</span> of {totalPages}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="w-8 text-center text-slate-400">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`${BUTTON} px-2 ${
                  item === page
                    ? "bg-[#d6008a] text-white shadow-[0_4px_14px_rgba(214,0,138,0.28)]"
                    : "text-slate-600 hover:bg-[#fff5fa] hover:text-[#d6008a]"
                }`}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={ARROW}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};

export default ShopPagination;
