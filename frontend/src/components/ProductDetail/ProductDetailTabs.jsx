import { useId, useRef, useState } from "react";
import Reveal from "../Home/Reveal";
import { PRODUCT_FEATURES, PRODUCT_HIGHLIGHTS } from "../../constants/productHighlights";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";
import { CATEGORY_LABELS, cleanName, formatPrice } from "../../utils/product";

const TABS = [
  { id: "description", label: "Description" },
  { id: "features", label: "Features" },
  { id: "specs", label: "Size & Specifications" },
  { id: "care", label: "How to Use" },
];

const HOW_TO_USE = [
  "Wash your hands, then take the pad out of its wrapper.",
  "Peel off the backing strip and press the pad onto the centre of your underwear. Fold the wings around the sides.",
  "Change every 4 to 6 hours, or sooner on heavy-flow days.",
  "Wrap the used pad in its wrapper or some paper and put it in a bin. Never flush pads.",
];

const CARE_TIPS = ["Store in a cool, dry place away from direct sunlight.", "Keep the pack closed between uses."];

const Description = ({ product }) => (
  <div className="max-w-[760px]">
    <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-slate-600">{product.description}</p>
    <ul className="mt-5 flex flex-wrap gap-2">
      {PRODUCT_HIGHLIGHTS.map((label) => (
        <li key={label} className="rounded-full bg-[#fff5fa] px-3 py-1 text-[12px] font-semibold text-[#d6008a]">
          {label}
        </li>
      ))}
    </ul>
  </div>
);

const Features = () => (
  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {PRODUCT_FEATURES.map(({ icon: Icon, title, text }) => (
      <li key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-[#fdfbff] p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[14px] font-bold text-[#1e1a3a]">{title}</h3>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{text}</p>
        </div>
      </li>
    ))}
  </ul>
);

const Specifications = ({ product, selectedId }) => (
  <div className="space-y-5">
    <dl className="grid gap-3 sm:grid-cols-2 lg:max-w-[560px]">
      <div className="rounded-xl bg-[#fdfbff] px-4 py-3">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</dt>
        <dd className="mt-0.5 text-[14px] font-semibold text-[#1e1a3a]">{CATEGORY_LABELS[product.category]}</dd>
      </div>
      <div className="rounded-xl bg-[#fdfbff] px-4 py-3">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available sizes</dt>
        <dd className="mt-0.5 text-[14px] font-semibold text-[#1e1a3a]">
          {product.variants.map((variant) => variant.size).join(", ")}
        </dd>
      </div>
    </dl>

    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full min-w-[480px] text-left text-[13.5px]">
        <caption className="sr-only">Sizes and prices</caption>
        <thead className="bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Variant</th>
            <th scope="col" className="px-4 py-3">Size</th>
            <th scope="col" className="px-4 py-3">Price</th>
            <th scope="col" className="px-4 py-3">Availability</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {product.variants.map((variant) => {
            const isSelected = variant._id === selectedId;
            return (
              <tr key={variant._id} aria-current={isSelected ? "true" : undefined} className={isSelected ? "bg-[#fff5fa]" : "bg-white"}>
                <th scope="row" className="px-4 py-3 font-semibold text-[#1e1a3a]">
                  {cleanName(variant.name)}
                  {isSelected && (
                    <span className="ml-2 rounded-full bg-[#d6008a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Selected
                    </span>
                  )}
                </th>
                <td className="px-4 py-3 text-slate-600">{variant.size}</td>
                <td className="px-4 py-3 font-semibold text-[#1e1a3a]">{formatPrice(variant.price)}</td>
                <td className="px-4 py-3">
                  {variant.stock > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">In stock</span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-600">Out of stock</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const HowToUse = () => (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <ol className="space-y-3">
      {HOW_TO_USE.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${BRAND_GRADIENT}`}>
            {i + 1}
          </span>
          <p className="pt-0.5 text-[14px] leading-relaxed text-slate-600">{step}</p>
        </li>
      ))}
    </ol>
    <div className="rounded-2xl bg-[#fff5fa] p-5">
      <h3 className="text-[14px] font-bold text-[#1e1a3a]">Storage & care</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-600 marker:text-[#d6008a]">
        {CARE_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  </div>
);

// ARIA tabs: arrow keys / Home / End move between tabs
const ProductDetailTabs = ({ product, selectedId }) => {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tabRefs = useRef([]);

  const handleKeyDown = (e, i) => {
    const targets = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 };
    if (!(e.key in targets)) return;
    e.preventDefault();
    const next = (targets[e.key] + TABS.length) % TABS.length;
    setActiveTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const panels = {
    description: <Description product={product} />,
    features: <Features />,
    specs: <Specifications product={product} selectedId={selectedId} />,
    care: <HowToUse />,
  };

  return (
    <Reveal aria-label="Product details" className="border-y border-violet-100/70 bg-white">
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <div
          role="tablist"
          aria-label="Product details"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map(({ id, label }, i) => {
            const isActive = id === activeTab;
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${id}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`inline-flex h-10 flex-shrink-0 items-center rounded-full px-5 text-[13px] font-semibold whitespace-nowrap transition-all ${FOCUS_RING} ${
                  isActive
                    ? `${BRAND_GRADIENT} text-white shadow-[0_4px_14px_rgba(124,58,237,0.25)]`
                    : "border border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:text-[#d6008a]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeTab}`}
          aria-labelledby={`${baseId}-tab-${activeTab}`}
          tabIndex={0}
          className={`mt-6 rounded-3xl border border-slate-100 bg-white p-5 sm:p-8 ${FOCUS_RING}`}
        >
          {panels[activeTab]}
        </div>
      </div>
    </Reveal>
  );
};

export default ProductDetailTabs;
