const bcrypt = require('bcrypt');
const Farmer = require('../models/Farmer');

const signupFarmer = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, farmName, farmLocation, crops } = req.body;
    const parsedCrops = JSON.parse(crops);

    // Validate required fields
    if (!fullName || !email || !password || !phoneNumber || !farmName || !farmLocation || !parsedCrops.length) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Check if email already exists
    const existingFarmer = await Farmer.findOne({ email });
    if (existingFarmer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle file uploads
    const profilePicture = req.files?.profilePicture ? req.files.profilePicture[0].path : null;
    const verificationDocs = req.files?.verificationDocs ? req.files.verificationDocs[0].path : null;

    // Save farmer to MongoDB
    const farmer = new Farmer({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      farmName,
      farmLocation,
      crops: parsedCrops,
      profilePicture,
      verificationDocs,
    });

    await farmer.save();
    res.status(201).json({ message: 'Farmer registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signupFarmer };