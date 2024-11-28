const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'monthly', 'yearly', 'custom'],
    required: true
  },
  dateRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0
  },
  dailySales: {
    type: Map,
    of: Number,
    default: new Map()
  },
  totalOrders: {
    type: Number,
    required: true,
    default: 0
  },
  salesByCategory: {
    type: Map,
    of: new mongoose.Schema({
      quantity: {
        type: Number,
        required: true,
        default: 0
      },
      amount: {
        type: Number,
        required: true,
        default: 0
      }
    }, { _id: false })
  },
  details: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    items: {
      type: Number,
      required: true,
      default: 0
    },
    date: {
      type: Date,
      required: true
    }
  }],
  monthlySalesData: [{
    month: {
      type: String,
      required: true,
      match: /^(0[1-9]|1[0-2])$/
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);

