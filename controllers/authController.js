const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({ 
      displayName: username, 
      email, 
      password: hashedPassword 
    });
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { id: user.id, displayName: user.displayName, email: user.email } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
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
