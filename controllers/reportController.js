const Report = require('../models/Report');
const Order = require('../models/Order');
const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');
const mongoose = require('mongoose');

// get current month sales report (default display)
exports.getCurrentMonthReport = async (req, res) => {
  try {
    const today = moment();
    const startOfMonth = moment().startOf('month');

    const report = await generateSalesReport(startOfMonth, today, 'monthly');

    // ensure all required fields are returned
    const populatedReport = await Report.findById(report._id)
      .select('type dateRange totalSales monthlySalesData dailySales totalOrders salesByCategory details createdAt')
      .lean();  // use lean() to improve performance

    if (!populatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(populatedReport);
  } catch (error) {
    console.error('Get current month report failed:', error);
    res.status(500).json({ message: 'Get current month report failed', error: error.message });
  }
};

// generate monthly report
exports.generateMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = moment(`${year}-${month}-01`);
    const endDate = moment(startDate).endOf('month');

    const report = await generateSalesReport(startDate, endDate, 'monthly');

    const populatedReport = await Report.findById(report._id)
      .select('_id type dateRange totalSales monthlySalesData dailySales totalOrders salesByCategory details createdAt')
      .lean();

    res.json(populatedReport);
  } catch (error) {
    console.error('Generate monthly report failed:', error);
    res.status(500).json({ message: 'Generate monthly report failed', error: error.message });
  }
};

// generate yearly report
exports.generateYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = moment(`${year}-01-01`);
    const endDate = moment(startDate).endOf('year');

    const report = await generateSalesReport(startDate, endDate, 'yearly');

    const populatedReport = await Report.findById(report._id)
      .select('_id type dateRange totalSales monthlySalesData dailySales totalOrders salesByCategory details createdAt')
      .lean();

    res.json(populatedReport);
  } catch (error) {
    console.error('Generate yearly report failed:', error);
    res.status(500).json({ message: 'Generate yearly report failed', error: error.message });
  }
};

// generate custom date range report
exports.generateCustomReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = moment(startDate);
    const end = moment(endDate);

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const report = await generateSalesReport(start, end, 'custom');

    const populatedReport = await Report.findById(report._id)
      .select('type dateRange totalSales monthlySales dailySales totalOrders salesByCategory details createdAt')
      .lean();

    res.json(populatedReport);
  } catch (error) {
    console.error('Generate custom report failed:', error);
    res.status(500).json({ message: 'Generate custom report failed', error: error.message });
  }
};

// get all generated reports list
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .select('type dateRange totalSales totalOrders createdAt');
    res.json(reports);
  } catch (error) {
    console.error('Get reports list failed:', error);
    res.status(500).json({ message: 'Get reports list failed', error: error.message });
  }
};

// download specific report
exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const filePath = path.join(__dirname, '..', 'reports', `${report.id}.pdf`);
    if (await fs.access(filePath).then(() => true).catch(() => false)) {
      res.download(filePath);
    } else {
      res.status(404).json({ message: 'Report file not found' });
    }
  } catch (error) {
    console.error('Download report failed:', error);
    res.status(500).json({ message: 'Download report failed', error: error.message });
  }
};

// helper function: generate sales report
async function generateSalesReport(startDate, endDate, type) {
  try {
    // first check if there is already a report with the same date range and type
    const existingReport = await Report.findOne({
      type,
      'dateRange.start': {
        $gte: startDate.startOf('day').toDate(),
        $lte: startDate.endOf('day').toDate()
      },
      'dateRange.end': {
        $gte: endDate.startOf('day').toDate(),
        $lte: endDate.endOf('day').toDate()
      }
    });

    if (existingReport) {
      // if report exists, update its data
      const updatedData = await calculateReportData(startDate, endDate, type);
      const updatedReport = await Report.findByIdAndUpdate(
        existingReport._id,
        updatedData,
        { new: true }
      );
      return updatedReport;
    }

    // if no report exists, calculate data and create a new report
    const reportData = await calculateReportData(startDate, endDate, type);
    const report = new Report(reportData);
    await report.save();
    return report;
  } catch (error) {
    console.error('Generate report failed:', error);
    throw error;
  }
}

