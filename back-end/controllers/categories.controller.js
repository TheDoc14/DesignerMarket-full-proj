const Category = require('../models/Category.model'); // תעדכן נתיב/שם אם אצלך שונה

const { getPaging, escapeRegex, } = require('../utils/query.utils'); // תעדכן אם אצלך שם/מיקום אחר
const { buildMeta } = require('../utils/meta.utils');

const listCategories = async (req, res, next) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = getPaging(req.query, 50);

    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ key: rx }, { label: rx }];
    }

    const [total, rows] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .sort({ isSystem: -1, key: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      message: 'Categories fetched',
      meta: buildMeta(total, page, limit),
      categories: rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCategories,
};