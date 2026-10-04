import SignupForm from "../../components/Auth/SignupForm";
import AuthShowcase, { AuthShowcaseCompact } from "../../components/Auth/AuthShowcase";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import { PAGE_BACKGROUND } from "../../constants/customerTheme";

const SignupPage = () => {
  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <main className="flex-1 overflow-x-clip px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-6 xl:items-stretch xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-12">
          {/* Brand panel with the photo (wide screens), short strip above the form (phones, tablets, small laptops) */}
          <AuthShowcase variant="signup" />

          <div className="flex flex-col items-center gap-5 xl:items-end xl:justify-center">
            <AuthShowcaseCompact variant="signup" className="max-w-[420px]" />
            <SignupForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SignupPage;
