const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Local register and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Auth with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google auth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Get current user
router.get('/current_user', (req, res) => {
  res.send(req.user);
});

module.exports = router;
