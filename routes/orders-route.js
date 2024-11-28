const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/check-auth');

// create new order
router.post('/', orderController.createOrder);

// get all unpaid orders
router.get('/unpaid', orderController.getAllOrders);

// get all orders
router.get('/', orderController.getAllOrders);

// get specific order details
router.get('/:id', auth, orderController.getOrderById);

// update order status
router.put('/:id', auth, orderController.updateOrderById);

// delete order
router.delete('/:id', auth, orderController.deleteOrderById);

module.exports = router;
