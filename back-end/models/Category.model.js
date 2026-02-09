// back-end/models/Category.model.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Category
  ? mongoose.models.Category
  : mongoose.model('Category', CategorySchema);
