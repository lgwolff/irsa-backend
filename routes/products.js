const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');

// Multer setup: no file size limit, store in uploads folder temporarily
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// GET /api/products - get all products
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/products hit');
    const products = await Product.find().sort({ createdAt: -1 });
    console.log('📦 Products:', products);
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/products/slug/:slug - get product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching product by slug' });
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
      stock,
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

// PUT /api/products/:id - update product details
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product updated', product: updatedProduct });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
});

// GET /api/products/:id - get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// POST /api/products/bulk-upload - upload CSV and add products in bulk
router.post('/bulk-upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required' });

  const filePath = path.resolve(req.file.path);
  const productsToInsert = [];
  const errors = [];
  let rowCount = 0;

  fs.createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }))
    .on('data', (row) => {
      rowCount++;
      const { name, description, price, images, tags, category, stock } = row;

      if (!name || !description || !price || !category) {
        errors.push({ row: rowCount, error: 'Missing required fields' });
        return;
      }

      const product = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        images: images ? images.split(',').map(s => s.trim()) : [],
        tags: tags ? tags.replace(/[“”]/g, '"').split(',').map(s => s.trim()) : [],
        category: category.trim(),
        stock: stock ? parseInt(stock) : 0,
        createdAt: new Date(),
      };

      if (isNaN(product.price) || product.price < 0) {
        errors.push({ row: rowCount, error: 'Invalid price' });
        return;
      }
      if (isNaN(product.stock) || product.stock < 0) {
        errors.push({ row: rowCount, error: 'Invalid stock' });
        return;
      }

      productsToInsert.push(product);
    })
    .on('end', async () => {
      try {
        const inserted = await Product.insertMany(productsToInsert);
        fs.unlinkSync(filePath); // clean temp file

        res.json({
          message: 'Bulk upload finished',
          insertedCount: inserted.length,
          errorCount: errors.length,
          errors,
        });
      } catch (insertErr) {
        res.status(500).json({ message: 'DB insert error', error: insertErr.message });
      }
    })
    .on('error', (err) => {
      fs.unlinkSync(filePath);
      res.status(400).json({ message: 'CSV parse error', error: err.message });
    });
});

module.exports = router;

