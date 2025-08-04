const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  farmName: { type: String, required: true },
  farmLocation: { type: String, required: true },
  crops: { type: [String], required: true },
  profilePicture: { type: String, default: null },
  verificationDocs: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Farmer', farmerSchema);