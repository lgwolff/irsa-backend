const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true }, // <- NEW FIELD
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: [{ type: String }],
  tags: [{ type: String }],
  category: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0, min: 0 },
  deactivated: { type: Boolean, default: false }, // <- Already good
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

// Auto-generate slug from name
productSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace spaces/symbols
      .replace(/^-+|-+$/g, '')     // Remove leading/trailing hyphens
      .substring(0, 50);           // Limit length
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
