const mongoose = require('mongoose');

// Review sub-schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // reviewer name
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Product schema
const productSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  quantity: { type: String },
  thumbnail: { type: String },
  images: {
    type: [String],
    validate: {
      validator: function (arr) {
        return arr.length <= 5;
      },
      message: 'You can upload a maximum of 5 images'
    }
  },
  featured: { type: Boolean, default: false },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },

  // Reviews as array
  reviews: [reviewSchema],

  // Default stats
  averageRating: { type: Number, default: 0 },
  numberOfReviews: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', productSchema);
