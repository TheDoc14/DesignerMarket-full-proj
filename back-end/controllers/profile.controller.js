// back-end/controllers/profile.controller.js
const User = require('../models/Users.models');
const Project = require('../models/Project.model');
const { pickUserPublic } = require('../utils/serializers.utils');
const { getBaseUrl, buildFileUrl } = require('../utils/url.utils'); 

/**
 * 📄 שליפת פרופיל המשתמש המחובר
 * כולל כל הפרויקטים שהעלה
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new Error('User not found');

    const projects = await Project.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

    const baseUrl = getBaseUrl(req);
    const safeUser = pickUserPublic(user, { forRole: user.role, baseUrl });

    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: safeUser,
      projects, // אפשר להוסיף סיריאלייזר לפרויקטים בהמשך אם נרצה תצוגה "רזה"
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 🧾 עדכון פרטי פרופיל
 * - מעדכנים רק שדות מותרים
 * - בדיקת ייחודיות לשם משתמש אם שונה (usernameLower)
 * - עדכון תמונת פרופיל עם buildFileUrl
 * - אין trim כאן — הסכמה מטפלת ב-trim
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      username,
      firstName,
      lastName,
      bio,
      city,
      country,
      phone,
      birthDate, // צפוי ISO string (YYYY-MM-DD) מהפרונט
    } = req.body;

    const updates = {};

    // שינוי שם משתמש: נורמליזציה ל-lower + בדיקת ייחודיות
    if (typeof username === 'string' && username) {
      const proposedLower = String(username).toLowerCase();

      const current = await User.findById(req.user.id).select('usernameLower');
      if (!current) throw new Error('User not found for update');

      if (current.usernameLower !== proposedLower) {
        const taken = await User.findOne({ usernameLower: proposedLower });
        if (taken) throw new Error('Username already taken');
      }

      updates.username = username;            // הסכמה תבצע trim
      updates.usernameLower = proposedLower;  // לשדה האינדקס
    }

    // שדות טקסטואליים (הסכמה מבצעת trim)
    if (typeof firstName === 'string') updates.firstName = firstName;
    if (typeof lastName === 'string') updates.lastName = lastName;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof city === 'string') updates.city = city;
    if (typeof country === 'string') updates.country = country;
    if (typeof phone === 'string') updates.phone = phone;

    // birthDate אופציונלי; אם סופק – אימות תאריך
    if (birthDate) {
      const d = new Date(birthDate);
      if (isNaN(d.getTime())) throw new Error('Invalid birthDate format (expected ISO date)');
      updates.birthDate = d;
    }

    // תמונת פרופיל חדשה (multer) — בניית URL דרך ה-URL utils
    if (req.file) {
      updates.profileImage = buildFileUrl(req, 'profileImages', req.file.filename);
    }

    // בתוך updateMyProfile, אחרי שפירקת את req.body:
    const social = req.body.social || {};
    ['website','instagram','behance','dribbble','linkedin','github'].forEach((k) => {
      if (typeof social[k] === 'string') {
        updates[`social.${k}`] = social[k]; // trim ייעשה ע"י הסכמה
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedUser) throw new Error('User not found for update');

    const baseUrl = getBaseUrl(req);
    const safeUser = pickUserPublic(updatedUser, { forRole: updatedUser.role, baseUrl });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, updateMyProfile };