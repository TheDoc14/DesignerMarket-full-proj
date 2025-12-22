//back-end/utils/query.utils.js
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toSort = (sortBy, order, allowedFields, defaultField = 'createdAt') => {
  const field = (allowedFields || []).includes(sortBy) ? sortBy : defaultField;
  const dir = (order === 'asc' || order === 'ASC') ? 1 : -1;
  return { [field]: dir };
};

module.exports = { toInt, escapeRegex, toSort };