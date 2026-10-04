import { useId } from "react";
import { useGetSimilarProducts } from "../../hooks/Products/ProductHooks";
import ProductCard from "../Products/ProductCard";
import ProductCardSkeleton from "../Products/ProductCardSkeleton";
import ProductCarousel from "../Home/ProductCarousel";
import SectionHeading from "../Home/SectionHeading";
import SectionError from "../Home/SectionError";
import Reveal from "../Home/Reveal";
import { CONTAINER } from "../../constants/customerTheme";

const SKELETON_COUNT = 5;

// "You May Also Like" rail; hides itself when the API has nothing to suggest
const SimilarProducts = ({ productId }) => {
  const headingId = useId();
  const { data, isLoading, isError, isFetching, refetch } = useGetSimilarProducts(productId);
  const items = data?.data || [];

  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <Reveal aria-labelledby={headingId} aria-busy={isLoading}>
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading
          id={headingId}
          eyebrow="More to Explore"
          before="You May Also"
          accent="Like"
          description="Other packs women pick alongside this one."
        />
        {isError ? (
          <SectionError message="We couldn't load similar products." onRetry={refetch} isRetrying={isFetching} />
        ) : (
          <ProductCarousel label="Similar products">
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)
              : items.map((item) => <ProductCard key={`${item._id}-${item.defaultVariant._id}`} item={item} />)}
          </ProductCarousel>
        )}
      </div>
    </Reveal>
  );
};

export default SimilarProducts;
