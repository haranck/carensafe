import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronRight } from "lucide-react";
import { FRONTEND_ROUTES, shopPath } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";
import { CATEGORY_LABELS, cleanName } from "../../utils/product";

const ProductBreadcrumb = ({ category, isCombo, name }) => {
  const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));

  const crumbs = [
    { label: "Home", to: isLoggedIn ? FRONTEND_ROUTES.HOME : FRONTEND_ROUTES.LANDING },
    { label: "Shop", to: FRONTEND_ROUTES.SHOP },
    isCombo
      ? { label: "Combo Packs", to: shopPath({ combo: true }) }
      : { label: CATEGORY_LABELS[category], to: shopPath({ category }) },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] font-medium text-slate-500">
        {crumbs.map(({ label, to }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Link
              to={to}
              className={`inline-flex min-h-10 items-center rounded-md hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
            >
              {label}
            </Link>
            <ChevronRight size={14} aria-hidden="true" className="text-slate-300" />
          </li>
        ))}
        <li aria-current="page" className="min-w-0 max-w-full truncate font-semibold text-[#1e1a3a]">
          {cleanName(name)}
        </li>
      </ol>
    </nav>
  );
};

export default ProductBreadcrumb;
