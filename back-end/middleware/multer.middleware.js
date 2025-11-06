// middlewares/multer.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// סוגי קבצים מותרים – כולל תמונות, סרטונים, מסמכים ומצגות
const allowed = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|ppt|pptx|zip/;

/**
 * יוצר אינסטנציה של multer לפי תיקיית יעד ומגבלת גודל
 * @param {string} targetFolder - שם תיקיית היעד בתוך uploads
 */
const createMulter = (targetFolder) => {
  const fullPath = path.join('uploads', targetFolder);

  // יצירת תיקייה אם אינה קיימת
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, fullPath),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });

  const fileFilter = (req, file, cb) => {
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Unsupported file type'));
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: targetFolder === 'projects'
        ? 100 * 1024 * 1024 // עד 100MB לקובצי פרויקט
        : 30 * 1024 * 1024  // עד 30MB לשאר הקבצים
    }
  });
};

// ✅ Middleware-ים לפי סוג ההעלאה
module.exports = {
  uploadApproval: createMulter('approvalDocuments'),
  uploadProject: createMulter('projects'),
  uploadProfile: createMulter('profileImages')
};