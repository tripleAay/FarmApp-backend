const express = require('express');
const upload = require('../views/mutler'); // ✅ keep only this
const { getFarmerProfile, getFarmerStats, getFarmerOrders, updateOrderStatus, updateMultipleOrderStatuses, updateFarmerOrdersStatus, getBuyerProfile, updateBuyerProfile, updateProfile } = require('../controllers/farmerController');
const { getUserProfile } = require('../controllers/userController');
const router = express.Router();

router.get('/:id', getFarmerProfile)
router.get('/buyer/:id', getBuyerProfile)
router.put("/profile/:id", upload.single("profilePicture"), updateProfile);
router.get('/stats/:farmerId', getFarmerStats)
router.get('/orders/:farmerId', getFarmerOrders)
router.get('/user/:userId', getUserProfile)
router.put("/orders/status", updateFarmerOrdersStatus);


module.exports = router;