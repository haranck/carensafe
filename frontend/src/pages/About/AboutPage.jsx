import { useId, useLayoutEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import AboutHero from "../../components/About/AboutHero";
import AboutStats from "../../components/About/AboutStats";
import TechnologySection from "../../components/About/TechnologySection";
import EverydaySection from "../../components/About/EverydaySection";
import CtaBanner from "../../components/Home/CtaBanner";
import { PAGE_BACKGROUND } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

// About Us: brand story, numbers, the 11-in-1 technology, our promise, shop CTA
const AboutPage = () => {
  const headingId = useId();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  usePageTitle("About Us");

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <AboutHero headingId={headingId} />
            <AboutStats />
            <TechnologySection />
            <EverydaySection />
            <CtaBanner />
          </main>
        </MotionConfig>
      </LazyMotion>
      <Footer />
    </div>
  );
};

export default AboutPage;
