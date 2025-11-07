// controllers/file.controller.js
const fs = require('fs');
const path = require('path');

/**
 * 🧩 קונטרולר למשיכת קבצים מתוך uploads/
 * כולל:
 * - בדיקת קיום קובץ
 * - בקרת גישה לפי תיקייה ותפקיד
 * - העברת שגיאות ל־error.middleware
 */
const getFile = async (req, res, next) => {
  try {
    const { folder, filename } = req.params;
    const userRole = req.user?.role;
    const filePath = path.join(__dirname, '..', 'uploads', folder, filename);

    // בדיקה שהקובץ קיים
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // בקרת הרשאות לפי סוג התיקייה
    if (folder === 'approvalDocuments' && userRole !== 'admin') {
      throw new Error('Forbidden – only admin can access approval documents');
    }

    if (folder === 'projects' && !['admin', 'designer', 'student', 'customer'].includes(userRole)) {
      throw new Error('Unauthorized – invalid role for accessing project files');
    }

    if (folder === 'profileImages' && !userRole) {
      throw new Error('Unauthorized – user must be logged in');
    }

    // שליחה של הקובץ ללקוח אם הכול תקין
    res.sendFile(filePath);

  } catch (err) {
    next(err); // מעביר את כל השגיאות למנהל השגיאות הראשי
  }
};

module.exports = { getFile };
