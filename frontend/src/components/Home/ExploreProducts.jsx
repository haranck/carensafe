import { useId, useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { useGetProducts } from "../../hooks/Products/ProductHooks";
import ProductCard from "../Products/ProductCard";
import ProductCardSkeleton from "../Products/ProductCardSkeleton";
import SectionHeading, { ViewAllLink } from "./SectionHeading";
import SectionError from "./SectionError";
import Reveal from "./Reveal";
import { BRAND_GRADIENT, CONTAINER, CONTAINER_BLEED, FOCUS_RING } from "../../constants/customerTheme";

// Same choices as the shop's quick chips (API `category` / `combo` filters)
const CATEGORY_TABS = [
  { value: "", label: "All", params: {} },
  { value: "sanitary_pads", label: "Sanitary Pads", params: { category: "sanitary_pads" } },
  { value: "combo_packs", label: "Combo Packs", params: { combo: true } },
];

const PAGE_SIZE = 10;
const MAX_LIMIT = 48; // API caps limit at 48

const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

const ExploreProducts = () => {
  const headingId = useId();
  const [category, setCategory] = useState("");
  const [pages, setPages] = useState(1);
  const limit = Math.min(PAGE_SIZE * pages, MAX_LIMIT);

  const tabParams = CATEGORY_TABS.find((tab) => tab.value === category).params;
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useGetProducts({
    ...tabParams,
    limit,
    sort: "newest",
  });

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const hasMore = items.length < total && limit < MAX_LIMIT;
  const isLoadingMore = isFetching && isPlaceholderData;

  const selectCategory = (value) => {
    setCategory(value);
    setPages(1);
  };

  let content;
  if (isLoading) {
    content = (
      <div className={GRID}>
        {Array.from({ length: 5 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = <SectionError onRetry={refetch} isRetrying={isFetching} />;
  } else if (items.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
        <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
          <PackageSearch size={26} aria-hidden="true" />
        </span>
        <p className="text-[16px] font-bold text-[#1e1a3a]">No products here yet</p>
        <p className="max-w-[340px] text-[13.5px] text-slate-500">New packs are on their way. Check back soon or browse the full range.</p>
        {category && (
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={`mt-3 inline-flex h-10 items-center rounded-full border border-pink-200 px-5 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] transition-colors ${FOCUS_RING}`}
          >
            Show all products
          </button>
        )}
      </div>
    );
  } else {
    content = (
      <>
        <div className={`${GRID} transition-opacity duration-200 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {items.map((item) => (
            <ProductCard key={`${item._id}-${item.defaultVariant._id}`} item={item} />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[12.5px] font-medium text-slate-400">
            Showing {items.length} of {total} products
          </p>
          {hasMore && (
            <button
              type="button"
              onClick={() => setPages((p) => p + 1)}
              disabled={isLoadingMore}
              className={`inline-flex h-11 items-center gap-2 rounded-full border border-pink-200 bg-white px-7 text-[14px] font-bold text-[#d6008a] hover:bg-[#fff5fa] disabled:opacity-60 transition-colors ${FOCUS_RING}`}
            >
              {isLoadingMore && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
              {isLoadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <Reveal aria-labelledby={headingId} className="border-y border-violet-100/70 bg-white">
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading
          id={headingId}
          eyebrow="Our Collection"
          before="Explore Our"
          accent="Products"
          description="Thoughtfully made organic protection for every day of your cycle."
          action={<ViewAllLink />}
        />

        <div
          role="group"
          aria-label="Filter products by category"
          className={`${CONTAINER_BLEED} mb-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {CATEGORY_TABS.map(({ value, label }) => {
            const isActive = category === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => selectCategory(value)}
                aria-pressed={isActive}
                className={`inline-flex h-10 flex-shrink-0 items-center rounded-full px-5 text-[13px] font-semibold whitespace-nowrap transition-all ${FOCUS_RING} ${
                  isActive
                    ? `${BRAND_GRADIENT} text-white shadow-[0_4px_14px_rgba(124,58,237,0.25)]`
                    : "border border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:text-[#d6008a]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {content}
      </div>
    </Reveal>
  );
};

export default ExploreProducts;
