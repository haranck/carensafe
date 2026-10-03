import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { ChevronRight, PackageSearch } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import ProductCard from "../../components/Products/ProductCard";
import ProductCardSkeleton from "../../components/Products/ProductCardSkeleton";
import SectionError from "../../components/Home/SectionError";
import ShopToolbar from "../../components/Shop/ShopToolbar";
import CategoryChips from "../../components/Shop/CategoryChips";
import FilterPanel from "../../components/Shop/FilterPanel";
import FilterDrawer from "../../components/Shop/FilterDrawer";
import ActiveFilters from "../../components/Shop/ActiveFilters";
import ShopPagination from "../../components/Shop/ShopPagination";
import { useGetProductFilters, useGetProducts, usePrefetchProducts } from "../../hooks/Products/ProductHooks";
import { useShopParams } from "../../hooks/Shop/ShopHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { CATEGORY_LABELS } from "../../utils/product";

const SKELETON_COUNT = 8;
// 2 per row on phones, 3 on tablets / small laptops (next to the sidebar from lg), 4 from xl
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";

const ShopBreadcrumb = () => {
  const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
        <li className="flex items-center gap-1.5">
          <Link
            to={isLoggedIn ? FRONTEND_ROUTES.HOME : FRONTEND_ROUTES.LANDING}
            className={`inline-flex min-h-10 items-center rounded-md hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
          >
            Home
          </Link>
          <ChevronRight size={14} aria-hidden="true" className="text-slate-300" />
        </li>
        <li aria-current="page" className="font-semibold text-[#1e1a3a]">
          Shop
        </li>
      </ol>
    </nav>
  );
};

const EmptyState = ({ onClear }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
    <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
      <PackageSearch size={26} aria-hidden="true" />
    </span>
    <p className="text-[16px] font-bold text-[#1e1a3a]">No products match your filters</p>
    <p className="max-w-[340px] text-[13.5px] text-slate-500">Try another size or price range, or clear the filters to see everything.</p>
    <button
      type="button"
      onClick={onClear}
      className={`mt-3 inline-flex h-10 items-center rounded-full border border-pink-200 bg-white px-5 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] transition-colors ${FOCUS_RING}`}
    >
      Clear filters
    </button>
  </div>
);

const ShopPage = () => {
  const headingId = useId();
  const gridTopRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { filters, apiParams, updateFilters, clearFilters } = useShopParams();
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useGetProducts(apiParams);
  const filtersQuery = useGetProductFilters();
  const prefetchProducts = usePrefetchProducts();

  const filterOptions = filtersQuery.data?.data;
  const items = data?.data || [];
  const pagination = data?.pagination;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  const categoryLabels = {
    ...CATEGORY_LABELS,
    ...Object.fromEntries((filterOptions?.categories || []).map(({ value, label }) => [value, label])),
  };
  const drawerFilterCount =
    filters.sizes.length + (filters.minPrice || filters.maxPrice ? 1 : 0) + (filters.combo ? 1 : 0) + (filters.inStock ? 1 : 0);

  // Open at the top (the previous page may have been scrolled); before paint so there's no jump
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Shop All Products | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Next page in the background so paging feels instant
  useEffect(() => {
    if (!isPlaceholderData && filters.page < totalPages) {
      prefetchProducts({ ...apiParams, page: filters.page + 1 });
    }
  }, [apiParams, filters.page, totalPages, isPlaceholderData, prefetchProducts]);

  // A stale link past the last page (e.g. ?page=9 after the catalogue shrank) → last page
  useEffect(() => {
    if (!isPlaceholderData && totalPages > 0 && filters.page > totalPages) {
      updateFilters({ page: totalPages }, { replace: true });
    }
  }, [filters.page, totalPages, isPlaceholderData, updateFilters]);

  const handleSearch = useCallback((term) => updateFilters({ search: term }, { replace: true }), [updateFilters]);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handlePageChange = (page) => {
    updateFilters({ page });
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let resultText = "Loading products…";
  if (pagination && total > 0) {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, total);
    resultText = `Showing ${start}–${end} of ${total} ${total === 1 ? "product" : "products"}`;
  } else if (pagination) {
    resultText = "No products found";
  }

  let content;
  if (isLoading) {
    content = (
      <div className={GRID} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = <SectionError onRetry={refetch} isRetrying={isFetching} />;
  } else if (items.length === 0) {
    content = <EmptyState onClear={clearFilters} />;
  } else {
    content = (
      <>
        <ul className={`${GRID} transition-opacity duration-200 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {items.map((item) => (
            <li key={item._id}>
              <ProductCard item={item} />
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ShopPagination page={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <section aria-labelledby={headingId} className={`${CONTAINER} pt-6 pb-16`}>
              <ShopBreadcrumb />

              <div className="mt-2 max-w-[640px]">
                <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
                  Our Collection
                </span>
                <h1
                  id={headingId}
                  className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[40px]"
                >
                  Shop <span className="font-accent font-medium italic text-[#d6008a]">All Products</span>
                </h1>
                <p className="mt-2 text-[14.5px] leading-relaxed text-slate-500">
                  Organic cotton pads and value combo packs, filtered your way.
                </p>
              </div>

              <div className="mt-8 flex gap-6 xl:gap-8">
                <aside aria-label="Product filters" className="sticky top-28 hidden w-[240px] flex-shrink-0 self-start lg:block">
                  <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)]">
                    <FilterPanel
                      options={filterOptions}
                      isLoading={filtersQuery.isLoading}
                      value={filters}
                      onChange={updateFilters}
                      onClear={clearFilters}
                    />
                  </div>
                </aside>

                <div className="min-w-0 flex-1 space-y-4">
                  <ShopToolbar
                    search={filters.search}
                    onSearch={handleSearch}
                    sort={filters.sort}
                    onSortChange={(sort) => updateFilters({ sort })}
                    resultText={resultText}
                    isUpdating={isFetching && isPlaceholderData}
                    activeFilterCount={drawerFilterCount}
                    onOpenFilters={() => setIsDrawerOpen(true)}
                  />
                  <CategoryChips
                    options={filterOptions}
                    category={filters.category}
                    combo={filters.combo}
                    onChange={updateFilters}
                  />
                  <ActiveFilters
                    filters={filters}
                    categoryLabels={categoryLabels}
                    onRemove={updateFilters}
                    onClearAll={clearFilters}
                  />
                  <div ref={gridTopRef} className="scroll-mt-28 pt-2">
                    {content}
                  </div>
                </div>
              </div>
            </section>
          </main>

          <AnimatePresence>
            {isDrawerOpen && (
              <FilterDrawer
                key="filters"
                options={filterOptions}
                isLoading={filtersQuery.isLoading}
                filters={filters}
                onApply={updateFilters}
                onClose={closeDrawer}
              />
            )}
          </AnimatePresence>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default ShopPage;
