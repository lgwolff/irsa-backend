const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});
// POST /api/products - add a new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, images, tags, category, stock } = req.body;
    const product = new Product({
      name,
      description,
      price,
      images,
      tags,
      category,
      stock
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
});

module.exports = router;

