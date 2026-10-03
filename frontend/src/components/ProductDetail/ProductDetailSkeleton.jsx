const Bar = ({ className }) => <div className={`rounded-full bg-slate-100 ${className}`} />;

// Mirrors the gallery + info panel layout so nothing jumps when the product arrives
const ProductDetailSkeleton = () => (
  <div role="status" className="animate-pulse">
    <span className="sr-only">Loading product…</span>
    <Bar className="my-3 h-4 w-56" />
    <div className="mt-4 grid gap-8 lg:max-w-[1240px] lg:grid-cols-2 lg:gap-12">
      <div aria-hidden="true" className="w-full max-w-[600px]">
        <div className="aspect-square w-full rounded-3xl bg-[#fff5fa]" />
        <div className="mt-3 flex gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 w-16 rounded-xl bg-[#fff5fa] sm:h-20 sm:w-20" />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="space-y-5">
        <Bar className="h-6 w-32" />
        <Bar className="h-9 w-4/5" />
        <Bar className="h-4 w-1/2" />
        <div className="h-28 rounded-2xl bg-white" />
        <Bar className="h-4 w-24" />
        <div className="flex gap-2.5">
          <Bar className="h-11 w-28" />
          <Bar className="h-11 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Bar className="h-12" />
          <Bar className="h-12" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;
