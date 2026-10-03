// Shared Tailwind class strings for customer-facing pages (full literals so Tailwind can generate them)

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30 focus-visible:ring-offset-2";

// Hero / CTA panels and gradient text. The header uses its own BRAND_GRADIENT (HeaderParts/navConfig.js).
export const BRAND_GRADIENT = "bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]";

// Primary pink action (Add to Cart, Shop Now); deep pink on hover/press
export const PINK_BUTTON =
  "bg-gradient-to-r from-[#d6008a] to-[#b0006f] text-white shadow-[0_4px_14px_rgba(214,0,138,0.28)] hover:from-[#b8007a] hover:to-[#9d0063] active:scale-[0.97] transition-all duration-200";

// Page width used by the header, home sections and footer
export const CONTAINER = "max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8";

// Lets horizontal scrollers run edge-to-edge inside CONTAINER (negative margin = container padding)
export const CONTAINER_BLEED = "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scroll-px-4 sm:scroll-px-6 lg:scroll-px-8";

// Off-white page base with two soft colour washes at the top (CSS gradients only, no blur filters)
export const PAGE_BACKGROUND =
  "bg-[#fbf8fc] bg-[radial-gradient(1100px_560px_at_100%_-8%,rgba(214,0,138,0.09),transparent_70%),radial-gradient(900px_520px_at_0%_0%,rgba(124,58,237,0.08),transparent_70%)] bg-no-repeat";
