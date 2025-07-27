const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: [{ type: String }], // URLs or paths to product images
  tags: [{ type: String }],   // e.g. ['new', 'sale', '5% OFF']
  category: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Product', productSchema);

