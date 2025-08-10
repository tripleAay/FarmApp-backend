// src/routes/auth.js
const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const signupController = require('../controllers/signupController');
const upload = require('../middleware/multer');
const Product = require('../models/Products'); // Assuming you have a Product model
const Order = require('../models/Order'); // Assuming you have an Order model
const Farmer = require('../models/Farmer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded; // Store decoded token for use in routes
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Signup routes
router.post(
  '/farmersignup',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'verificationDocs', maxCount: 1 },
  ]),
  signupController.signupFarmer
);

router.post('/buyersignup', upload.single('profilePicture'), signupController.buyerSignup);

// Login route
router.post('/login', loginController.login);

// User information routes
router.get('/buyer/:id', authenticate, signupController.getBuyerById);
router.get('/farmer/:id', authenticate, signupController.getFarmerById);
router.get('/buyers', authenticate, signupController.getAllBuyers);
router.get('/farmers', authenticate, signupController.getAllFarmers);

// New routes for dashboard data
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalOrders = await Order.countDocuments();
    res.json({
      totalFarmers,
      totalBuyers,
      totalOrders,
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

router.get('/products/featured', authenticate, async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(10);
    res.json(products);
  } catch (error) {
    console.error('Featured Products Error:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

router.get('/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    res.json(orders);
  } catch (error) {
    console.error('Orders Error:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

module.exports = router;