// middlewares/multer.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// סוגי קבצים מותרים
const allowed = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|ppt|pptx/;

// פונקציית יצירת multer לפי תיקייה וגבול גודל
const createMulter = (targetFolder) => {
  const fullPath = path.join('uploads', targetFolder);

  // יצירת תיקייה אם לא קיימת
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: targetFolder === 'projects' ? 100 * 1024 * 1024 : 20 * 1024 * 1024 // פרויקטים: 100MB, השאר: 20MB
    }
  });
};

module.exports = {
  uploadApproval: createMulter('approvalDocuments'),
  uploadProject: createMulter('projects'),
  uploadProfile: createMulter('profileImages')
};
