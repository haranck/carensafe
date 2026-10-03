import { useId } from "react";
import { useGetProducts } from "../../hooks/Products/ProductHooks";
import ProductCard from "../Products/ProductCard";
import ProductCardSkeleton from "../Products/ProductCardSkeleton";
import ProductCarousel from "./ProductCarousel";
import SectionHeading from "./SectionHeading";
import SectionError from "./SectionError";
import Reveal from "./Reveal";
import { CONTAINER } from "../../constants/customerTheme";

const SKELETON_COUNT = { carousel: 6, compact: 3, feature: 1 };

const gridClass = (layout, count) => {
  if (layout === "compact") return "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  return count > 1 ? "grid gap-5 lg:grid-cols-2" : "grid gap-5";
};

/**
 * Home product rail. Fetches its own small slice and hides itself when there's nothing to show.
 * layout: "carousel" (grid cards in a snap row), "compact" (row cards) or "feature" (wide cards).
 */
const ProductSection = ({ heading, params, layout = "carousel", action, className = "" }) => {
  const headingId = useId();
  const { data, isLoading, isError, isFetching, refetch } = useGetProducts(params);
  const items = data?.data || [];

  if (!isLoading && !isError && items.length === 0) return null;

  const cardLayout = layout === "carousel" ? "grid" : layout;
  const skeletons = Array.from({ length: SKELETON_COUNT[layout] }, (_, i) => (
    <ProductCardSkeleton key={i} layout={cardLayout} />
  ));
  const cards = items.map((item) => <ProductCard key={item._id} item={item} layout={cardLayout} />);

  let content;
  if (isError) {
    content = <SectionError onRetry={refetch} isRetrying={isFetching} />;
  } else if (layout === "carousel") {
    content = <ProductCarousel label={`${heading.before} ${heading.accent}`}>{isLoading ? skeletons : cards}</ProductCarousel>;
  } else {
    content = (
      <div className={gridClass(layout, isLoading ? skeletons.length : items.length)}>{isLoading ? skeletons : cards}</div>
    );
  }

  return (
    <Reveal aria-labelledby={headingId} aria-busy={isLoading} className={className}>
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading id={headingId} {...heading} action={action} />
        {content}
      </div>
    </Reveal>
  );
};

export default ProductSection;
