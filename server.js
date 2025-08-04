const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const farmerRoutes = require('./src/routes/farmerRoutes'); // fix this
require('dotenv').config(); // fix this

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', farmerRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
