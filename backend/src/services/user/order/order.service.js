const orderRepository = require('../../../repositories/user/order.repository');
const productRepository = require('../../../repositories/user/product.repository');
const cartRepository = require('../../../repositories/user/cart.repository');
const addressRepository = require('../../../repositories/user/address.repository');
const cartService = require('../cart/cart.service');
const walletService = require('../wallet/wallet.service');
const {
    RETURN_WINDOW_DAYS,
    USER_CANCELLABLE_STATUSES,
    RETURNABLE_STATUSES,
    STATUS_GROUPS
} = require('../../../config/orders');

const {
    readable,
    REASON_LABELS,
    itemTitle,
    recalculatePricing,
    statusAfterReturns,
    isPaidOnline,
    toPaise,
    refundForItemPaise,
    paymentStatusAfterRefund
} = require('../../../utils/order');

const DAY_MS = 24 * 60 * 60 * 1000;
const ORDER_NUMBER_ATTEMPTS = 5;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);
const pad = (value, length = 2) => String(value).padStart(length, '0');

const notFound = () => httpError('Order not found.', 404);
const changedMeanwhile = () => httpError('This order was just updated. Refresh and try again.', 409);

const findItem = (order, itemId) => {
    const item = order.items.find((line) => sameId(line._id, itemId));
    if (!item) throw httpError('Item not found in this order.', 404);
    return item;
};

const returnWindowEndsAt = (order) =>
    order.deliveredAt ? new Date(new Date(order.deliveredAt).getTime() + RETURN_WINDOW_DAYS * DAY_MS) : null;

const isReturnWindowOpen = (order, now = new Date()) => {
    const endsAt = returnWindowEndsAt(order);
    return Boolean(endsAt) && now <= endsAt;
};

// What the customer may do right now; the frontend only shows these buttons, the rules stay here
const toCustomerOrder = (order) => {
    const canCancelOrder = USER_CANCELLABLE_STATUSES.includes(order.orderStatus);
    const canReturnOrder = RETURNABLE_STATUSES.includes(order.orderStatus) && isReturnWindowOpen(order);
    const items = order.items.map((item) => ({
        ...item,
        canCancel: canCancelOrder && item.status === 'active',
        canReturn: canReturnOrder && item.status === 'active'
    }));
    // Payment gateway details stay server-side
    const { razorpay, ...rest } = order;
    return {
        ...rest,
        items,
        returnWindowDays: RETURN_WINDOW_DAYS,
        returnWindowEndsAt: returnWindowEndsAt(order),
        canCancel: items.some((item) => item.canCancel),
        canReturn: items.some((item) => item.canReturn)
    };
};

// CNS-20261004-4821 (local date + 4 random digits)
const makeOrderNumber = (now = new Date()) =>
    `CNS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(Math.floor(Math.random() * 10000), 4)}`;

const toAddressSnapshot = (address) => ({
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    district: address.district,
    state: address.state,
    pincode: address.pincode,
    country: address.country || 'India',
    type: address.type,
    ...(address.location?.coordinates?.length === 2 && { location: address.location })
});

const ITEM_ISSUES = {
    unavailable: () => 'no longer available',
    out_of_stock: () => 'out of stock',
    quantity_reduced: (item) => `only ${item.stock} left`
};

class OrderService {
    // Everything is recomputed here from the cart and live product data; nothing about prices comes from the client.
    // Stock, order and cart change in one transaction: if any variant runs out meanwhile, nothing is changed.
    async placeOrder(userId, { addressId, paymentMethod }) {
        if (paymentMethod !== 'cod') {
            throw httpError('Only Cash on Delivery is available right now.', 400);
        }

        const [address, cart] = await Promise.all([
            addressRepository.findOwn(userId, addressId),
            cartService.getCart(userId)
        ]);
        if (!address) throw httpError('Address not found.', 404);
        if (cart.items.length === 0) throw httpError('Your cart is empty.', 400);

        const problems = cart.items.filter((item) => item.issue);
        if (problems.length > 0) {
            const list = problems
                .map((item) => `${itemTitle(item.name, item.variantName) || 'An item'} (${ITEM_ISSUES[item.issue](item)})`)
                .join(', ');
            throw httpError(`Some items can't be ordered: ${list}. Update your cart and try again.`, 400);
        }

        let orderNumber = makeOrderNumber();
        for (let attempt = 1; attempt < ORDER_NUMBER_ATTEMPTS && (await orderRepository.existsByNumber(orderNumber)); attempt++) {
            orderNumber = makeOrderNumber();
        }

        const items = cart.items.map((item) => ({
            product: item.productId,
            variant: item.variantId,
            name: itemTitle(item.name, item.variantName),
            image: item.image,
            size: item.size,
            pieces: item.pieces,
            price: item.price,
            mrp: item.mrp,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            status: 'active'
        }));
        const { subtotal, shipping } = cart.summary;

        return orderRepository.runInTransaction(async (session) => {
            for (const item of items) {
                const result = await productRepository.decrementVariantStock(item.product, item.variant, item.quantity, session);
                if (result.modifiedCount === 0) {
                    throw httpError(`${item.name} just went out of stock. Update your cart and try again.`, 409);
                }
            }

            const order = await orderRepository.create(
                {
                    user: userId,
                    orderNumber,
                    items,
                    shippingAddress: toAddressSnapshot(address),
                    pricing: { subtotal, discount: 0, shipping, total: subtotal + shipping, refundableAmount: 0 },
                    paymentMethod: 'cod',
                    paymentStatus: 'pending',
                    orderStatus: 'confirmed',
                    statusHistory: [{ status: 'confirmed', note: 'Order placed (Cash on Delivery)', by: 'user' }]
                },
                session
            );
            await cartRepository.clear(userId, session);
            return toCustomerOrder(order);
        });
    }

