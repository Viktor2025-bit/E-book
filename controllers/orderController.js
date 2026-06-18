const { Order, OrderItem, Cart, CartItem, Product, sequelize } = require('../models');
const axios = require('axios');

const toOrderResponse = (order) => {
  if (!order) return order;
  const json = order.toJSON ? order.toJSON() : order;
  return {
    ...json,
    accessEmail: json.shippingAddress
  };
};

exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { contactEmail, paymentMethod, reference } = req.body;
    const accessEmail = contactEmail || req.user.email;

    if (!reference) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Payment reference is required' });
    }
    if (!process.env.PAYSTACK_SECRET_KEY) {
      await transaction.rollback();
      return res.status(503).json({ message: 'Paystack secret key is not configured.' });
    }

    // Verify Paystack payment
    try {
      const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });

      if (!paystackRes.data.status || paystackRes.data.data.status !== 'success') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    } catch (err) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Payment verification error' });
    }

    // Find the cart
    const cart = await Cart.findOne({
      where: { userId },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }]
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const price = parseFloat(item.product.price);
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: price
      });
    }

    // Create the order
    const order = await Order.create({
      userId,
      totalAmount,
      shippingAddress: accessEmail,
      paymentMethod: paymentMethod || 'Paystack',
      status: 'Paid'
    }, { transaction });

    // Create order items
    const orderItems = orderItemsData.map(item => ({
      ...item,
      orderId: order.id
    }));
    await OrderItem.bulkCreate(orderItems, { transaction });

    // Clear the cart
    await CartItem.destroy({
      where: { cartId: cart.id }
    }, { transaction });

    await transaction.commit();

    // Fetch the completed order with items and product details
    const completedOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }]
    });

    res.status(201).json(toOrderResponse(completedOrder));
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders.map(toOrderResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(toOrderResponse(order));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
