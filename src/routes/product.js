const express = require('express');
const { CloudinaryStorage } = require('../views/cloudinary');
const multer = require('../views/mutler');
const cloudinary = require('cloudinary').v2;
const { addProduct, getProductsByFarmerId, getAllProducts, getProductById, updateProduct, updateMissingQuantities, deleteProduct, updateMissingReviews, addToCart, checkIfInCart, getCartByUser, updateCartQuantity } = require('../controllers/productController');
const upload = require('../views/mutler'); // ✅ keep only this

const router = express.Router();
// router.put('/update-missing-quantities', updateMissingReviews);

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
router.patch("/cart/update/:userId/:productId/:action", updateCartQuantity);




module.exports = router;
