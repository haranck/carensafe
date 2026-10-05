import TrustStrip from "./TrustStrip";
import ProductSection from "./ProductSection";
import ExploreProducts from "./ExploreProducts";
import WhyCareNSafe from "./WhyCareNSafe";
import Testimonials from "./Testimonials";
import CtaBanner from "./CtaBanner";
import BannerSlider from "./BannerSlider";
import AboutTeaser from "./AboutTeaser";
import { ViewAllLink } from "./SectionHeading";
import { shopPath } from "../../constants/frontendRoutes";

/**
 * Everything below the hero, shared by the guest landing page ("/") and the member home ("/home"): the same
 * product sections from the public product API for everyone. Actions on the cards that need an account go
 * through the login gate. Render inside the page's LazyMotion (sections animate in with Reveal).
 */
const HomeSections = () => (
  <>
    <TrustStrip />

    {/* TODO: sort by order count once the orders API exists; newest first until then */}
    <ProductSection
      heading={{
        eyebrow: "Most Loved",
        before: "Our Bestselling",
        accent: "Comfort & Protection",
        description: "The packs women reach for again and again.",
      }}
      params={{ sort: "newest", limit: 8 }}
      layout="carousel"
      action={<ViewAllLink />}
    />

    <BannerSlider />

    <ProductSection
      heading={{
        eyebrow: "Fast Moving",
        before: "Quick",
        accent: "Buy",
        description: "Everyday essentials, one tap away.",
      }}
      params={{ combo: false, sort: "price_asc", limit: 6 }}
      layout="compact"
      className="bg-gradient-to-b from-white to-[#fff5fa]"
    />

    <ProductSection
      heading={{
        eyebrow: "Value Combo Packs",
        before: "Special",
        accent: "Combo",
        after: "Packs",
        description: "More protection in one pack, for less.",
      }}
      params={{ combo: true, limit: 4 }}
      layout="feature"
      action={<ViewAllLink to={shopPath({ combo: true })} />}
    />

    <AboutTeaser />
    <ExploreProducts />
    <WhyCareNSafe />
    <Testimonials />
    <CtaBanner />
  </>
);

export default HomeSections;
