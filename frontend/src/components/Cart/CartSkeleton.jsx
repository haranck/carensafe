const Block = ({ className = "" }) => <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;

const LINE_COUNT = 3;

// Same two-column shape as the loaded cart: shipping bar + lines | summary
const CartSkeleton = () => (
  <div role="status" aria-label="Loading your cart" className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
    <div className="flex flex-col gap-3">
      <Block className="h-12 rounded-2xl" />
      {Array.from({ length: LINE_COUNT }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:gap-4 sm:p-4">
          <Block className="h-20 w-20 flex-shrink-0 rounded-xl sm:h-28 sm:w-28" />
          <div className="flex flex-1 flex-col gap-2">
            <Block className="h-4 w-3/4" />
            <Block className="h-3 w-1/3" />
            <Block className="h-4 w-1/4" />
            <Block className="mt-auto h-10 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
      <Block className="h-5 w-1/2" />
      <Block className="h-4" />
      <Block className="h-4" />
      <Block className="mt-2 h-7" />
      <Block className="mt-3 h-12 rounded-full" />
    </div>
  </div>
);

export default CartSkeleton;
