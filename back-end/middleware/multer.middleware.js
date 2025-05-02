const multer = require('multer');
const path  = require('path');

// הגדרת אחסון הקבצים בתיקייה uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // מוסיף חותמת זמן לשם הקובץ המקורי למניעת התנגשויות
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// פילטר לסוגי קבצים מותרים בלבד
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|avi|mov|pdf/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // עד 20MB לכל קובץ
});
