const mongoose = require('mongoose');
const cloudinary = require("../views/cloudinary");
const fs = require("fs");
const Products = require('../models/Products');
const upload = require('../views/mutler'); // ✅ keep only this


const Order = require("../models/Order");
;

const User = require("../models/User");
;


const Cart = require("../models/Cart")


exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, featured, farmerId, quantity } = req.body;

    if (!name || !price || !req.files?.thumbnail) {
      return res.status(400).json({ message: "Name, price, and thumbnail are required" });
    }

    // ✅ Upload thumbnail to Cloudinary
    let thumbNailUrl = "";
    if (req.files?.thumbnail?.length > 0) {
      const thumbResult = await cloudinary.uploader.upload(
        req.files.thumbnail[0].path,
        {
          folder: "products/thumbnails",
          resource_type: "image",
        }
      );

      thumbNailUrl = thumbResult.secure_url;

      // Cleanup local file
      fs.unlinkSync(req.files.thumbnail[0].path);
    }

    // ✅ Upload product images (if provided)
    let imageUrls = [];
    if (req.files.images) {
      if (req.files.images.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images allowed" });
      }

      for (const file of req.files.images) {
        const imgResult = await cloudinary.uploader.upload(file.path, {
          folder: "products/images",
          resource_type: "image",
        });
        imageUrls.push(imgResult.secure_url);

        // Cleanup local file
        fs.unlinkSync(file.path);
      }
    }

    // ✅ Create product with Cloudinary URLs
    const product = new Products({
      name,
      description,
      price: parseFloat(price),
      category,
      thumbnail: thumbNailUrl,
      images: imageUrls,
      featured: featured || false,
      farmerId,
      quantity,
    });

    await product.save();

    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error: error.message });
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

    // Find the product
    const product = await Products.findOne({ _id: id, farmerId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Allowed text fields
    const allowedUpdates = ["name", "description", "price", "category", "quantity", "unit", "featured"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "price") {
          product[field] = Number(req.body[field]);
        } else {
          product[field] = req.body[field];
        }
      }
    });


    // ✅ Handle deleted thumbnail
    if (req.body.deletedThumbnail === "true") {
      product.thumbnail = null;
    }

    // ✅ Handle new thumbnail (upload to Cloudinary)
    if (req.files?.thumbnail?.length > 0) {
      const uploadedThumb = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
        folder: "products/thumbnails",
      });
      product.thumbnail = uploadedThumb.secure_url;
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

    // ✅ Handle new images (upload to Cloudinary)
    if (req.files?.images?.length > 0) {
      for (const file of req.files.images) {
        const uploadedImg = await cloudinary.uploader.upload(file.path, {
          folder: "products/images",
        });
        product.images.push(uploadedImg.secure_url);
      }
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

    // Check if cart exists
    let cart = await Cart.findOne({ userId });

    const productData = {
      productId,
      productName: product.name,       // matches schema
      thumbnail: product.thumbnail,    // matches schema
      quantity: 1,
      price: product.price,
      farmerId: product.farmerId
    };

    if (!cart) {
      // Create new cart with product details
      cart = new Cart({
        userId,
        products: [productData]
      });
    } else {
      // Check if product already exists in cart
      const itemIndex = cart.products.findIndex(
        p => p.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.products[itemIndex].quantity += 1;
      } else {
        cart.products.push(productData);
      }
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, action } = req.params; // action can be 'add' or 'remove'

    // Find the product

    const product = await Products.findById(productId);
    if (!product) {
      return res.status(406).json({ message: "Product not found" });
    }

    // Check if order exists
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      if (action === "add") {
        // Create new Cart with product details
        cart = new Cart({
          userId,
          products: [{
            productId,
            productName: product.name,
            thumbnail: product.thumbnail,
            quantity: 1,
            price: product.price
          }]
        });
      } else {
        return res.status(400).json({ message: "Cart not found for removal" });
      }
    } else {
      // Find if product exists in cart
      const itemIndex = cart.products.findIndex(
        p => p.productId.toString() === productId
      );

      if (itemIndex > -1) {
        if (action === "add") {
          cart.products[itemIndex].quantity += 1;
        } else if (action === "remove") {
          cart.products[itemIndex].quantity -= 1;
          if (cart.products[itemIndex].quantity <= 0) {
            cart.products.splice(itemIndex, 1); // remove product if quantity is zero or less
          }
        }
      } else {
        if (action === "add") {
          cart.products.push({
            productId,
            productName: product.name,
            thumbnail: product.thumbnail,
            quantity: 1,
            price: product.price
          });
        } else {
          return res.status(400).json({ message: "Product not found in cart for removal" });
        }
      }
    }

    await cart.save();
    res.status(200).json({ message: "Cart updated", cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // Find the cart for the user
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    // Find the product in the cart
    const itemIndex = cart.products.findIndex(
      p => p.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(400).json({ message: "Product not found in cart" });
    }

    // Reduce quantity or remove
    cart.products[itemIndex].quantity -= 1;
    if (cart.products[itemIndex].quantity <= 0) {
      cart.products.splice(itemIndex, 1);
    }

    await cart.save();
    res.status(200).json({ message: "Product removed from cart", cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Buyer ID is required" });
    }

    // 1. Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.products.length === 0) {
      return res.status(406).json({ message: "Cart is empty or not found" });
    }

    // 2. Calculate total price
    const totalPrice = cart.products.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );

    // 3. Create a new order
    const newOrder = new Order({
      userId: cart.userId,
      products: cart.products,
      Total: totalPrice,
      totalPrice,
      status: "Pending",
      paymentMethod: "Payment on Delivery",
    });

    await newOrder.save();

    // 4. Clear the cart
    cart.products = [];
    cart.Total = 0;
    await cart.save();

    res.status(200).json({
      message: "Order placed successfully. Kindly wait for the farmer to approve.",
      order: newOrder
    });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.checkIfInCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // Find the cart
    const cart = await Cart.findOne({ userId });

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

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ products: [] }); // empty cart
    }

    res.status(200).json({ products: cart.products });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getOrderByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders) {
      return res.status(200).json({ products: [] }); // empty orders
    }

    res.status(200).json({ message: "Orders Fetched successfully", orders });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order fetched successfully', order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Payment proof image is required" });
    }

    if (req.files?.thumbnail?.length > 0) {
      const thumbResult = await cloudinary.uploader.upload(
        req.files.thumbnail[0].path,
        {
          folder: "products/thumbnails",
          resource_type: "image", // optional but safe
        }
      );

      product.thumbnail = thumbResult.secure_url;
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentImage: uploadedImage.secure_url }, // ✅ use secure URL
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Payment proof uploaded successfully",
      order,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    res.status(500).json({
      message: "Error uploading payment proof",
      error: error.message,
    });
  }
};


exports.addMissingFarmerId = async (req, res) => {
  try {
    // Find all products missing productId
    const products = await Products.find({ productId: { $exists: false } });

    for (const product of products) {
      // Set productId to the current _id
      product.productId = product._id;

      // Ensure farmerId exists
      if (!product.farmerId) {
        product.farmerId = mongoose.Types.ObjectId("68999c255001060d5bf5e37e");
      }

      // Remove invalid reviews
      product.reviews = product.reviews.filter(
        (r) => r && r.user && r.name && r.comment && r.rating
      );

      await product.save();
    }

    res.status(200).json({
      message: "All products fixed successfully",
      totalProductsUpdated: products.length,
    });
  } catch (error) {
    console.error("Error fixing products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSimilarProducts = async (req, res) => {
  try {
    const { category, excludeId } = req.query;
    const limit = parseInt(req.query.limit, 10) || 6;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }


    const products = await Products.find({
      category,
      _id: { $ne: excludeId } // exclude current product
    })
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      similarProducts: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching similar products:", error);
    res.status(500).json({
      message: "Error fetching similar products",
      error: error.message
    });
  }
};

