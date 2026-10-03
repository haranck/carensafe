export const FREE_DELIVERY_MIN = 399;
export const LOW_STOCK_LIMIT = 5;

export const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Admin-created variant names can contain double spaces ("Combo Pack  Normal Flow")
export const cleanName = (name = "") => name.replace(/\s+/g, " ").trim();

export const isComboItem = (item) => item?.category === "combo_packs";

// One badge per card, highest priority first; null when the data supports none
export const getProductBadge = (item) => {
    if (isComboItem(item)) return "Combo";
    if (item?.isNew) return "New";
    if (item?.price >= FREE_DELIVERY_MIN) return "Free Delivery";
    return null;
};
