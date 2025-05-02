const multer = require('multer');
const path = require('path');

// הגדרת איפה לשמור קבצים בשרת
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // תיקיית uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // שם חדש לכל קובץ כדי למנוע התנגשויות
  }
});

// הגדרת פילטר לסוגי קבצים מותרים בלבד
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

// יצירת אובייקט Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 20 } // מגבלת גודל: 20MB לכל קובץ
});

module.exports = upload;
