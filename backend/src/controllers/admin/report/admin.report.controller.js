const adminReportService = require('../../../services/admin/report/admin.report.service');

const fail = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};

// period (daily | weekly | monthly | yearly | custom) + from / to for custom (validated in the route)
const periodQuery = (query) => ({
    period: query.period || 'monthly',
    from: query.from || '',
    to: query.to || ''
});

class AdminReportController {
    async getDashboard(req, res) {
        try {
            const dashboard = await adminReportService.getDashboard();
            return res.status(200).json({ success: true, message: 'Dashboard retrieved successfully', data: dashboard });
        } catch (error) {
            return fail(res, error);
        }
    }

    async getSalesReport(req, res) {
        try {
            const { orders, ...report } = await adminReportService.getSalesReport({
                ...periodQuery(req.query),
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            });
            return res.status(200).json({
                success: true,
                message: 'Sales report retrieved successfully',
                data: { ...report, orders: orders.data },
                pagination: {
                    total: orders.total,
                    page: orders.page,
                    limit: orders.limit,
                    totalPages: orders.totalPages
                }
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async exportSalesReport(req, res) {
        try {
            const report = await adminReportService.exportSalesReport(periodQuery(req.query));
            return res.status(200).json({ success: true, message: 'Sales report exported successfully', data: report });
        } catch (error) {
            return fail(res, error);
        }
    }
}

module.exports = new AdminReportController();
