const Products = require('../models/Products');

const Order = require("../models/Order");
;


exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, featured, farmerId, quantity } = req.body;

    if (!name || !price || !req.files?.thumbnail) {
      return res.status(400).json({ message: 'Name, price, and thumbnail are required' });
    }

    const thumbNailUrl = req.files.thumbnail[0].path;
    const imageUrls = req.files.images ? req.files.images.map(file => file.path) : [];

    if (imageUrls.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 images allowed' });
    }

    const product = new Products({
      name,
      description,
      price: parseFloat(price),
      category,
      thumbnail: thumbNailUrl,
      images: imageUrls,
      featured: featured || false,
      farmerId,
      quantity
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};

exports.getProductsByFarmerId = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1; // default page 1
    const limit = parseInt(req.query.limit, 10) || 5; // default 5 per page

    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required" });
    }

    const skip = (page - 1) * limit;

    const products = await Products.find({ farmerId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProducts = await Products.countDocuments({ farmerId });

    res.status(200).json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    });
  } catch (error) {
    console.error("Error fetching products by farmerId:", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1; // default page 1
    const limit = parseInt(req.query.limit, 10) || 20; // default 20 per page

    const skip = (page - 1) * limit;

    const products = await Products.find() // ✅ No farmerId filter
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProducts = await Products.countDocuments(); // ✅ Count all

    res.status(200).json({
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    const { farmerId, id } = req.params;

    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required" });
    }
    if (!id) {
      return res.status(400).json({ message: "ProductId is required" });
    }

    const product = await Products.findOneAndDelete({ _id: id, farmerId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully!!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};


// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Products.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Update product by ID (only provided fields)
exports.updateProduct = async (req, res) => {
  try {
    const { farmerId, id } = req.params;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // Find the product
    const product = await Products.findOne({ _id: id, farmerId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Allowed text fields
    const allowedUpdates = ["name", "description", "price", "category", "quantity", "unit", "featured"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] =
          ["price", "quantity"].includes(field)
            ? Number(req.body[field])
            : req.body[field];
      }
    });

    // ✅ Handle deleted thumbnail
    if (req.body.deletedThumbnail === "true") {
      product.thumbnail = null;
    }

    // ✅ Handle new thumbnail (Cloudinary URL from multer upload)
    if (req.files?.thumbnail?.length > 0) {
      product.thumbnail = req.files.thumbnail[0].path; // multer + Cloudinary
    }

    // ✅ Handle deleted images
    if (req.body.deletedImages) {
      try {
        const imgsToDelete = JSON.parse(req.body.deletedImages);
        product.images = product.images.filter(
          (img) => !imgsToDelete.includes(img)
        );
      } catch (err) {
        console.error("Invalid deletedImages JSON:", req.body.deletedImages);
      }
    }

    // ✅ Handle new images (Cloudinary URLs from multer upload)
    if (req.files?.images?.length > 0) {
      const newImgs = req.files.images.map((file) => file.path);
      product.images.push(...newImgs);
    }

    // ✅ Limit images
    if (product.images.length > 5) {
      return res.status(400).json({ message: "You can only have 5 images" });
    }

    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.addToCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // Find the product
    const product = await Products.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if order exists
    let cart = await Order.findOne({ userId });

    console.log("Cart", cart);


    if (!cart) {
      // Create new order with product details
      cart = new Order({
        userId,
        products: [{
          productId,
          productName: product.name,   // must match your schema
          thumbnail: product.thumbnail,    // must match your schema
          quantity: 1,
          price: product.price
        }]
      });
    } else {
      // Find if product exists in cart
      const itemIndex = cart.products.findIndex(
        p => p.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.products[itemIndex].quantity += 1;
      } else {
        cart.products.push({
          productId,
          productName: product.name,
          thumbnail: product.thumbnail,
          quantity: 1,
          price: product.price
        });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.checkIfInCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // Find the cart
    const cart = await Order.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ inCart: false });
    }

    // Check if product exists in the cart
    const inCart = cart.products.some(
      p => p.productId.toString() === productId
    );

    res.status(200).json({ inCart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getCartByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Order.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ products: [] }); // empty cart
    }

    res.status(200).json({ products: cart.products });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.updateMissingReviews = async (req, res) => {
  try {
    const defaultReviews = [
      {
        reviewer: "John Doe",
        rating: 5,
        comment: "Excellent product! High quality and fast delivery.",
        date: new Date()
      },
      {
        reviewer: "Jane Smith",
        rating: 4,
        comment: "Very good product, just a little improvement needed on packaging.",
        date: new Date()
      }
    ];

    const result = await Products.updateMany(
      {
        $or: [
          { reviews: { $exists: false } },   // reviews field doesn't exist
          { reviews: null },                 // null value
          { reviews: { $size: 0 } }          // empty array
        ]
      },
      { $set: { reviews: defaultReviews } }
    );

    res.status(200).json({
      message: 'Missing reviews added successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error updating missing reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};









