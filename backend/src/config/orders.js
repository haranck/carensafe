// Order rules shared by the order model, Joi validation and the order services

const ORDER_STATUSES = [
    'pending',
    'confirmed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'partially_cancelled',
    'return_requested',
    'returned',
    'partially_returned',
    // Online payments: stock reserved while waiting for Razorpay; then confirmed, or one of the two below
    'pending_payment',
    'payment_failed', // the Razorpay order couldn't be created (stock released, wallet part returned)
    'payment_expired' // not paid within PAYMENT_EXPIRY_MINUTES (stock released, wallet part returned)
];

const ITEM_STATUSES = ['active', 'cancelled', 'return_requested', 'return_approved', 'return_rejected', 'returned'];

// razorpay: paid online (possibly with part of it from the wallet, see order.payment); wallet: paid fully from the wallet
const PAYMENT_METHODS = ['cod', 'razorpay', 'wallet'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];

// What customers / admins can choose when cancelling
const USER_CANCEL_REASONS = ['size_mismatch', 'ordered_by_mistake', 'found_better_price', 'delivery_too_late', 'other'];
// Plus the ones only the system sets
const CANCEL_REASONS = [...USER_CANCEL_REASONS, 'payment_not_completed', 'out_of_stock_after_payment'];
// Returns are accepted only for unopened packs in the wrong size
const RETURN_REASONS = ['size_mismatch'];

// Unpaid online orders that can be finished (retry) or cancelled
const PENDING_PAYMENT_STATUS = 'pending_payment';
// Orders whose reserved stock was released before payment (a late capture may revive them, see payment.service)
const UNPAID_CLOSED_STATUSES = ['payment_failed', 'payment_expired', 'cancelled'];

module.exports = {
    PENDING_PAYMENT_STATUS,
    UNPAID_CLOSED_STATUSES,
    ORDER_STATUSES,
    ITEM_STATUSES,
    PAYMENT_METHODS,
    PAYMENT_STATUSES,
    USER_CANCEL_REASONS,
    CANCEL_REASONS,
    RETURN_REASONS,

    // Days after delivery during which a return can be requested
    RETURN_WINDOW_DAYS: 7,

    // Customers can cancel only before shipping
    USER_CANCELLABLE_STATUSES: ['confirmed', 'partially_cancelled'],
    // Admins can also cancel shipped orders
    ADMIN_CANCELLABLE_STATUSES: ['confirmed', 'partially_cancelled', 'shipped'],
    // Returns can be requested once delivered (another item may already be in a return)
    RETURNABLE_STATUSES: ['delivered', 'return_requested', 'partially_returned'],

    // Admin status changes: only these forward steps. Cancelling (confirmed / shipped → cancelled) goes through the
    // cancel endpoint instead, because it needs a reason and restocks (ADMIN_CANCELLABLE_STATUSES).
    // A partially cancelled order ships like a confirmed one.
    STATUS_TRANSITIONS: {
        confirmed: ['shipped'],
        partially_cancelled: ['shipped'],
        shipped: ['out_for_delivery'],
        out_for_delivery: ['delivered']
    },

    // My Orders filter pills → order statuses
    STATUS_GROUPS: {
        active: ['pending', 'pending_payment', 'confirmed', 'partially_cancelled', 'shipped', 'out_for_delivery'],
        delivered: ['delivered'],
        cancelled: ['cancelled', 'payment_failed', 'payment_expired'],
        returns: ['return_requested', 'returned', 'partially_returned']
    }
};
