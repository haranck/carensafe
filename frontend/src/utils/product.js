export const FREE_DELIVERY_MIN = 399;
export const LOW_STOCK_LIMIT = 5;
export const MAX_ORDER_QUANTITY = 10;

// Keys match the API's `category` values
export const CATEGORY_LABELS = {
    sanitary_pads: "Sanitary Pads",
};

export const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Price filter label: "₹200–₹400", "₹400+" or "Up to ₹200"
export const formatPriceRange = (minPrice, maxPrice) => {
    if (minPrice && maxPrice) return `${formatPrice(minPrice)}–${formatPrice(maxPrice)}`;
    if (minPrice) return `${formatPrice(minPrice)}+`;
    return `Up to ${formatPrice(maxPrice)}`;
};

// Admin-created variant names can contain double spaces ("Combo Pack  Normal Flow")
export const cleanName = (name = "") => name.replace(/\s+/g, " ").trim();

// "Product name + variant name". Admin variant names usually start with the product name already
// ("CareNSafe Premium Cotton XL Sanitary Pads"), so it's never repeated.
export const productTitle = (productName = "", variantName = "") => {
    const product = cleanName(productName || "");
    const variant = cleanName(variantName || "");
    if (!variant) return product;
    if (!product || variant.toLowerCase().startsWith(product.toLowerCase())) return variant;
    return `${product} ${variant}`;
};

export const isComboItem = (item) => Boolean(item?.isCombo);

// Every badge the data supports, highest priority first. `price` is the price on show (card default variant
// or the selected variant on the detail page); `inStock` is only set on list cards.
export const getProductBadges = (item) =>
    [
        item?.inStock === false && "Out of stock",
        isComboItem(item) && "Combo",
        item?.isNew && "New",
        item?.price >= FREE_DELIVERY_MIN && "Free Delivery",
    ].filter(Boolean);

// One badge per card; null when the data supports none
export const getProductBadge = (item) => getProductBadges(item)[0] || null;
