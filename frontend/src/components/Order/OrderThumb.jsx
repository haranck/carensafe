import { Package } from "lucide-react";

// Product image (or a package icon) on a soft pink square
const OrderThumb = ({ image, className = "h-14 w-14" }) => (
  <span className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#fff5fa] to-[#f5effd] ${className}`}>
    {image ? (
      <img src={image} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
    ) : (
      <Package size={20} aria-hidden="true" className="text-pink-200" />
    )}
  </span>
);

export default OrderThumb;
