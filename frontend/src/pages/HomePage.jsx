import { useSelector } from "react-redux";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import HomeHero from "../components/Home/HomeHero";
import HomeSections from "../components/Home/HomeSections";
import { PAGE_BACKGROUND } from "../constants/customerTheme";

// Member home (/home): welcome hero + the shared home sections (the guest landing page "/" shows the same sections)
const HomePage = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <HomeHero firstName={user?.firstName} />
            <HomeSections />
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default HomePage;
