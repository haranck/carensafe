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
    'partially_returned'
];

const ITEM_STATUSES = ['active', 'cancelled', 'return_requested', 'return_approved', 'return_rejected', 'returned'];

const PAYMENT_METHODS = ['cod', 'razorpay'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];

const CANCEL_REASONS = ['size_mismatch', 'ordered_by_mistake', 'found_better_price', 'delivery_too_late', 'other'];
// Returns are accepted only for unopened packs in the wrong size
const RETURN_REASONS = ['size_mismatch'];

module.exports = {
    ORDER_STATUSES,
    ITEM_STATUSES,
    PAYMENT_METHODS,
    PAYMENT_STATUSES,
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
        active: ['pending', 'confirmed', 'partially_cancelled', 'shipped', 'out_for_delivery'],
        delivered: ['delivered'],
        cancelled: ['cancelled'],
        returns: ['return_requested', 'returned', 'partially_returned']
    }
};
