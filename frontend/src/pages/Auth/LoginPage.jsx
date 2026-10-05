import LoginForm from "../../components/Auth/LoginForm";
import AuthShowcase, { AuthShowcaseCompact } from "../../components/Auth/AuthShowcase";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import { PAGE_BACKGROUND } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const LoginPage = () => {
  usePageTitle("Login");
  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      {/* Phones: the form alone, edge to edge (it pads itself); the brand strip shows from md */}
      <main className="flex-1 overflow-x-clip pb-10 pt-2 md:px-6 md:py-12 lg:py-14">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-6 xl:items-stretch xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-12">
          {/* Brand panel with the photo (wide screens), short strip above the form (phones, tablets, small laptops) */}
          <AuthShowcase variant="login" />

          <div className="flex flex-col items-center gap-5 xl:items-end xl:justify-center">
            <AuthShowcaseCompact variant="login" />
            <LoginForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
