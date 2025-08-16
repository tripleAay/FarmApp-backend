const Farmer = require('../models/Farmer');
const Order = require('../models/Order');
const Product = require('../models/Products');
const User = require("../models/User");
const mongoose = require("mongoose");
const cloudinary = require("../views/cloudinary");
const upload = require('../views/mutler'); // ✅ keep only this



exports.getFarmerProfile = async (req, res) => {
    try {
        const farmerId = req.params.id;

        if (!farmerId) {
            return res.status(400).json({ message: "Farmer ID is required" });
        }

        const foundFarmer = await Farmer.findById(farmerId).select('-password');

        if (!foundFarmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        res.status(200).json({
            foundFarmer,
            message: "Farmer Profile fetched successfully!!!"
        });

    } catch (error) {
        console.error("Error fetching farmer profile:", error);
        res.status(500).json({
            message: "Error fetching farmer profile",
            error: error.message
        });
    }
};

const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;
};

exports.getFarmerStats = async (req, res) => {
    try {
        const farmerId = req.params.farmerId;

        if (!farmerId) {
            return res.status(400).json({ message: "Farmer ID is required" });
        }

        // Total products listed by farmer
        const totalProducts = await Product.countDocuments({ farmerId });

        // All orders that have at least one product from this farmer
        const farmerOrders = await Order.find({
            "products.productId": { $in: (await Product.find({ farmerId }).distinct("_id")) }
        });

        // Pending orders for farmer
        const pendingOrders = farmerOrders.filter(order => order.status === "Pending");
        const pendingAmount = pendingOrders.reduce((sum, order) => {
            const farmerProducts = order.products.filter(p => p.productId && p.farmerId == farmerId);
            return sum + farmerProducts.reduce((total, prod) => total + prod.price * prod.quantity, 0);
        }, 0);

        // Total earnings (only paid orders for farmer)
        const totalEarnings = farmerOrders.reduce((sum, order) => {
            if (order.paid) {
                const farmerProducts = order.products.filter(p => p.productId && p.farmerId == farmerId);
                return sum + farmerProducts.reduce((total, prod) => total + prod.price * prod.quantity, 0);
            }
            return sum;
        }, 0);

        // Total sold
        const totalSold = farmerOrders.reduce((sum, order) => {
            const farmerProducts = order.products.filter(p => p.productId && p.farmerId == farmerId);
            return sum + farmerProducts.reduce((total, prod) => total + prod.quantity, 0);
        }, 0);

        // Recent orders for this farmer
        const recentOrders = farmerOrders
            .sort((a, b) => new Date(b.orderedDate) - new Date(a.orderedDate))
            .slice(0, 5)
            .map(order => ({
                orderId: order._id,
                productName: order.products.find(p => p.farmerId == farmerId)?.productName || "N/A",
                status: order.status || "N/A",
                date: order.orderedDate || null
            }));

        // Low stock alerts
        const stockAlerts = await Product.find({ farmerId, stock: { $lt: 5 } })
            .select("name stock");

        res.json({
            stats: {
                totalProducts: totalProducts || 0,
                pendingOrdersCount: pendingOrders.length || 0,
                pendingOrdersValue: formatCurrency(pendingAmount),
                totalEarnings: formatCurrency(totalEarnings),
                totalSold: totalSold || 0
            },
            recentOrders: recentOrders || [],
            stockAlerts: stockAlerts || []
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFarmerOrders = async (req, res) => {

    try {
        const { farmerId } = req.params;

        if (!farmerId) {
            return res.status(400).json({ message: "Farmer ID is required" });
        }

        // Get all products owned by this farmer
        const farmerProducts = await Product.find({ farmerId }).select("_id");
        const farmerProductIds = farmerProducts.map(p => p._id.toString());

        if (!farmerProductIds.length) {
            return res.json({ orders: [] });
        }

        // Get all orders containing these products
        const orders = await Order.find({
            "products.productId": { $in: farmerProductIds }
        }).sort({ orderedDate: -1 });

        // Get buyer names
        const userIds = [...new Set(orders.map(o => o.userId?.toString()))];
        const users = await User.find({ _id: { $in: userIds } }, { fullName: 1 });
        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user.fullName;
            return acc;
        }, {});

        // Flatten orders so each product is a separate item
        const formattedOrders = orders.flatMap(order =>
            order.products
                .filter(p => farmerProductIds.includes(p.productId.toString()))
                .map(item => ({
                    orderId: order._id,
                    productId: item.productId, // unique per product
                    product: item.productName,
                    buyer: userMap[order.userId?.toString()] || "N/A",
                    quantity: item.quantity,
                    totalPrice: item.price * item.quantity,
                    orderDate: order.orderedDate,
                    status: order.status  // product-specific status
                }))
        );

        res.json({ orders: formattedOrders, cart: orders });

    } catch (error) {
        console.error("Error fetching farmer orders:", error);
        res.status(500).json({ message: error.message });
    }
};

// controllers/orderController.js
function generateTransactionId() {
    return "TXN-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

exports.updateFarmerOrdersStatus = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ message: "No updates provided" });
        }

        const bulkOps = updates.map(update => {
            const updateFields = { status: update.status };

            // Apply extra rules based on status
            if (update.status === "Shipped") {
                // Set same-day delivery time (e.g., 6 PM today)
                const deliveryDate = new Date();
                deliveryDate.setHours(18, 0, 0, 0); // Today at 6 PM
                updateFields.dateToBeDelivered = deliveryDate;
                updateFields.approved = true;
                updateFields.paid = true;
                updateFields.transactionId = generateTransactionId();
            }
            else if (update.status === "Delivered") {
                updateFields.dateDelivered = new Date();
                updateFields.transactionId = generateTransactionId();
            }
            else if (update.status === "Cancelled") {
                updateFields.transactionId = generateTransactionId();
            }

            return {
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(update.orderId) },
                    update: { $set: updateFields }
                }
            };
        });

        const result = await Order.bulkWrite(bulkOps);

        res.json({
            message: "Order statuses updated successfully",
            result
        });

    } catch (error) {
        console.error("Error updating order statuses:", error);
        res.status(500).json({ message: error.message });
    }
};


exports.getBuyerProfile = async (req, res) => {
    try {
        const buyerId = req.params.id;

        if (!buyerId) {
            return res.status(400).json({ message: "Buyer ID is required" });
        }

        const foundBuyer = await User.findById(buyerId).select('-password');

        if (!foundBuyer) {
            return res.status(404).json({ message: "Buyer not found" });
        }

        res.status(200).json({
            foundBuyer,
            message: "Buyer Profile fetched successfully!!!"
        });

    } catch (error) {
        console.error("Error fetching Buyer profile:", error);
        res.status(500).json({
            message: "Error fetching Buyer profile",
            error: error.message
        });
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullName, email, phoneNumber, deliveryAddress } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update text fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (deliveryAddress) user.deliveryAddress = deliveryAddress;

        if (req.file) {
            if (user.profilePicture) {
                const publicId = user.profilePicture.split("/").pop().split(".")[0]; // extract publicId
                await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
            }

            const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
                folder: "profile_pictures",
            });
            user.profilePicture = uploadedImage.secure_url;
        }


        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                deliveryAddress: user.deliveryAddress,
                profilePicture: user.profilePicture, // ✅ Now a Cloudinary URL
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};
















