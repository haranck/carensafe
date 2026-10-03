import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, PackageX } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";

// 404 / invalid id
const ProductNotFound = () => {
  const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));

  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center gap-2 rounded-3xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
      <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
        <PackageX size={30} aria-hidden="true" />
      </span>
      <h1 className="text-[22px] font-extrabold text-[#1e1a3a]">Product not found</h1>
      <p className="max-w-[360px] text-[14px] leading-relaxed text-slate-500">
        This product may have been removed or the link is incorrect. Let's find you something else.
      </p>
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to={FRONTEND_ROUTES.SHOP}
          className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Shop
        </Link>
        <Link
          to={isLoggedIn ? FRONTEND_ROUTES.HOME : FRONTEND_ROUTES.LANDING}
          className={`inline-flex h-11 items-center rounded-full border border-pink-200 bg-white px-6 text-[14px] font-bold text-[#d6008a] hover:bg-[#fff5fa] transition-colors ${FOCUS_RING}`}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default ProductNotFound;
