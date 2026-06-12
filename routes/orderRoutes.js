const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middlewares/auth');

// Public route — no auth needed (public key is safe to expose)
router.get('/paystack-config', (req, res) => res.json({ publicKey: process.env.PAYSTACK_PUBLIC_KEY }));

// All other order routes require user login
router.use(isAuthenticated);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
