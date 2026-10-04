// Pure order helpers shared by the user and admin order services

const RETURN_IN_PROGRESS = ['return_requested', 'return_approved'];

const sum = (values) => values.reduce((total, value) => total + value, 0);

// "out_for_delivery" → "out for delivery"
const readable = (status) => status.replace(/_/g, ' ');

const REASON_LABELS = {
    size_mismatch: 'size mismatch',
    ordered_by_mistake: 'ordered by mistake',
    found_better_price: 'found a better price',
    delivery_too_late: 'delivery too late',
    other: 'other'
};

// "Product name + variant name" (variant names usually start with the product name already)
const itemTitle = (name = '', variantName = '') => {
    const product = (name || '').replace(/\s+/g, ' ').trim();
    const variant = (variantName || '').replace(/\s+/g, ' ').trim();
    if (!variant) return product;
    if (!product || variant.toLowerCase().startsWith(product.toLowerCase())) return variant;
    return `${product} ${variant}`;
};

/**
 * Totals after cancellations / returns. Cancelled lines leave the subtotal. Shipping keeps its original charge while
 * anything in the order is still being delivered, and drops to 0 only when the whole order is cancelled.
 * `total` is what the order costs (COD collects it on delivery); returned lines don't change it, they are added to
 * `refundableAmount` (refunded manually for COD until Razorpay refunds exist).
 */
const recalculatePricing = (pricing, items) => {
    const kept = items.filter((item) => item.status !== 'cancelled');
    const subtotal = sum(kept.map((item) => item.lineTotal));
    const discount = Math.min(pricing.discount || 0, subtotal);
    const shipping = kept.length === 0 ? 0 : pricing.shipping || 0;
    return {
        subtotal,
        discount,
        shipping,
        total: Math.max(0, subtotal - discount + shipping),
        refundableAmount: sum(items.filter((item) => item.status === 'returned').map((item) => item.lineTotal))
    };
};

// Order status once returns move: a return still open → return_requested; else returned / partially_returned /
// back to delivered (every request rejected)
const statusAfterReturns = (items) => {
    const live = items.filter((item) => item.status !== 'cancelled');
    if (live.some((item) => RETURN_IN_PROGRESS.includes(item.status))) return 'return_requested';
    const returned = live.filter((item) => item.status === 'returned').length;
    if (returned === 0) return 'delivered';
    return returned === live.length ? 'returned' : 'partially_returned';
};

module.exports = { readable, REASON_LABELS, itemTitle, recalculatePricing, statusAfterReturns };
