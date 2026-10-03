export const SHOP_PAGE_SIZE = 12;

export const DEFAULT_SORT = "newest";

// Values match the API's `sort` param
export const SHOP_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// Quick price ranges (strings, like the URL values)
export const PRICE_PRESETS = [
  { label: "Under ₹200", minPrice: "", maxPrice: "200" },
  { label: "₹200–₹400", minPrice: "200", maxPrice: "400" },
  { label: "₹400+", minPrice: "400", maxPrice: "" },
];
