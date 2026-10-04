import { useId } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import SectionHeading, { ViewAllLink } from "./SectionHeading";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER } from "../../constants/customerTheme";

// "Feel Confident Every Day" campaign banner (public/banners/, WebP made from "CareN Safe Confidence Bloom.png").
// The benefits are part of the artwork, so the alt text repeats them for screen readers.
const BANNER_SRC_SET = [800, 1280, 2100].map((width) => `/banners/confidence-bloom-${width}.webp ${width}w`).join(", ");
const BANNER_ALT =
  "Two smiling women with a Care N Safe sanitary napkin pack. Feel confident every day: leak protection, soft and comfortable, skin friendly, high absorbency.";

const BloomBanner = () => {
  const headingId = useId();

  return (
    <Reveal aria-labelledby={headingId} className={`${CONTAINER} py-12 md:py-16`}>
      <SectionHeading
        id={headingId}
        eyebrow="Confidence Bloom"
        before="Feel"
        accent="confident"
        after="every day"
        description="Soft, skin-friendly protection that keeps up with you, from morning plans to late nights."
        action={<ViewAllLink label="Shop the range" />}
      />
      <Link
        to={FRONTEND_ROUTES.SHOP}
        aria-label="Shop Care N Safe sanitary napkins"
        className="group block overflow-hidden rounded-[1.25rem] border border-pink-100 bg-white shadow-[0_18px_44px_-24px_rgba(59,42,138,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6008a]/30 sm:rounded-[1.75rem]"
      >
        <img
          src="/banners/confidence-bloom-1280.webp"
          srcSet={BANNER_SRC_SET}
          sizes="(min-width: 1600px) 1536px, calc(100vw - 32px)"
          width={2100}
          height={747}
          alt={BANNER_ALT}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </Link>
    </Reveal>
  );
};

export default BloomBanner;
