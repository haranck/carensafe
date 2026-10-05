const orderRepository = require('../../../repositories/user/order.repository');
const productRepository = require('../../../repositories/user/product.repository');
const userRepository = require('../../../repositories/user/user.repository');
const {
    REPORT_TIMEZONE,
    DAY_MS,
    SALE_STATUSES,
    UNPLACED_STATUSES,
    BUCKET_FORMATS,
    startOfIstDay,
    bucketKeys,
    periodRange,
    roundMoney,
    percentChange
} = require('../../../utils/report');

// Dashboard window: the last 30 days (today included), compared with the 30 days before
const DASHBOARD_DAYS = 30;
const LOW_STOCK_THRESHOLD = 10;
// Rows in one PDF export
const EXPORT_MAX_ROWS = 5000;

const SALES_FILTER = { orderStatus: { $in: SALE_STATUSES } };

const placedFilter = ({ start, end }) => ({ orderStatus: { $nin: UNPLACED_STATUSES }, createdAt: { $gte: start, $lt: end } });

// Totals of the sales in a window; net = what was kept after returns
const toSummary = (totals) => {
    const net = roundMoney(totals.gross - totals.returnedAmount);
    return {
        orders: totals.orders,
        gross: roundMoney(totals.gross),
        discount: roundMoney(totals.discount),
        shipping: roundMoney(totals.shipping),
        returnedAmount: roundMoney(totals.returnedAmount),
        net,
        units: totals.units,
        unitsReturned: totals.unitsReturned,
        avgOrderValue: totals.orders ? roundMoney(net / totals.orders) : 0
    };
};

// One row per bucket in the window, zeros where nothing happened
const fillTimeline = (keys, rows, toPoint) => {
    const byKey = new Map(rows.map((row) => [row._id, row]));
    return keys.map((key) => ({ key, ...toPoint(byKey.get(key)) }));
};

const salePoint = (row) => ({
    orders: row?.orders || 0,
    gross: roundMoney(row?.gross),
    returnedAmount: roundMoney(row?.returnedAmount),
    net: roundMoney((row?.gross || 0) - (row?.returnedAmount || 0))
});

const customerName = (row) => {
    const name = [row.customer?.firstName, row.customer?.lastName].filter(Boolean).join(' ');
    return name || row.shippingName || 'Deleted user';
};

const toSaleRow = (row) => ({
    _id: row._id,
    orderNumber: row.orderNumber,
    orderStatus: row.orderStatus,
    paymentMethod: row.paymentMethod,
    orderedAt: row.createdAt,
    deliveredAt: row.saleDate,
    customer: { name: customerName(row), email: row.customer?.email || null },
    itemCount: row.itemCount,
    units: row.units,
    unitsReturned: row.unitsReturned,
    subtotal: roundMoney(row.pricing.subtotal),
    discount: roundMoney(row.pricing.discount),
    shipping: roundMoney(row.pricing.shipping),
    total: roundMoney(row.pricing.total),
    returnedAmount: roundMoney(row.returnedAmount),
    net: roundMoney(row.pricing.total - row.returnedAmount)
});

const toTopProduct = (row) => ({ productId: row._id, name: row.name, image: row.image, units: row.units, revenue: roundMoney(row.revenue) });

// The window a report covers, as shown to the admin (inclusive end)
const toRangeInfo = (period, { start, end, unit }) => ({ period, from: start, to: new Date(end.getTime() - 1), unit });

