const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  relatedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  tableId: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    get: v => Math.round(v * 100) / 100
  },
  amountPaid: {
    type: Number,
    required: true,
    get: v => Math.round(v * 100) / 100
  },
  change: {
    type: Number,
    required: true,
    get: v => Math.round(v * 100) / 100
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// 保存前处理
paymentSchema.pre('save', function (next) {
  this.totalAmount = Math.round(this.totalAmount * 100) / 100;
  this.amountPaid = Math.round(this.amountPaid * 100) / 100;
  this.change = Math.round(this.change * 100) / 100;
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 