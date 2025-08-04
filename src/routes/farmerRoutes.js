const express = require('express');
const router = express.Router();
const { signupFarmer } = require('../controllers/FarmerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Simple config for now

router.post(
  '/signup',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'verificationDocs', maxCount: 1 },
  ]),
  signupFarmer
);

module.exports = router;
