const express = require('express');
const { getFarmerProfile, getFarmerStats } = require('../controllers/farmerController');
const router = express.Router();

router.get('/:id', getFarmerProfile)
router.get('/stats/:farmerId', getFarmerStats)

module.exports = router;