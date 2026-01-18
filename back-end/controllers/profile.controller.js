// back-end/controllers/profile.controller.js
const User = require('../models/Users.models');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const { recalcProjectRatings } = require('../utils/reviews.utils');
const { pickUserPublic } = require('../utils/serializers.utils');
const {
  getBaseUrl,
  buildFileUrl,
  normalizeHttpUrl,
  isValidHttpUrl,
} = require('../utils/url.utils');
const { deleteUploadByFileUrl, deleteUploadByFsPath } = require('../utils/filesCleanup.utils');

/**
 * 👤 getMyProfile
 * מחזיר פרופיל של המשתמש המחובר, כולל רשימת הפרויקטים שהוא העלה.
 * מבצע שליפה מה־DB, ומחזיר משתמש מסוריאלייז (pickUserPublic) כדי לא לחשוף מידע רגיש.
 * מיועד למסך “My Profile / Wall” של המשתמש עצמו.
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
 * ✏️ updateMyProfile
 * מעדכן שדות מותרים בלבד בפרופיל (כולל social), עם בדיקת ייחודיות ל־usernameLower אם השתנה.
 * תומך בהעלאת תמונת פרופיל חדשה (multer), ובנוסף מוחק את התמונה הישנה (best-effort) כדי לחסוך מקום.
 * social עובר normalize (הוספת https:// במידת הצורך) + ולידציה “רכה” כדי לא להפיל עדכון על קישור לא תקין.
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    const {
      username,
      firstName,
      lastName,
      bio,
      city,
      country,
      phone,
      birthDate, // צפוי ISO string (YYYY-MM-DD) מהפרונט
      paypalEmail,
    } = body;

    // מביאים את המשתמש פעם אחת:
    // גם כדי לבדוק usernameLower וגם כדי לדעת מה profileImage הישן
    const current = await User.findById(req.user.id).select('usernameLower profileImage role');
    if (!current) throw new Error('User not found for update');

    const oldProfileUrl = current.profileImage || '';

    const updates = {};

    // שינוי שם משתמש: נורמליזציה ל-lower + בדיקת ייחודיות
    if (typeof username === 'string' && username) {
      const proposedLower = String(username).toLowerCase();

      if (current.usernameLower !== proposedLower) {
        const taken = await User.findOne({ usernameLower: proposedLower });
        if (taken) throw new Error('Username already taken');
      }

      updates.username = username; // הסכמה תבצע trim
      updates.usernameLower = proposedLower; // לשדה האינדקס
    }

    // שדות טקסטואליים (הסכמה מבצעת trim)
    if (typeof firstName === 'string') updates.firstName = firstName;
    if (typeof lastName === 'string') updates.lastName = lastName;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof city === 'string') updates.city = city;
    if (typeof country === 'string') updates.country = country;
    if (typeof phone === 'string') updates.phone = phone;

    // birthDate אופציונלי; אם סופק – אימות תאריך
    if (birthDate) updates.birthDate = new Date(birthDate);

    if (typeof body.paypalEmail === 'string') {
      const v = body.paypalEmail.trim().toLowerCase();

      // מאפשר לנקות
      updates.paypalEmail = v;
    }

    // תמונת פרופיל חדשה (multer) — בניית URL דרך ה-URL utils
    if (req.file) {
      updates.profileImage = buildFileUrl(req, 'profileImages', req.file.filename);
    }

    // ---- Social (רך, לא לשבור זרימה) ----
    // תומך גם אם social מגיע כמחרוזת JSON (נפוץ ב-form-data)
    let social = body.social || {};
    if (typeof social === 'string') {
      try {
        social = JSON.parse(social);
      } catch (_err) {
        // אם לא JSON תקין — נתעלם מ-social ולא נפיל את הבקשה
        social = {};
      }
    }

    const socialKeys = ['website', 'instagram', 'behance', 'dribbble', 'linkedin', 'github'];
    socialKeys.forEach((k) => {
      if (typeof social[k] === 'string') {
        const raw = social[k].trim();

        // מאפשר לנקות שדה
        if (!raw) {
          updates[`social.${k}`] = '';
          return;
        }

        // ✅ normalize: אם אין http(s) -> מוסיף https://
        const normalized = normalizeHttpUrl(raw);

        // אם עדיין לא תקין — רך: לא מעדכנים ולא מפילים את העדכון
        if (!isValidHttpUrl(normalized)) return;

        updates[`social.${k}`] = normalized; // trim ייעשה גם ע"י הסכמה
      }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) throw new Error('User not found for update');

    // ✅ cleanup: אם הוחלפה תמונת פרופיל — למחוק את הישנה (best-effort)
    if (updates.profileImage && oldProfileUrl && oldProfileUrl !== updates.profileImage) {
      try {
        deleteUploadByFileUrl(oldProfileUrl);
      } catch (_err) {
        // לא מפילים את הפעולה בגלל cleanup
      }
    }

    const baseUrl = getBaseUrl(req);
    const safeUser = pickUserPublic(updatedUser, { forRole: updatedUser.role, baseUrl });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (err) {
    if (req.file && req.file.path) {
      try {
        deleteUploadByFsPath(String(req.file.path));
      } catch (_err) {}
    }

    next(err);
  }
};

/**
 * 🗑️ deleteAccount (self/admin)
 * מוחק משתמש לפי id: מאפשר רק לבעל החשבון או לאדמין (ולא מאפשר למחוק admin).
 * כחלק מהמחיקה: מנקה קבצים אישיים, מוחק פרויקטים של המשתמש ומנקה קבצי פרויקט פיזיים, ומטפל במחיקת reviews וריענון דירוגים.
 * הפעולות “הכבדות” (ניקוי קבצים / recalc) מבוצעות בצורה best-effort כדי לא לתקוע את המערכת.
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isSelf = String(req.user.id) === String(id);
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) throw new Error('Access denied');

    const user = await User.findById(id).select('role profileImage approvalDocument');
    if (!user) throw new Error('User not found');

    // לא מאפשרים למחוק אדמין
    if (user.role === 'admin') throw new Error('Invalid request');

    // 1) מחיקת קבצים אישיים (best-effort)
    if (user.profileImage) {
      try {
        deleteUploadByFileUrl(String(user.profileImage));
      } catch (_err) {}
    }
    if (user.approvalDocument) {
      try {
        deleteUploadByFileUrl(String(user.approvalDocument));
      } catch (_err) {}
    }

    // 2) להביא את כל הפרויקטים של המשתמש
    const ownedProjects = await Project.find({ createdBy: id }).select('_id files');
    const ownedProjectIds = ownedProjects.map((p) => p._id);

    // 3) למחוק קבצים פיזיים של הפרויקטים (best-effort)
    for (const p of ownedProjects) {
      const files = Array.isArray(p.files) ? p.files : [];
      for (const f of files) {
        if (f && f.path) {
          try {
            deleteUploadByFileUrl(String(f.path));
          } catch (_err) {}
        }
      }
    }

    // 4) למחוק reviews של הפרויקטים שלו (כי הפרויקטים נמחקים)
    if (ownedProjectIds.length) {
      await Review.deleteMany({ projectId: { $in: ownedProjectIds } });
    }

    // 5) למחוק reviews שהמשתמש כתב על פרויקטים של אחרים + לעשות recalc אחר כך
    const affectedProjectIds = await Review.distinct('projectId', {
      userId: id,
      projectId: { $nin: ownedProjectIds },
    });

    await Review.deleteMany({ userId: id });

    // 6) למחוק את הפרויקטים שלו
    await Project.deleteMany({ createdBy: id });

    // 7) למחוק את המשתמש
    await User.findByIdAndDelete(id);

    // 8) recalc לפרויקטים שנשארו (שהושפעו ממחיקת reviews של המשתמש)
    if (affectedProjectIds && affectedProjectIds.length) {
      for (const pid of affectedProjectIds) {
        try {
          await recalcProjectRatings(String(pid));
        } catch (_err) {}
      }
    }

    return res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, updateMyProfile, deleteAccount };
