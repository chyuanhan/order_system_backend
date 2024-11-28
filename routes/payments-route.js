const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/check-auth');

// create new payment
router.post('/', auth, paymentController.createPayment);

// get all payments
router.get('/', auth, paymentController.getAllPayments);

// get specific payment details
router.get('/:id', auth, paymentController.getPaymentById);

module.exports = router; 