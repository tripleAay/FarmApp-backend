const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Product', productSchema);
