const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// create new order
exports.createOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;

    // validate all menu item IDs are valid
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ message: 'MenuItem ID is invalid' });
    }

    // calculate total amount and create order items
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      totalAmount += menuItem.price * item.quantity;
      return {
        menuItem: item.menuItemId,
        quantity: item.quantity
      };
    });

    const newOrder = new Order({
      tableId,
      items: orderItems,
      totalAmount
    });

    const savedOrder = await newOrder.save();

    // use populate to get full order information
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('items.menuItem', 'name price description imageUrl category');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create order failed:', error);
    res.status(400).json({ message: 'Create order failed', error: error.message });
  }
};

// get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, unpaid } = req.query;

    // build query conditions
    const query = {};

    // if status parameter is specified, add to query conditions
    if (status) {
      query.status = status;
    }

    // if request for unpaid orders
    if (unpaid === 'true') {
      query.status = { $ne: 'paid' };  // status is not 'paid'
    }

    const orders = await Order.find(query)
      .populate({
        path: 'items.menuItem',
        select: 'name price description imageUrl category'
      })
      .select('id tableId items totalAmount status createdAt')
      .sort({ createdAt: -1 });

    // format return data
    const formattedOrders = orders.map(order => ({
      id: order._id,
      tableId: order.tableId,
      items: order.items
        .filter(item => item.menuItem)
        .map(item => ({
          id: item._id,
          menuItem: {
            id: item.menuItem._id,
            name: item.menuItem.name || '',
            price: item.menuItem.price || 0,
            description: item.menuItem.description || '',
            imageUrl: item.menuItem.imageUrl || '',
            category: item.menuItem.category || ''
          },
          quantity: item.quantity
        })),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get order list failed:', error);
    console.error('Specific error:', error.stack);
    res.status(500).json({ message: 'Get order list failed', error: error.message });
  }
};

// get specific order details
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('id tableId items totalAmount status createdAt');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Get order details failed', error: error.message });
  }
};

// update order status
exports.updateOrderById = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, select: 'id tableId items totalAmount status updatedAt' }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Update order failed', error: error.message });
  }
};

// delete order
exports.deleteOrderById = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete order failed', error: error.message });
  }
};
