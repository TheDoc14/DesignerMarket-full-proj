const { query } = require('express-validator');

const listCategoriesQuery = [
  query('q').optional().isString().trim().isLength({ max: 50 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  listCategoriesQuery,
};