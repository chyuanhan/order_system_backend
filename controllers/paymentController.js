const Payment = require('../models/Payment');
const Order = require('../models/Order');

// helper function: round number to two decimal places
const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

// create payment record
exports.createPayment = async (req, res) => {
  try {
    const {
      orderId,
      tableId,
      totalAmount,
      amountPaid,
      change,
      paymentMethod,
      status
    } = req.body;

    // find all unpaid orders for this table
    const unpaidOrders = await Order.find({
      tableId: tableId,
      status: { $ne: 'paid' }
    });

    // create new payment record, including all related orders
    const newPayment = new Payment({
      orderId, // main order ID
      relatedOrders: unpaidOrders.map(order => order._id), // all related orders ID
      tableId,
      totalAmount: roundToTwo(totalAmount),
      amountPaid: roundToTwo(amountPaid),
      change: roundToTwo(change),
      paymentMethod,
      status
    });

    // update status of all unpaid orders
    const updatePromises = unpaidOrders.map(order =>
      Order.findByIdAndUpdate(order._id, {
        status: 'paid',
        updatedAt: Date.now()
      })
    );

    // save payment record and update status of all orders
    const [savedPayment] = await Promise.all([
      newPayment.save(),
      ...updatePromises
    ]);

    // return full payment information
    const populatedPayment = await Payment.findById(savedPayment._id)
      .populate('orderId', 'status createdAt')
      .populate('relatedOrders', 'status createdAt');

    res.status(201).json({
      payment: populatedPayment,
      updatedOrders: unpaidOrders.length
    });

  } catch (error) {
    console.error('Create payment record failed:', error);
    res.status(400).json({ message: 'Create payment record failed', error: error.message });
  }
};

// get all payment records (support filtering)
exports.getAllPayments = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;

    // build query conditions
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(query)
      .populate('orderId', 'status createdAt')
      .sort({ createdAt: -1 });

    // format return data, ensure amount is two decimal places
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      orderId: payment.orderId?._id,
      tableId: payment.tableId,
      totalAmount: roundToTwo(payment.totalAmount),
      amountPaid: roundToTwo(payment.amountPaid),
      change: roundToTwo(payment.change),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      orderStatus: payment.orderId?.status,
      orderCreatedAt: payment.orderId?.createdAt
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Get payment records failed:', error);
    res.status(500).json({ message: 'Get payment records failed', error: error.message });
  }
};

// get specific payment record
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('orderId', 'status createdAt');

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // format return data, ensure amount is two decimal places
    const formattedPayment = {
      id: payment._id,
      orderId: payment.orderId?._id,
      tableId: payment.tableId,
      totalAmount: roundToTwo(payment.totalAmount),
      amountPaid: roundToTwo(payment.amountPaid),
      change: roundToTwo(payment.change),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      orderStatus: payment.orderId?.status,
      orderCreatedAt: payment.orderId?.createdAt
    };

    res.json(formattedPayment);
  } catch (error) {
    console.error('Get payment record failed:', error);
    res.status(500).json({ message: 'Get payment record failed', error: error.message });
  }
}; 