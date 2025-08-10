const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./src/routes/auth'); // Corrected from authRoutes
require('dotenv').config();
const multer = require('multer');

const app = express();

// Enable CORS for http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from Uploads folder
app.use('/Uploads', express.static('Uploads'));

// Mount auth routes under /api
app.use('/api', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  if (err.message === 'Invalid file type. Only JPEG, PNG, and PDF are allowed.') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: `Internal server error: ${err.message}` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});