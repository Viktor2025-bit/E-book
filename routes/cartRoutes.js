const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated, optionalAuth } = require('../middlewares/auth');

// Cart routes allow guests (optionalAuth)
router.use(optionalAuth);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:productId', cartController.updateCartItem);
router.delete('/:productId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
