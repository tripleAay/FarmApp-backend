// models/Product.js
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  featured: { type: Boolean, default: false },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
});
module.exports = mongoose.model('Product', productSchema);