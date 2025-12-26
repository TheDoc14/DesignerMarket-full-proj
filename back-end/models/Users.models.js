// back-end/models/Users.models.js
const mongoose = require('mongoose');

/**
 * urlValidator
 * ולידציה לשדות social: מאפשר ריק, או כתובת http/https תקינה בלבד.
 * מונע שמירת ערכים שבורים שעלולים לשבור לינקים בפרונט.
 */
const urlValidator = {
  validator: (v) => !v || /^https?:\/\/[^\s]+$/i.test(v),
  message: 'Invalid URL',
};

const userSchema = new mongoose.Schema(
  {
    // שם משתמש גלוי למשתמש; נשמר כמו שהוזן, אך עם חיתוך רווחים
    username: {
      type: String,
      required: [true, 'Username is required'],
      minlength: 3,
      maxlength: 20,
      trim: true,
    },
    // עוזר לאכיפת ייחודיות Case-insensitive (eyal == EYAL)
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // אימייל – נוסיף trim+lowercase לשמירה עקבית
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/\S+@\S+\.\S+/, 'Email is invalid'],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['student', 'designer', 'customer', 'admin'],
      default: 'customer',
    },
    // מאושר ע"י אדמין (לקוחות – אוטומטי)
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role === 'customer';
      },
    },
    // תעודה לאימות סטודנט/מעצב (קישור לקובץ)
    approvalDocument: {
      type: String,
      default: '',
    },
    // אימות מייל
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    // ✨ שדות פרופיל רכים (לא חובה בהרשמה)
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    birthDate: {
      type: Date,
      min: new Date('1900-01-01'),
      max: () => new Date(), // לא מאפשר תאריך עתידי
      // לא חובה; mongoose כבר יודע להמיר ISO string ל-Date אוטומטית
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    social: {
      website: { type: String, trim: true, default: '', validate: urlValidator },
      instagram: { type: String, trim: true, default: '', validate: urlValidator },
      behance: { type: String, trim: true, default: '', validate: urlValidator },
      dribbble: { type: String, trim: true, default: '', validate: urlValidator },
      linkedin: { type: String, trim: true, default: '', validate: urlValidator },
      github: { type: String, trim: true, default: '', validate: urlValidator },
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

/**
 * userSchema.pre('validate')
 * דואג ש-usernameLower תמיד יתעדכן לפני שמירה.
 * מונע באגים שבהם username השתנה אבל lower לא — ושומר עקביות של האינדקס.
 */
userSchema.pre('validate', function (next) {
  if (this.username) this.usernameLower = this.username.toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);
