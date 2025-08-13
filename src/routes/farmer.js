const express = require('express');
const { getFarmerProfile, getFarmerStats, getFarmerOrders, updateOrderStatus, updateMultipleOrderStatuses, updateFarmerOrdersStatus } = require('../controllers/farmerController');
const { getUserProfile } = require('../controllers/userController');
const router = express.Router();

router.get('/:id', getFarmerProfile)
router.get('/stats/:farmerId', getFarmerStats)
router.get('/orders/:farmerId', getFarmerOrders)
router.get('/user/:userId', getUserProfile)
router.put("/orders/status", updateFarmerOrdersStatus);


module.exports = router;