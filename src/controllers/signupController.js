const Farmer = require('../models/Farmer');
const User = require('../models/User');

exports.buyerSignup = async (req, res) => {
  try {
    console.log('BuyerSignup Request:', {
      body: req.body,
      file: req.file,
    });
    const { fullName, email, password, phoneNumber } = req.body;

    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User({
      fullName,
      email,
      password,
      phoneNumber,
      role: 'buyer',
      profilePicture: req.file ? `/Uploads/${req.file.filename}` : null,
    });

    await user.save();
    res.status(201).json({ message: 'Buyer registered successfully' });
  } catch (error) {
    console.error('BuyerSignup Error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      file: req.file,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

exports.signupFarmer = async (req, res) => {
  try {
    console.log('FarmerSignup Request:', {
      body: req.body,
      files: req.files,
    });
    const { fullName, email, password, phoneNumber, farmName, farmLocation, crops } = req.body;
    let parsedCrops;
    try {
      parsedCrops = JSON.parse(crops);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid crops format' });
    }

    if (!fullName || !email || !password || !phoneNumber || !farmName || !farmLocation || !parsedCrops.length) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const existingFarmer = await Farmer.findOne({ email });
    if (existingFarmer) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const profilePicture = req.files?.profilePicture ? req.files.profilePicture[0].path : null;
    const verificationDocs = req.files?.verificationDocs ? req.files.verificationDocs[0].path : null;

    const farmer = new Farmer({
      fullName,
      email,
      password,
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
    console.error('FarmerSignup Error:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      files: req.files,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// New endpoint to get buyer information by ID
exports.getBuyerById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ error: 'Buyer not found' });
    }
    res.status(200).json({ message: 'Buyer retrieved successfully', user });
  } catch (error) {
    console.error('GetBuyerById Error:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// New endpoint to get farmer information by ID
exports.getFarmerById = async (req, res) => {
  try {
    const farmerId = req.params.id;
    const farmer = await Farmer.findById(farmerId).select('-password'); // Exclude password
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }
    res.status(200).json({ message: 'Farmer retrieved successfully', farmer });
  } catch (error) {
    console.error('GetFarmerById Error:', {
      message: error.message,
      stack: error.stack,
      farmerId: req.params.id,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Optional: Endpoint to get all buyers (e.g., for admin dashboard)
exports.getAllBuyers = async (req, res) => {
  try {
    const users = await User.find({ role: 'buyer' }).select('-password');
    res.status(200).json({ message: 'Buyers retrieved successfully', users });
  } catch (error) {
    console.error('GetAllBuyers Error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Optional: Endpoint to get all farmers (e.g., for admin dashboard)
exports.getAllFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().select('-password');
    res.status(200).json({ message: 'Farmers retrieved successfully', farmers });
  } catch (error) {
    console.error('GetAllFarmers Error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};