    // status: one of STATUS_GROUPS (active / delivered / cancelled / returns) or omitted for all
    async getMyOrders(userId, { page, limit, status }) {
        const filter = { user: userId };
        if (status) filter.orderStatus = { $in: STATUS_GROUPS[status] };
        const result = await orderRepository.findPaginated(filter, page, limit);
        return { ...result, data: result.data.map(toCustomerOrder) };
    }

    async getMyOrder(userId, orderId) {
        const order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw notFound();
        return toCustomerOrder(order);
    }

    cancelMyOrder(userId, orderId, itemId, { reason, note }) {
        return this.cancelItems({
            loadOrder: (session) => orderRepository.findOwn(userId, orderId, session),
            itemId,
            reason,
            note,
            by: 'user',
            allowedStatuses: USER_CANCELLABLE_STATUSES
        }).then(toCustomerOrder);
    }

    /**
     * Cancels one item (itemId) or every active item, puts their stock back and recalculates the totals, in one
     * transaction. Used by the customer and the admin (who may also cancel shipped orders).
     */
    cancelItems({ loadOrder, itemId, reason, note, by, allowedStatuses }) {
        return orderRepository.runInTransaction(async (session) => {
            const order = await loadOrder(session);
            if (!order) throw notFound();

            if (order.orderStatus === 'cancelled') throw httpError('This order is already cancelled.', 409);
            if (!allowedStatuses.includes(order.orderStatus)) {
                throw httpError(
                    by === 'user'
                        ? 'Orders can be cancelled only before they are shipped.'
                        : `An order that is ${readable(order.orderStatus)} can't be cancelled.`,
                    400
                );
            }

            let targets;
            if (itemId) {
                const item = findItem(order, itemId);
                if (item.status === 'cancelled') throw httpError('This item is already cancelled.', 409);
                if (item.status !== 'active') throw httpError('This item can no longer be cancelled.', 409);
                targets = [item];
            } else {
                targets = order.items.filter((item) => item.status === 'active');
                if (targets.length === 0) throw httpError('This order is already cancelled.', 409);
            }

            const now = new Date();
            const targetIds = new Set(targets.map((item) => String(item._id)));
            const items = order.items.map((item) =>
                targetIds.has(String(item._id))
                    ? { ...item, status: 'cancelled', cancellation: { reason, note, cancelledBy: by, at: now } }
                    : item
            );
            const isFullyCancelled = items.every((item) => item.status === 'cancelled');
            const orderStatus = isFullyCancelled ? 'cancelled' : 'partially_cancelled';
            const what = itemId ? `Cancelled ${targets[0].name}` : 'Order cancelled';
            const history = [{ status: orderStatus, note: `${what} (${REASON_LABELS[reason]})${note ? `: ${note}` : ''}`, by, at: now }];

            for (const item of targets) {
                await productRepository.incrementVariantStock(item.product, item.variant, item.quantity, session);
            }

            // Paid online → the cancelled lines (and the shipping, once nothing is left) go back to the wallet
            const paidOnline = isPaidOnline(order);
            let pricing = recalculatePricing(order.pricing, items, { paidOnline });
            let finalItems = items;
            let paymentStatus = order.paymentStatus;
            if (paidOnline) {
                const refund = await this.refundToWallet(order, targets, session, { includeShipping: isFullyCancelled });
                finalItems = items.map((item) => (refund.byItem[String(item._id)] ? { ...item, refund: refund.byItem[String(item._id)] } : item));
                pricing = { ...pricing, refundedAmount: (order.pricing.refundedAmount || 0) + refund.totalRupees };
                paymentStatus = paymentStatusAfterRefund(finalItems);
                if (refund.historyEntry) history.push(refund.historyEntry);
            }

            const saved = await orderRepository.updateIfUnchanged(
                order._id,
                order.updatedAt,
                {
                    $set: {
                        items: finalItems,
                        orderStatus,
                        pricing,
                        paymentStatus,
                        ...(isFullyCancelled && { cancelledAt: now })
                    },
                    $push: { statusHistory: { $each: history } }
                },
                session
            );
            if (!saved) throw changedMeanwhile();
            return saved;
        });
    }

