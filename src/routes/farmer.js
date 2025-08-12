const express = require('express');
const { getFarmerProfile, getFarmerStats } = require('../controllers/farmerController');
const { getUserProfile } = require('../controllers/userController');
const router = express.Router();

router.get('/:id', getFarmerProfile)
router.get('/stats/:farmerId', getFarmerStats)
router.get('/user/:userId', getUserProfile)

module.exports = router;