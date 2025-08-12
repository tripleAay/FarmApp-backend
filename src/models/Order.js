const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  products: [
    {
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      thumbnail: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  userId: { type: String, required: true },
  Total: { type: Number },
  paid: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  orderedDate: { type: Date, default: Date.now },
  dateToBeDelivered: { type: Date, default: Date.now },
  dateDelivered: { type: Date },
  transactionId: { type: String },
  paymentMethod: { type: String, default: "Payment on Delivery" },
  status: { type: String, default: "Pending" },
  totalPrice: { type: Number },
  paymentImage: { type: String },
  quantity: { type: String },
});


module.exports = mongoose.model('Order', orderSchema);