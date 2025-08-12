const User = require("../models/User")


exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: "user ID is required" });
        }

        const founduser = await User.findById(userId).select('-password');

        if (!founduser) {
            return res.status(404).json({ message: "user not found" });
        }

        res.status(200).json({
            founduser,
            message: "user Profile fetched successfully!!!"
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            message: "Error fetching user profile",
            error: error.message
        });
    }
};