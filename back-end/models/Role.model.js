// back-end/models/Role.model.js
const mongoose = require('mongoose');

/**
 * Role.model.js
 * RBAC דינמי אמיתי:
 * - כל Role הוא רשומה ב-DB
 * - לכל Role יש permissions (strings)
 * - Admin יכול להוסיף Role חדש בלי לגעת בקוד
 */
const roleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 40,
    },
    label: { type: String, default: '' }, // תצוגה יפה בפאנל
    permissions: { type: [String], default: [], index: true },
    isSystem: { type: Boolean, default: false }, // תפקידי מערכת שלא מאפשרים למחוק
  },
  { timestamps: true }
);

module.exports = mongoose.models.Role ? mongoose.models.Role : mongoose.model('Role', roleSchema);
