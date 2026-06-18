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

const getUserCart = (userId) => Cart.findOne({
  where: { userId },
  include: [{
    model: CartItem,
    as: 'items',
    include: [{ model: Product, as: 'product' }]
  }]
});

const getCartTotal = (cart) => cart.items.reduce((sum, item) => {
  const price = parseFloat(item.product.price);
  return sum + (price * item.quantity);
}, 0);

exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactEmail } = req.body;
    const accessEmail = contactEmail || req.user.email;

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ message: 'Paystack secret key is not configured.' });
    }
    if (!accessEmail) {
      return res.status(400).json({ message: 'Access email is required.' });
    }

    const cart = await getUserCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalAmount = getCartTotal(cart);
    const callbackUrl = `${req.protocol}://${req.get('host')}/cart.html`;
    const paystackRes = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: accessEmail,
      amount: Math.round(totalAmount * 100),
      currency: 'NGN',
      callback_url: callbackUrl,
      metadata: {
        userId,
        accessEmail,
        source: 'BEMS Books checkout'
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paystackRes.data.status || !paystackRes.data.data.authorization_url) {
      return res.status(400).json({ message: paystackRes.data.message || 'Could not initialize Paystack checkout.' });
    }

    res.json({
      authorizationUrl: paystackRes.data.data.authorization_url,
      accessCode: paystackRes.data.data.access_code,
      reference: paystackRes.data.data.reference
    });
  } catch (error) {
    const message = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message;
    res.status(500).json({ message });
  }
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
    const cart = await getUserCart(userId);

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
