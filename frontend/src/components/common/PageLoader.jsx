import { Loader2 } from "lucide-react";

// Suspense fallback for lazy-loaded customer pages
const PageLoader = () => (
  <div role="status" className="flex min-h-screen items-center justify-center bg-[#fdfbff]">
    <Loader2 size={32} aria-hidden="true" className="animate-spin text-[#d6008a]" />
    <span className="sr-only">Loading page…</span>
  </div>
);

export default PageLoader;
