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
const recalculatePricing = (pricing, items, { prepaid = false } = {}) => {
    const kept = items.filter((item) => item.status !== 'cancelled');
    const subtotal = sum(kept.map((item) => item.lineTotal));
    const discount = Math.min(pricing.discount || 0, subtotal);
    const shipping = kept.length === 0 ? 0 : pricing.shipping || 0;
    // Prepaid orders also owe back what was cancelled after paying; COD cancellations were never paid
    const owed = items.filter((item) => item.status === 'returned' || (prepaid && item.status === 'cancelled'));
    return {
        subtotal,
        discount,
        shipping,
        total: Math.max(0, subtotal - discount + shipping),
        refundableAmount: sum(owed.map((item) => item.lineTotal)),
        refundedAmount: pricing.refundedAmount || 0
    };
};

// Paid up front (online and/or wallet) and not fully refunded yet: cancellations and returns refund automatically.
// COD orders never do (nothing was paid before delivery).
const isPrepaid = (order) =>
    ['razorpay', 'wallet'].includes(order.paymentMethod) && ['paid', 'partially_refunded'].includes(order.paymentStatus);

const toPaise = (rupees) => Math.round(rupees * 100);

// How a prepaid order was paid and what already went back (paise). Orders from before order.payment existed were
// paid fully online.
const paidAmounts = (order) => {
    const payment = order.payment || {};
    const walletPaise = payment.walletPaise || 0;
    let onlinePaise = payment.onlinePaise || 0;
    if (!walletPaise && !onlinePaise && order.paymentMethod === 'razorpay') {
        onlinePaise = toPaise(sum(order.items.map((item) => item.lineTotal)) - (order.pricing.discount || 0) + (order.pricing.shipping || 0));
    }
    return {
        walletPaise,
        onlinePaise,
        refundedWalletPaise: payment.refundedWalletPaise || 0,
        refundedOnlinePaise: payment.refundedOnlinePaise || 0
    };
};

/**
 * Splits a refund between the wallet-paid and online-paid parts, in proportion to how the order was paid, and never
 * beyond what is left of either part (`remaining` = { wallet, online } still refundable, paise). Returns the parts;
 * their sum can be lower than `amountPaise` only when the order has nothing left to refund.
 */
const splitRefund = (amountPaise, paid, remaining) => {
    const total = paid.walletPaise + paid.onlinePaise;
    if (total <= 0 || amountPaise <= 0) return { walletPaise: 0, onlinePaise: 0 };
    let onlinePaise = Math.min(Math.round((amountPaise * paid.onlinePaise) / total), remaining.online);
    let walletPaise = Math.min(amountPaise - onlinePaise, remaining.wallet);
    // Rounding / caps: put any rest on whichever part still has room
    const rest = amountPaise - onlinePaise - walletPaise;
    if (rest > 0) onlinePaise += Math.min(rest, remaining.online - onlinePaise);
    return { walletPaise, onlinePaise };
};

/**
 * What one line refunds, in PAISE: its line total minus its share of the order discount (shared in proportion to the
 * line totals of the whole order as placed). The single place this formula lives.
 */
const refundForItemPaise = (order, item) => {
    const orderSubtotal = sum(order.items.map((line) => line.lineTotal));
    const discountShare = orderSubtotal > 0 ? ((order.pricing.discount || 0) * item.lineTotal) / orderSubtotal : 0;
    return toPaise(Math.max(0, item.lineTotal - discountShare));
};

// After a refund: fully refunded once nothing is left that was kept (every line cancelled or returned)
const paymentStatusAfterRefund = (items) =>
    items.every((item) => item.status === 'cancelled' || item.status === 'returned') ? 'refunded' : 'partially_refunded';

// Order status once returns move: a return still open → return_requested; else returned / partially_returned /
// back to delivered (every request rejected)
const statusAfterReturns = (items) => {
    const live = items.filter((item) => item.status !== 'cancelled');
    if (live.some((item) => RETURN_IN_PROGRESS.includes(item.status))) return 'return_requested';
    const returned = live.filter((item) => item.status === 'returned').length;
    if (returned === 0) return 'delivered';
    return returned === live.length ? 'returned' : 'partially_returned';
};

module.exports = {
    readable,
    REASON_LABELS,
    itemTitle,
    recalculatePricing,
    statusAfterReturns,
    isPrepaid,
    toPaise,
    paidAmounts,
    splitRefund,
    refundForItemPaise,
    paymentStatusAfterRefund
};
