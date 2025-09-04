const express = require('express');
const { addProduct, getProductsByFarmerId, getAllProducts, getProductById, updateProduct, updateMissingQuantities, deleteProduct, updateMissingReviews, addToCart, checkIfInCart, getCartByUser, updateCartQuantity, removeFromCart, placeOrder, addMissingDeliveryAddress, getOrderByUser, getOrderById, addMissingFarmerId, uploadPaymentProof, getSimilarProducts } = require('../controllers/productController');
const upload = require('../views/mutler'); // ✅ keep only this

const router = express.Router();
router.put('/update-missing-quantities', addMissingFarmerId);

router.post(
  '/updateproduct/:farmerId/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  updateProduct
);

router.get("/farmer/:farmerId", getProductsByFarmerId);
router.delete("/delete/:farmerId/:id", deleteProduct);
router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 }
  ]),
  addProduct
);

router.get("/products/:id", getProductById);
router.post("/addtocart/:userId/:productId", addToCart);
router.get("/check-in-cart/:userId/:productId", checkIfInCart)
router.get("/user", getAllProducts);
router.get("/cart/:userId", getCartByUser);
router.get("/order/:userId", getOrderByUser);
router.get("/similar", getSimilarProducts);
router.get("/orderinfo/:orderId", getOrderById);
router.patch("/cart/update/:userId/:productId/:action", updateCartQuantity);
router.patch("/cart/remove/:userId/:productId", removeFromCart);
router.post("/place-order/:userId", placeOrder)
router.post('/upload-payment-proof/:orderId', upload.single('paymentImage'), uploadPaymentProof);






module.exports = router;
