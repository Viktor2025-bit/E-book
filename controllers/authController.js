const { User, Cart, CartItem } = require('../models');
const bcrypt = require('bcryptjs');

const mergeGuestCartIntoUserCart = async (sessionId, userId) => {
  if (!sessionId || !userId) return;

  const guestCart = await Cart.findOne({
    where: { sessionId },
    include: [{ model: CartItem, as: 'items' }],
  });

  if (!guestCart || !guestCart.items || guestCart.items.length === 0) return;

  let userCart = await Cart.findOne({ where: { userId } });
  if (!userCart) {
    await guestCart.update({ userId, sessionId: null });
    return;
  }

  for (const item of guestCart.items) {
    const existingItem = await CartItem.findOne({
      where: { cartId: userCart.id, productId: item.productId },
    });

    if (existingItem) {
      existingItem.quantity += item.quantity;
      await existingItem.save();
      await item.destroy();
    } else {
      await item.update({ cartId: userCart.id });
    }
  }

  await guestCart.destroy();
};

exports.mergeGuestCartIntoUserCart = mergeGuestCartIntoUserCart;

const userInitials = (user) => {
  const name = (user.displayName || '').trim();
  const nameParts = name.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  if (nameParts.length === 1 && nameParts[0].length >= 2) return nameParts[0].slice(0, 2).toUpperCase();

  const localPart = (user.email || '').split('@')[0].replace(/[^a-z]/gi, '');
  if (/^kalu.*victor/i.test(localPart)) return 'KV';
  return (localPart.slice(0, 2) || 'BB').toUpperCase();
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const guestSessionId = req.sessionID;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({ 
      displayName: username, 
      email, 
      password: hashedPassword 
    });
    
    req.login(user, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      try {
        await mergeGuestCartIntoUserCart(guestSessionId, user.id);
      } catch (mergeError) {
        return res.status(500).json({ error: mergeError.message });
      }
      return res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, displayName: user.displayName, email: user.email }
      });
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const guestSessionId = req.sessionID;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Log user in using session or passport if needed, or return session info
    // If passport local strategy isn't set up, we can establish session manually:
    req.login(user, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      try {
        await mergeGuestCartIntoUserCart(guestSessionId, user.id);
      } catch (mergeError) {
        return res.status(500).json({ error: mergeError.message });
      }
      return res.json({ 
        message: 'Login successful', 
        user: { id: user.id, displayName: user.displayName, email: user.email } 
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.currentUser = (req, res) => {
  if (!req.user) return res.json(null);

  res.json({
    id: req.user.id,
    displayName: req.user.displayName,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl,
    initials: userInitials(req.user),
  });
};
