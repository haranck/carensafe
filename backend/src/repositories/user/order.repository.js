const mongoose = require('mongoose');
const Order = require('../../models/order.model');

const CUSTOMER_FIELDS = 'firstName lastName email phone';
// Lists don't need the full history
const LIST_PROJECTION = { statusHistory: 0, razorpay: 0 };

// Shared by the user order service and the admin order service
class OrderRepository {
    // Runs `work(session)` in a transaction (Atlas replica set); retried by the driver on transient errors
    runInTransaction(work) {
        return mongoose.connection.transaction(work);
    }

    async create(orderData, session) {
        const [order] = await Order.create([orderData], { session });
        return order.toObject();
    }

    existsByNumber(orderNumber) {
        return Order.exists({ orderNumber });
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
}

module.exports = new OrderRepository();
