const express = require('express');
const router = express.Router();
const adminReportController = require('../../controllers/admin/report/admin.report.controller');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const { validateSalesQuery, validateSalesExportQuery } = require('../../middlewares/admin.report.validation');

// Every route here needs an admin login
router.use(adminAuthMiddleware);

router.get('/dashboard', (req, res) => adminReportController.getDashboard(req, res));
router.get('/sales', validateSalesQuery, (req, res) => adminReportController.getSalesReport(req, res));
router.get('/sales/export', validateSalesExportQuery, (req, res) => adminReportController.exportSalesReport(req, res));

module.exports = router;
