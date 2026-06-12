const { Cart, CartItem, Product } = require('../models');

// Helper to get or create user's/guest's cart
const getOrCreateCart = async (userId, sessionId) => {
  const whereClause = userId ? { userId } : { sessionId };
  
  let cart = await Cart.findOne({
    where: whereClause,
    include: [{
      model: CartItem,
      as: 'items',
      include: [{ model: Product, as: 'product' }]
    }]
  });

  if (!cart) {
    cart = await Cart.create(userId ? { userId } : { sessionId });
    // Reload to get association fields empty array
    cart = await Cart.findByPk(cart.id, {
      include: [{
        model: CartItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }]
    });
  }
  return cart;
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;
    const cart = await getOrCreateCart(userId, sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cart = await getOrCreateCart(userId, sessionId);
    
    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity);
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: parseInt(quantity)
      });
    }

    // Fetch updated cart
    const updatedCart = await getOrCreateCart(userId, sessionId);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await getOrCreateCart(userId, sessionId);

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    cartItem.quantity = parseInt(quantity);
    await cartItem.save();

    const updatedCart = await getOrCreateCart(userId, sessionId);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;
    const { productId } = req.params;

    const cart = await getOrCreateCart(userId, sessionId);

    const cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();

    const updatedCart = await getOrCreateCart(userId, sessionId);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;
    const cart = await getOrCreateCart(userId, sessionId);

    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    const updatedCart = await getOrCreateCart(userId);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
