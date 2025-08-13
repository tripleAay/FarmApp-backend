const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    products: [
        {
            productId: { type: String, required: true },
            productName: { type: String, required: true },
            thumbnail: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            farmerId: { type: String, required: true },

        },
    ],
    userId: { type: String, required: true },
    Total: { type: Number },
    ordered: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    orderedDate: { type: Date, default: Date.now },
    totalPrice: { type: Number },
});


module.exports = mongoose.model('Cart', cartSchema);