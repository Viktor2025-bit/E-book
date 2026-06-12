const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

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
    
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
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
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
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
  });
};