// helper function: calculate report data
async function calculateReportData(startDate, endDate, type) {
  try {
    // get all paid orders (for total sales calculation)
    const allPaidOrders = await Order.find({
      status: 'paid'
    });

    // get current month orders
    const currentMonthStart = moment().startOf('month');
    const currentMonthEnd = moment().endOf('month');
    const monthlyOrders = await Order.find({
      status: 'paid',
      updatedAt: {
        $gte: currentMonthStart.toDate(),
        $lte: currentMonthEnd.toDate()
      }
    });

    // get daily orders and group by date
    const dailyOrdersAggregation = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          updatedAt: {
            $gte: currentMonthStart.toDate(),
            $lte: currentMonthEnd.toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" }
          },
          dailyTotal: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);

    // calculate daily total sales
    const dailySalesMap = {};
    dailyOrdersAggregation.forEach(day => {
      const date = moment()
        .year(day._id.year)
        .month(day._id.month - 1)
        .date(day._id.day)
        .format('YYYY-MM-DD');
      dailySalesMap[date] = Number(day.dailyTotal.toFixed(2));
    });

    // calculate total sales
    const totalSales = Number(allPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2));
    const monthlySales = Number(monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2));


    // get orders for the report period
    const periodOrders = await Order.find({
      status: 'paid',
      updatedAt: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    }).populate({
      path: 'items.menuItem',
      select: 'name price category'
    });

    // calculate sales by category
    const salesByCategory = {};
    periodOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.menuItem && item.menuItem.category) {
          const categoryId = item.menuItem.category.toString();
          if (!salesByCategory[categoryId]) {
            salesByCategory[categoryId] = {
              quantity: 0,
              amount: 0
            };
          }
          const itemPrice = Number(item.price || item.menuItem.price || 0);
          const itemQuantity = Number(item.quantity || 0);
          salesByCategory[categoryId].quantity += itemQuantity;
          salesByCategory[categoryId].amount += itemPrice * itemQuantity;
        }
      });
    });

    // ensure all amounts are valid numbers and rounded to two decimal places
    Object.keys(salesByCategory).forEach(categoryId => {
      salesByCategory[categoryId].amount = Number(salesByCategory[categoryId].amount.toFixed(2));
      salesByCategory[categoryId].quantity = Number(salesByCategory[categoryId].quantity);
    });

    // calculate monthlySalesData
    let monthlySalesData = [];
    const monthlyOrdersAggregation = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          updatedAt: {
            $gte: type === 'yearly' ? startDate.toDate() : startDate.clone().startOf('year').toDate(),
            $lte: type === 'yearly' ? endDate.toDate() : startDate.clone().endOf('year').toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$updatedAt" }
          },
          amount: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {
          "_id.month": 1
        }
      }
    ]);

    // generate all months data (1-12 months)
    monthlySalesData = Array.from({ length: 12 }, (_, i) => {
      const monthNum = (i + 1).toString().padStart(2, '0');
      const monthData = monthlyOrdersAggregation.find(m => m._id.month === (i + 1));
      return {
        month: monthNum,
        amount: monthData ? Number(monthData.amount.toFixed(2)) : 0
      };
    });

    // if it's a monthly report, only keep the requested month's data
    if (type === 'monthly') {
      const requestedMonth = startDate.month() + 1;
      monthlySalesData = monthlySalesData.filter(data =>
        parseInt(data.month) === requestedMonth
      );
    }

    return {
      type,
      dateRange: {
        start: startDate.toDate(),
        end: endDate.toDate()
      },
      totalSales,
      totalOrders: periodOrders.length,
      monthlySalesData,
      dailySales: dailySalesMap,
      salesByCategory,
      details: periodOrders.map(order => ({
        orderId: order._id,
        amount: Number(order.totalAmount.toFixed(2)),
        items: order.items.length,
        date: order.createdAt,
        _id: new mongoose.Types.ObjectId() // generate new _id for each detail item
      }))
    };
  } catch (error) {
    console.error('Calculate report data failed:', error);
    throw error;
  }
}

