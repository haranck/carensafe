const Order = require('../../models/order.model');

const CUSTOMER_FIELDS = 'firstName lastName email phone';
// Lists don't need the full history
const LIST_PROJECTION = { statusHistory: 0, razorpay: 0 };

// Per order in the sales reports: what came back (returned lines) and the units kept / returned
const linesWithStatus = (statuses) => ({ $filter: { input: '$items', as: 'line', cond: { $in: ['$$line.status', statuses] } } });
const SALE_FIELDS = {
    returnedAmount: { $sum: { $map: { input: linesWithStatus(['returned']), as: 'line', in: '$$line.lineTotal' } } },
    unitsReturned: { $sum: { $map: { input: linesWithStatus(['returned']), as: 'line', in: '$$line.quantity' } } },
    units: {
        $sum: {
            $map: {
                input: { $filter: { input: '$items', as: 'line', cond: { $not: [{ $in: ['$$line.status', ['cancelled', 'returned']] }] } } },
                as: 'line',
                in: '$$line.quantity'
            }
        }
    }
};

// Shared by the user order service and the admin order service
class OrderRepository {
    async create(orderData, session) {
        const [order] = await Order.create([orderData], { session });
        return order.toObject();
    }

    existsByNumber(orderNumber) {
        return Order.exists({ orderNumber });
    }

    // The order a checkout attempt already created (same user + client idempotency key)
    findByIdempotencyKey(userId, idempotencyKey, session) {
        return Order.findOne({ user: userId, idempotencyKey }).session(session || null).lean();
    }

    // Unpaid online orders past their payment deadline (expiry job), oldest first
    findExpiredPending(now, limit = 20) {
        return Order.find({ orderStatus: 'pending_payment', expiresAt: { $lt: now } }).sort({ expiresAt: 1 }).limit(limit).lean();
    }

    // Scoped to the user: another user's order id simply isn't found
    findOwn(userId, orderId, session) {
        return Order.findOne({ _id: orderId, user: userId }).session(session || null).lean();
    }

    findById(orderId, session) {
        return Order.findById(orderId).session(session || null).lean();
    }

    findByIdWithCustomer(orderId) {
        return Order.findById(orderId).populate('user', CUSTOMER_FIELDS).lean();
    }

    // A source refund of one line moved on (pending → completed / failed)
    updateItemRefundStatus(orderId, itemId, { status, refundId }, session) {
        return Order.updateOne(
            { _id: orderId, 'items._id': itemId },
            { $set: { 'items.$.refund.onlineStatus': status, ...(refundId && { 'items.$.refund.razorpayRefundId': refundId }) } },
            { session }
        );
    }

    // Saves the recomputed parts of an order only if nobody changed it since it was read (updatedAt still matches);
    // null otherwise
    updateIfUnchanged(orderId, updatedAt, update, session) {
        return Order.findOneAndUpdate({ _id: orderId, updatedAt }, update, {
            returnDocument: 'after',
            runValidators: true,
            session
        }).lean();
    }

    async findPaginated(filter = {}, page = 1, limit = 10, { withCustomer = false } = {}) {
        const skip = (page - 1) * limit;
        let query = Order.find(filter, LIST_PROJECTION).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
        if (withCustomer) query = query.populate('user', CUSTOMER_FIELDS);
        const [data, total] = await Promise.all([query.lean(), Order.countDocuments(filter)]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // [{ _id: status, count }]
    countByStatus() {
        return Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]);
    }

    countSince(date) {
        return Order.countDocuments({ createdAt: { $gte: date } });
    }

    async countItemsWithStatus(statuses) {
        const [result] = await Order.aggregate([
            { $match: { 'items.status': { $in: statuses } } },
            { $unwind: '$items' },
            { $match: { 'items.status': { $in: statuses } } },
            { $count: 'count' }
        ]);
        return result?.count || 0;
    }

