const Farmer = require('../models/Farmer');
const Order = require('../models/Order');
const Product = require('../models/Products');

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

// Currency formatter for ₦
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

