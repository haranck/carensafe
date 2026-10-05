import { useId } from "react";
import { useCartRecommendations } from "../../hooks/Cart/CartHooks";
import ProductCard from "../Products/ProductCard";
import ProductCardSkeleton from "../Products/ProductCardSkeleton";
import ProductCarousel from "../Home/ProductCarousel";
import SectionHeading from "../Home/SectionHeading";
import SectionError from "../Home/SectionError";
import Reveal from "../Home/Reveal";
import { CONTAINER } from "../../constants/customerTheme";

const SKELETON_COUNT = 5;

// "You May Also Like" under the cart; hides itself when there's nothing to suggest. Add to Cart / Buy Now on these
// cards update the cart and summary straight away (the cart queries are invalidated).
const CartRecommendations = ({ hasItems }) => {
  const headingId = useId();
  const { data, isLoading, isError, isFetching, refetch } = useCartRecommendations();
  const items = data?.data || [];

  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <Reveal aria-labelledby={headingId} aria-busy={isLoading}>
      <div className={`${CONTAINER} pb-16`}>
        <div className="mx-auto max-w-[1240px]">
          <SectionHeading
            id={headingId}
            eyebrow={hasItems ? "Pairs Well With" : "Popular Picks"}
            before="You May Also"
            accent="Like"
            description={hasItems ? "Other sizes and packs that go with your cart." : "Our newest packs, to get you started."}
          />
          {isError ? (
            <SectionError message="We couldn't load suggestions." onRetry={refetch} isRetrying={isFetching} />
          ) : (
            <ProductCarousel label="Recommended products">
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)
                : items.map((item) => <ProductCard key={`${item._id}-${item.defaultVariant._id}`} item={item} />)}
            </ProductCarousel>
          )}
        </div>
      </div>
    </Reveal>
  );
};

export default CartRecommendations;