    // One row per order item in `statuses` (newest request first), with the order and customer basics
    async findItemsWithStatusPaginated(statuses, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [result] = await Order.aggregate([
            { $match: { 'items.status': { $in: statuses } } },
            { $unwind: '$items' },
            { $match: { 'items.status': { $in: statuses } } },
            { $sort: { 'items.return.requestedAt': -1, _id: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'customer',
                                pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } }]
                            }
                        },
                        {
                            $project: {
                                orderId: '$_id',
                                orderNumber: 1,
                                orderStatus: 1,
                                paymentMethod: 1,
                                deliveredAt: 1,
                                item: '$items',
                                customer: { $first: '$customer' },
                                shippingName: '$shippingAddress.fullName'
                            }
                        }
                    ],
                    total: [{ $count: 'count' }]
                }
            }
        ]);
        const total = result?.total[0]?.count || 0;
        return { data: result?.data || [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ---- Admin reports. A sale is dated by its delivery (orders delivered before deliveredAt existed: placed date).

    // [{ $match }, saleDate / returnedAmount / units fields, saleDate in [start, end)]
    salesPipeline(filter, { start, end }) {
        return [
            { $match: filter },
            { $addFields: { saleDate: { $ifNull: ['$deliveredAt', '$createdAt'] } } },
            { $match: { saleDate: { $gte: start, $lt: end } } },
            { $addFields: SALE_FIELDS }
        ];
    }

    // { orders, gross, discount, shipping, returnedAmount, units, unitsReturned }
    async salesSummary(filter, range) {
        const [result] = await Order.aggregate([
            ...this.salesPipeline(filter, range),
            {
                $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    gross: { $sum: '$pricing.total' },
                    discount: { $sum: '$pricing.discount' },
                    shipping: { $sum: '$pricing.shipping' },
                    returnedAmount: { $sum: '$returnedAmount' },
                    units: { $sum: '$units' },
                    unitsReturned: { $sum: '$unitsReturned' }
                }
            }
        ]);
        return result || { orders: 0, gross: 0, discount: 0, shipping: 0, returnedAmount: 0, units: 0, unitsReturned: 0 };
    }

    // [{ _id: bucket key, orders, gross, returnedAmount }] for one $dateToString format
    salesTimeline(filter, range, format, timezone) {
        return Order.aggregate([
            ...this.salesPipeline(filter, range),
            {
                $group: {
                    _id: { $dateToString: { format, date: '$saleDate', timezone } },
                    orders: { $sum: 1 },
                    gross: { $sum: '$pricing.total' },
                    returnedAmount: { $sum: '$returnedAmount' }
                }
            }
        ]);
    }

    // Newest sale first, with the customer (the PDF export asks for one big page)
    async salesPaginated(filter, range, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [result] = await Order.aggregate([
            ...this.salesPipeline(filter, range),
            { $sort: { saleDate: -1, _id: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: 'customer',
                                pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
                            }
                        },
                        {
                            $project: {
                                orderNumber: 1,
                                orderStatus: 1,
                                paymentMethod: 1,
                                saleDate: 1,
                                createdAt: 1,
                                pricing: 1,
                                returnedAmount: 1,
                                units: 1,
                                unitsReturned: 1,
                                itemCount: { $size: '$items' },
                                customer: { $first: '$customer' },
                                shippingName: '$shippingAddress.fullName'
                            }
                        }
                    ],
                    total: [{ $count: 'count' }]
                }
            }
        ]);
        const total = result?.total[0]?.count || 0;
        return { data: result?.data || [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Best sellers by kept units: [{ _id: productId, name, units, revenue }]
    topProducts(filter, range, limit = 5) {
        return Order.aggregate([
            ...this.salesPipeline(filter, range),
            { $unwind: '$items' },
            { $match: { 'items.status': { $nin: ['cancelled', 'returned'] } } },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    image: { $first: '$items.image' },
                    units: { $sum: '$items.quantity' },
                    revenue: { $sum: '$items.lineTotal' }
                }
            },
            { $sort: { units: -1, revenue: -1 } },
            { $limit: limit }
        ]);
    }

    // Orders placed (by createdAt): [{ _id: bucket key, orders, amount }]
    placedTimeline(filter, format, timezone) {
        return Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format, date: '$createdAt', timezone } },
                    orders: { $sum: 1 },
                    amount: { $sum: '$pricing.total' }
                }
            }
        ]);
    }

    // [{ _id: paymentMethod, orders, amount }]
    countByPaymentMethod(filter) {
        return Order.aggregate([{ $match: filter }, { $group: { _id: '$paymentMethod', orders: { $sum: 1 }, amount: { $sum: '$pricing.total' } } }]);
    }

    // Latest orders with the customer (dashboard)
    findRecent(filter, limit = 5) {
        return Order.find(filter, { orderNumber: 1, orderStatus: 1, paymentMethod: 1, pricing: 1, createdAt: 1, user: 1, 'shippingAddress.fullName': 1 })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .populate('user', CUSTOMER_FIELDS)
            .lean();
    }
}

module.exports = new OrderRepository();
