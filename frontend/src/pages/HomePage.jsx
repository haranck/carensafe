import { useSelector } from "react-redux";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import HomeHero from "../components/Home/HomeHero";
import TrustStrip from "../components/Home/TrustStrip";
import ProductSection from "../components/Home/ProductSection";
import ExploreProducts from "../components/Home/ExploreProducts";
import WhyCareNSafe from "../components/Home/WhyCareNSafe";
import Testimonials from "../components/Home/Testimonials";
import CtaBanner from "../components/Home/CtaBanner";
import { ViewAllLink } from "../components/Home/SectionHeading";
import { PAGE_BACKGROUND } from "../constants/customerTheme";

const HomePage = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <HomeHero firstName={user?.firstName} />
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

            <ProductSection
              heading={{
                eyebrow: "Fast Moving",
                before: "Quick",
                accent: "Buy",
                description: "Everyday essentials, one tap away.",
              }}
              params={{ category: "sanitary_pads", sort: "price_asc", limit: 6 }}
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
              params={{ category: "combo_packs", limit: 4 }}
              layout="feature"
            />

            <ExploreProducts />
            <WhyCareNSafe />
            <Testimonials />
            <CtaBanner />
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default HomePage;
