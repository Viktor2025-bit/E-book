const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

const hasUsableGoogleCredentials = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const placeholders = ['your_google_client_id_here', 'your_google_client_secret_here'];

  return Boolean(clientId && clientSecret)
    && !placeholders.includes(clientId)
    && !placeholders.includes(clientSecret)
    && !clientId.toLowerCase().includes('placeholder')
    && !clientSecret.toLowerCase().includes('placeholder');
};

const safeReturnTo = (value) => {
  if (!value || typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
};

// Local register and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Auth with Google
router.get('/google', (req, res, next) => {
  if (!hasUsableGoogleCredentials()) {
    return res.redirect('/account/login.html?google=not-configured');
  }
  req.session.googleGuestSessionId = req.sessionID;
  req.session.googleReturnTo = safeReturnTo(req.query.next);
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google auth callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err || !user) {
      return res.redirect('/account/login.html?google=failed');
    }

    req.login(user, async (loginErr) => {
      if (loginErr) return next(loginErr);

      const returnTo = safeReturnTo(req.session.googleReturnTo);
      const guestSessionId = req.session.googleGuestSessionId;
      delete req.session.googleReturnTo;
      delete req.session.googleGuestSessionId;

      try {
        await authController.mergeGuestCartIntoUserCart(guestSessionId, user.id);
      } catch (mergeError) {
        return next(mergeError);
      }

      return res.redirect(returnTo);
    });
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Get current user
router.get('/current_user', authController.currentUser);

module.exports = router;
