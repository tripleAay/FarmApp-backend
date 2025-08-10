const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check both Farmer and User collections
    let user = await Farmer.findOne({ email }).select('+password');
    let role = 'farmer';
    
    if (!user) {
      user = await User.findOne({ email }).select('+password');
      role = 'buyer';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, role },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};