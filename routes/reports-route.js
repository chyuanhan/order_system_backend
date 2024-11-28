const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/check-auth');

// get current month report (default display)
router.get('/current-month', auth, reportController.getCurrentMonthReport);

// generate monthly report
router.get('/monthly', auth, reportController.generateMonthlyReport);

// generate yearly report
router.get('/yearly', auth, reportController.generateYearlyReport);

// generate custom date range report
router.get('/custom', auth, reportController.generateCustomReport);

// get all reports list
router.get('/', auth, reportController.getAllReports);

// download specific report
router.get('/download/:id', auth, reportController.downloadReport);

module.exports = router;
