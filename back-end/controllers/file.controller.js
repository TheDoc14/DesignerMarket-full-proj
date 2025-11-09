// back-end/controllers/file.controller.js
const fs = require('fs');
const path = require('path');

/**
 * שליפת קובץ מהמערכת (עם בקרת הרשאות לפי סוג תיקייה)
 */
const getFile = async (req, res, next) => {
  try {
    // נזהה את סוג התיקייה מתוך הנתיב
    const parts = req.path.split('/').filter(Boolean); // ['profileImages','filename.jpg'] או ['projects','projectFiles','filename.pdf']
    const folder = parts[0];
    const subfolder = parts.length === 3 ? parts[1] : null;
    const filename = decodeURIComponent(parts[parts.length - 1]); // ✅ מפענח רווחים כמו %20
    const userRole = req.user?.role;

    console.log('🔍 Folder:', folder, '| Subfolder:', subfolder, '| File:', filename);


    if (!folder || !filename) {
      throw new Error('Invalid request – missing folder or filename');
    }

    // נבנה את הנתיב לפי אם יש תת-תיקייה
    const filePath = subfolder
      ? path.join(__dirname, '..', 'uploads', folder, subfolder, filename)
      : path.join(__dirname, '..', 'uploads', folder, filename);

    // בדיקה שהקובץ קיים
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // בקרת הרשאות לפי סוג התיקייה
    if (folder === 'approvalDocuments' && userRole !== 'admin') {
      throw new Error('Forbidden – only admin can access approval documents');
    }

    if (folder === 'projects') {
      if (subfolder === 'projectFiles' && !['admin', 'designer', 'student'].includes(userRole)) {
        throw new Error('Unauthorized – only creators or admin can access project files');
      }
      // תמונות פתוחות לציבור
    }

    // שליחה ללקוח
    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
};

module.exports = { getFile };
