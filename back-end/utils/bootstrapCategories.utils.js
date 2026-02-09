// back-end/utils/bootstrapCategories.utils.js
const Category = require('../models/Category.model');

/**
 * Creates/updates base categories in DB.
 * Safe to run on every server start.
 */
const ensureBaseCategories = async () => {
  const base = [
    { key: 'product', label: 'Product', isSystem: true },
    { key: 'graphic', label: 'Graphic', isSystem: true },
    { key: 'architecture', label: 'Architecture', isSystem: true },
    { key: 'fashion', label: 'Fashion', isSystem: true },
    { key: 'other', label: 'Other', isSystem: true },
  ];

  for (const c of base) {
    await Category.updateOne({ key: c.key }, { $setOnInsert: c }, { upsert: true });
  }
};

module.exports = { ensureBaseCategories };
