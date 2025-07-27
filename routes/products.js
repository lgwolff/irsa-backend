const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - get all products
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/products hit'); // 👈 LOG THIS

    const products = await Product.find().sort({ createdAt: -1 });
    console.log('📦 Products:', products); // 👈 LOG PRODUCTS

    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
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
// DELETE /api/products/:id - delete product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// PUT /api/products/:id/deactivate - toggle product active status
router.put('/:id/deactivate', async (req, res) => {
  try {
    const { deactivate } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.deactivated = deactivate;
    await product.save();

    res.json({ message: 'Product status updated', deactivated: product.deactivated });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating product status' });
  }
});

module.exports = router;

