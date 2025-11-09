// middlewares/multer.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// סוגי קבצים מותרים – כולל תמונות, סרטונים, מסמכים ומצגות
const allowed = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|ppt|pptx|txt|zip/;

/**
 * בוחר את תיקיית היעד בתוך uploads/projects לפי סוג הקובץ
 */
const getProjectSubfolder = (mimetype) => {
  if (mimetype.startsWith("image/") || mimetype.startsWith("video/")) return "projectImages";
  return "projectFiles";
};

/**
 * יוצר אינסטנציה של multer לפי תיקיית יעד ומגבלת גודל
 * @param {string} baseFolder - תיקיית היעד הראשית בתוך uploads (למשל 'projects', 'profileImages' וכו')
 */
const createMulter = (baseFolder) => {
  const basePath = path.join("uploads", baseFolder);

  // יצירת תיקייה ראשית אם אינה קיימת
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let targetPath = basePath;

      // אם מדובר בפרויקטים, ניצור תת-תיקייה בהתאם לסוג הקובץ
      if (baseFolder === "projects") {
        const subfolder = getProjectSubfolder(file.mimetype);
        targetPath = path.join(basePath, subfolder);
      }

      // יצירת תיקיית-משנה אם אינה קיימת
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      cb(null, targetPath);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const fileFilter = (req, file, cb) => {
   const ext = path.extname(file.originalname).toLowerCase();
   const mimetype = file.mimetype;

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
  }

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: baseFolder === "projects"
        ? 300 * 1024 * 1024 // ✅ עד 300MB לקובצי פרויקט
        : 30 * 1024 * 1024  // עד 30MB לשאר
    },
  });
};

// ✅ Middleware-ים לפי סוג העלאה
module.exports = {
  uploadApproval: createMulter("approvalDocuments"),
  uploadProject: createMulter("projects"),
  uploadProfile: createMulter("profileImages"),
};