    /**
     * Credits the wallet for `targets` of an online-paid order, inside the caller's transaction. One wallet transaction per
     * line (key `refund:<orderId>:<itemId>`, so a line is never refunded twice), plus the shipping charge when asked.
     * Returns { byItem: { [itemId]: { amount (paise), creditedAt, walletTransaction } }, totalRupees, historyEntry }.
     */
    async refundToWallet(order, targets, session, { includeShipping = false } = {}) {
        const now = new Date();
        const byItem = {};
        let totalPaise = 0;

        for (const item of targets) {
            const amountPaise = refundForItemPaise(order, item);
            if (amountPaise <= 0) continue;
            const { transaction, alreadyApplied } = await walletService.credit(
                {
                    userId: order.user,
                    amountPaise,
                    source: 'refund',
                    orderId: order._id,
                    itemId: item._id,
                    description: `Refund for ${item.name}${item.size ? ` (${item.size})` : ''} · ${order.orderNumber}`,
                    idempotencyKey: `refund:${order._id}:${item._id}`
                },
                session
            );
            byItem[String(item._id)] = { amount: transaction.amount, creditedAt: transaction.createdAt || now, walletTransaction: transaction._id };
            if (!alreadyApplied) totalPaise += transaction.amount;
        }

        const shippingPaise = includeShipping ? toPaise(order.pricing.shipping || 0) : 0;
        if (shippingPaise > 0) {
            const { transaction, alreadyApplied } = await walletService.credit(
                {
                    userId: order.user,
                    amountPaise: shippingPaise,
                    source: 'refund',
                    orderId: order._id,
                    description: `Shipping refund · ${order.orderNumber}`,
                    idempotencyKey: `refund:${order._id}:shipping`
                },
                session
            );
            if (!alreadyApplied) totalPaise += transaction.amount;
        }

        const totalRupees = totalPaise / 100;
        return {
            byItem,
            totalRupees,
            historyEntry:
                totalPaise > 0
                    ? { status: 'refunded', note: `₹${totalRupees.toLocaleString('en-IN')} refunded to wallet`, by: 'system', at: now }
                    : null
        };
    }

    // One item (itemId) or every active item. Only size mismatch, only unopened packs, only within the window.
    async requestReturn(userId, orderId, itemId, { note, packUnopenedConfirmed }) {
        const order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw notFound();

        if (!order.deliveredAt || !RETURNABLE_STATUSES.includes(order.orderStatus)) {
            throw httpError('Returns are available only after the order is delivered.', 400);
        }
        if (!isReturnWindowOpen(order)) throw httpError('Return window has closed.', 400);
        if (packUnopenedConfirmed !== true) throw httpError('Returns are accepted only for unopened packs.', 400);

        let targets;
        if (itemId) {
            const item = findItem(order, itemId);
            if (item.status !== 'active') throw httpError('This item is already cancelled, returned or in a return.', 409);
            targets = [item];
        } else {
            targets = order.items.filter((item) => item.status === 'active');
            if (targets.length === 0) throw httpError('There is nothing left to return in this order.', 409);
        }

        const now = new Date();
        const targetIds = new Set(targets.map((item) => String(item._id)));
        const items = order.items.map((item) =>
            targetIds.has(String(item._id))
                ? {
                    ...item,
                    status: 'return_requested',
                    return: { reason: 'size_mismatch', note, packUnopenedConfirmed: true, requestedAt: now }
                }
                : item
        );
        const what = itemId ? `Return requested for ${targets[0].name}` : 'Return requested for the order';

        const saved = await orderRepository.updateIfUnchanged(order._id, order.updatedAt, {
            $set: { items, orderStatus: statusAfterReturns(items) },
            $push: { statusHistory: { status: 'return_requested', note: `${what} (size mismatch)${note ? `: ${note}` : ''}`, by: 'user', at: now } }
        });
        if (!saved) throw changedMeanwhile();
        return toCustomerOrder(saved);
    }
}

module.exports = new OrderService();
