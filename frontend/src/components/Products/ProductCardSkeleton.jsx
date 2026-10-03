const Bar = ({ className }) => <div className={`rounded-full bg-slate-100 ${className}`} />;

const ProductCardSkeleton = ({ layout = "grid" }) => {
  if (layout === "compact") {
    return (
      <div aria-hidden="true" className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3">
        <div className="aspect-square w-24 flex-shrink-0 rounded-xl bg-[#fff5fa]" />
        <div className="flex-1 space-y-2">
          <Bar className="h-3.5 w-4/5" />
          <Bar className="h-3.5 w-1/2" />
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-100 sm:w-20" />
      </div>
    );
  }

  if (layout === "feature") {
    return (
      <div aria-hidden="true" className="grid animate-pulse overflow-hidden rounded-3xl border border-pink-100 bg-white p-3 sm:grid-cols-[2fr_3fr] lg:grid-cols-[380px_1fr]">
        <div className="aspect-square rounded-2xl bg-[#fff5fa]" />
        <div className="space-y-3 p-8">
          <Bar className="h-5 w-24" />
          <Bar className="h-6 w-4/5" />
          <Bar className="h-4 w-1/3" />
          <Bar className="mt-8 h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="flex h-full animate-pulse flex-col rounded-2xl border border-slate-100 bg-white p-3">
      <div className="aspect-square rounded-xl bg-[#fff5fa]" />
      <div className="space-y-2.5 px-1.5 pb-1 pt-3.5">
        <Bar className="h-4 w-16" />
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Bar className="h-5 w-14" />
          <div className="h-10 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
