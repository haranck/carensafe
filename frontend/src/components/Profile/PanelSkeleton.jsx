const Block = ({ className = "" }) => <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;

// Loading placeholder shaped like a Panel
const PanelSkeleton = ({ lines = 3, className = "" }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 ${className}`}
  >
    <Block className="h-5 w-1/3" />
    {Array.from({ length: lines }, (_, i) => (
      <Block key={i} className={i === lines - 1 ? "h-4 w-2/3" : "h-4"} />
    ))}
  </div>
);

export default PanelSkeleton;
