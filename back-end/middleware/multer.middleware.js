// back-end/middlewares/multer.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_FOLDERS } = require('../constants/files.constants');

// סוגי קבצים מותרים – כולל תמונות, סרטונים, מסמכים ומצגות
const allowed = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|ppt|pptx|txt|zip/;

// ✅ תמונות בלבד לפרופיל
const allowedProfileImages = /jpeg|jpg|png|gif|webp/;

/**
 * getProjectSubfolder
 * מנתב קבצים של פרויקט לתת-תיקייה לפי mimetype:
 * תמונות/וידאו -> projectImages, כל השאר -> projectFiles.
 */
const getProjectSubfolder = (mimetype) => {
  if (mimetype.startsWith('image/') || mimetype.startsWith('video/'))
    return FILE_FOLDERS.PROJECT_IMAGES;
  return FILE_FOLDERS.PROJECT_FILES;
};

/**
 * createMulter
 * שומר קבצים תחת uploads/<baseFolder>
 * בפרויקטים – מנתב לתת-תיקיות לפי סוג הקובץ.
 */
const createMulter = (baseFolder) => {
  const basePath = path.join(FILE_FOLDERS.UPLOADS, baseFolder);

  // יצירת תיקייה ראשית אם אינה קיימת
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
      let targetPath = basePath;

      // אם מדובר בפרויקטים, ניצור תת-תיקייה בהתאם לסוג הקובץ
      if (baseFolder === FILE_FOLDERS.PROJECTS) {
        const subfolder = getProjectSubfolder(file.mimetype);
        targetPath = path.join(basePath, subfolder);
      }

      // יצירת תיקיית-משנה אם אינה קיימת
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      cb(null, targetPath);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const fileFilter = (_req, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimetype = file.mimetype || '';

      // ✅ פרופיל: תמונות בלבד
      if (baseFolder === FILE_FOLDERS.PROFILE_IMAGES) {
        const extClean = ext.replace('.', '');
        const extOk = allowedProfileImages.test(extClean);
        const mimeOk = mimetype.startsWith('image/');

        if (extOk && mimeOk) return cb(null, true);
        return cb(new Error('Unsupported file type'));
      }

      // ✅ ברירת מחדל (כמו אצלך היום): מאשר גם תמונות למסמכי אישור
      const extOk = allowed.test(ext);
      const mimeOk =
        mimetype.startsWith('image/') ||
        mimetype.startsWith('video/') ||
        mimetype.startsWith('text/') ||
        mimetype.includes('pdf') ||
        mimetype.includes('word') ||
        mimetype.includes('officedocument') ||
        mimetype.includes('powerpoint') ||
        mimetype.includes('zip');

      if (extOk || mimeOk) cb(null, true);
      else cb(new Error('Unsupported file type'));
    } catch (_err) {
      cb(new Error('Unsupported file type'));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize:
        baseFolder === FILE_FOLDERS.PROJECTS
          ? 500 * 1024 * 1024 // ✅ עד 500MB לקובצי פרויקט
          : 50 * 1024 * 1024, // עד 50MB לשאר
    },
  });
};

// ✅ Middleware-ים לפי סוג העלאה
module.exports = {
  uploadApproval: createMulter(FILE_FOLDERS.APPROVAL_DOCUMENTS), // נשאר פתוח גם לתמונות
  uploadProject: createMulter(FILE_FOLDERS.PROJECTS),
  uploadProfile: createMulter(FILE_FOLDERS.PROFILE_IMAGES), // תמונות בלבד
};