class AdminReportService {
    async getDashboard() {
        const end = new Date(startOfIstDay(new Date()).getTime() + DAY_MS);
        const current = { start: new Date(end.getTime() - DASHBOARD_DAYS * DAY_MS), end };
        const previous = { start: new Date(current.start.getTime() - DASHBOARD_DAYS * DAY_MS), end: current.start };
        const userFilter = ({ start, end: until }) => ({ isAdmin: { $ne: true }, createdAt: { $gte: start, $lt: until } });

        const [
            salesNow,
            salesBefore,
            placedNow,
            placedBefore,
            customersNow,
            customersBefore,
            salesByDay,
            placedByDay,
            byStatus,
            topProducts,
            recentOrders,
            lowStock
        ] = await Promise.all([
            orderRepository.salesSummary(SALES_FILTER, current),
            orderRepository.salesSummary(SALES_FILTER, previous),
            orderRepository.countByPaymentMethod(placedFilter(current)),
            orderRepository.countByPaymentMethod(placedFilter(previous)),
            userRepository.count(userFilter(current)),
            userRepository.count(userFilter(previous)),
            orderRepository.salesTimeline(SALES_FILTER, current, BUCKET_FORMATS.day, REPORT_TIMEZONE),
            orderRepository.placedTimeline(placedFilter(current), BUCKET_FORMATS.day, REPORT_TIMEZONE),
            orderRepository.countByStatus(),
            orderRepository.topProducts(SALES_FILTER, current, 5),
            orderRepository.findRecent({ orderStatus: { $nin: UNPLACED_STATUSES } }, 6),
            productRepository.findLowStockVariants(LOW_STOCK_THRESHOLD, 6)
        ]);

        const now = toSummary(salesNow);
        const before = toSummary(salesBefore);
        const ordersNow = placedNow.reduce((total, row) => total + row.orders, 0);
        const ordersBefore = placedBefore.reduce((total, row) => total + row.orders, 0);

        const keys = bucketKeys(current.start, current.end, 'day');
        const salesPoints = new Map(fillTimeline(keys, salesByDay, salePoint).map((point) => [point.key, point]));
        const placedPoints = new Map(placedByDay.map((row) => [row._id, row]));

        return {
            range: { from: current.start, to: new Date(current.end.getTime() - 1), days: DASHBOARD_DAYS },
            kpis: {
                netRevenue: { value: now.net, change: percentChange(now.net, before.net) },
                salesOrders: { value: now.orders, change: percentChange(now.orders, before.orders) },
                avgOrderValue: { value: now.avgOrderValue, change: percentChange(now.avgOrderValue, before.avgOrderValue) },
                ordersPlaced: { value: ordersNow, change: percentChange(ordersNow, ordersBefore) },
                newCustomers: { value: customersNow, change: percentChange(customersNow, customersBefore) },
                unitsSold: { value: now.units, change: percentChange(now.units, before.units) }
            },
            summary: now,
            timeline: keys.map((key) => ({
                key,
                net: salesPoints.get(key).net,
                salesOrders: salesPoints.get(key).orders,
                ordersPlaced: placedPoints.get(key)?.orders || 0
            })),
            byStatus: byStatus.map(({ _id, count }) => ({ status: _id, count })).sort((a, b) => b.count - a.count),
            byPaymentMethod: placedNow
                .map(({ _id, orders, amount }) => ({ method: _id, orders, amount: roundMoney(amount) }))
                .sort((a, b) => b.orders - a.orders),
            topProducts: topProducts.map(toTopProduct),
            recentOrders: recentOrders.map((order) => ({
                _id: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                paymentMethod: order.paymentMethod,
                total: roundMoney(order.pricing.total),
                createdAt: order.createdAt,
                customer: customerName({ customer: order.user, shippingName: order.shippingAddress?.fullName })
            })),
            lowStock: { threshold: LOW_STOCK_THRESHOLD, variants: lowStock }
        };
    }

    // Delivered (and partially returned) orders in the period: totals, a chart series, top products and one page of rows
    async getSalesReport({ period, from, to, page, limit }) {
        const range = periodRange(period, { from, to });
        const [totals, timeline, topProducts, rows] = await Promise.all([
            orderRepository.salesSummary(SALES_FILTER, range),
            orderRepository.salesTimeline(SALES_FILTER, range, BUCKET_FORMATS[range.unit], REPORT_TIMEZONE),
            orderRepository.topProducts(SALES_FILTER, range, 10),
            orderRepository.salesPaginated(SALES_FILTER, range, page, limit)
        ]);
        return {
            range: toRangeInfo(period, range),
            summary: toSummary(totals),
            timeline: fillTimeline(bucketKeys(range.start, range.end, range.unit), timeline, salePoint),
            topProducts: topProducts.map(toTopProduct),
            orders: { ...rows, data: rows.data.map(toSaleRow) }
        };
    }

    // Everything the PDF needs: totals, top products and every row (up to EXPORT_MAX_ROWS)
    async exportSalesReport({ period, from, to }) {
        const range = periodRange(period, { from, to });
        const [totals, topProducts, rows] = await Promise.all([
            orderRepository.salesSummary(SALES_FILTER, range),
            orderRepository.topProducts(SALES_FILTER, range, 10),
            orderRepository.salesPaginated(SALES_FILTER, range, 1, EXPORT_MAX_ROWS)
        ]);
        return {
            range: toRangeInfo(period, range),
            summary: toSummary(totals),
            topProducts: topProducts.map(toTopProduct),
            orders: rows.data.map(toSaleRow),
            truncated: rows.total > EXPORT_MAX_ROWS,
            generatedAt: new Date()
        };
    }
}

module.exports = new AdminReportService();
