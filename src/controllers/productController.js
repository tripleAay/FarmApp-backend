const Products = require('../models/Products');

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    if (!name || !description || !price || !req.file) {
      return res.status(400).json({ message: 'All fields are required, including an image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      imageUrl,
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};