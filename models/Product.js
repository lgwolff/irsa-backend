// Product.js (Mongoose model)

const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  category: String,
  brand: String,
  images: [String],
  price: Number,
  stock: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Generate slug automatically before saving
productSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
