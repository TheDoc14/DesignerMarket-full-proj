// back-end/utils/tags.utils.js

/**
 * normalizeTags
 * מקבל tags מכל סוג (array / CSV string / single string) ומחזיר מערך נקי.
 * מסיר רווחים, מסיר ריקים, ומונע כפילויות כדי לשמור על אחידות במסד.
 */
const normalizeTags = (tags) => {
  let arr = [];

  if (Array.isArray(tags)) arr = tags;
  else if (typeof tags === 'string') arr = tags.split(',');

  return [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))];
};

module.exports = { normalizeTags };
