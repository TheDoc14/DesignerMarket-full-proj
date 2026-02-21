// back-end/middleware/validate.middleware.js
const { validationResult } = require('express-validator');
const {
  deleteUploadsFromFilesArray,
  deleteUploadByFsPath,
} = require('../utils/filesCleanup.utils');

/**
 * ✅ validate.middleware.js
 * אוסף שגיאות מ-express-validator.
 * אם יש שגיאות — מחזיר 400 בצורה אחידה דרך ה-errorHandler שלכם.
 *
 * בונוס חשוב:
 * - אם העלינו קבצים (multer) והולידציה נכשלה לפני הקונטרולר,
 *   מנקים את הקבצים כדי שלא יישארו "זבל" ב-uploads.
 */
const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  // ✅ Cleanup uploads on validation error (best effort)
  try {
    if (Array.isArray(req.files) && req.files.length) {
      deleteUploadsFromFilesArray(req.files);
    }
    if (req.file && req.file.path) {
      deleteUploadByFsPath(String(req.file.path));
    }
  } catch (_err) {}

  const first = result.array({ onlyFirstError: true })[0];
  const err = new Error(first?.msg || 'Invalid request');
  err.statusCode = 400;
  err.expose = true;
  return next(err);
};

module.exports = { validate };
