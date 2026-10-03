import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import HomeHero from "../components/Home/HomeHero";
import HomeSections from "../components/Home/HomeSections";
import { PAGE_BACKGROUND } from "../constants/customerTheme";

// Guest home ("/"): brand hero + the same home sections members see on /home
const LandingPage = () => (
  <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
    <Header />

    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className="flex-1 overflow-x-clip">
          <HomeHero isGuest />
          <HomeSections />
        </main>
      </MotionConfig>
    </LazyMotion>

    <Footer />
  </div>
);

export default LandingPage;
