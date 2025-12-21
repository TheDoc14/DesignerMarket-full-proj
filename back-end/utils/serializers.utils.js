// back-end/utils/serializers.utils.js
const { buildFileUrl } = require('../utils/url.utils');
/**
 * Utilities
 */
const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const safeStr = (v) => (typeof v === 'string' ? v.trim() : '');
const safeBool = (v) => Boolean(v);
const safeNum  = (v) => (typeof v === 'number' ? v : undefined);
const safeArr  = (v) => (Array.isArray(v) ? v : []);

/**
 * buildAbsoluteUrl
 * אם profileImage שמור כנתיב יחסי (למשל "/api/files/profileImages/...."),
 * ניתן לספק baseUrl (למשל "http://localhost:5000") כדי להפוך ל-URL מלא.
 * אם כבר שמור כ-URL מלא – נשתמש בו כמות שהוא.
 */
const buildAbsoluteUrl = (maybeUrl, baseUrl) => {
  const val = safeStr(maybeUrl);
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;             // כבר URL מלא
  if (!baseUrl) return val;                               // אין baseUrl – נחזיר כמו שהוא
  return `${baseUrl.replace(/\/+$/, '')}/${val.replace(/^\/+/, '')}`;
};

/**
 * pickUserPublic
 * סיריאלייזר ראשי למשתמש. מחזיר רק שדות לא רגישים.
 * options:
 *   - forRole: תפקיד הצופה (למשל 'admin') – מאפשר להרחיב מעט מידע לאדמין
 *   - baseUrl: לצורך בניית כתובת אבסולוטית ל-profileImage אם שמור יחסי
 */
const pickUserPublic = (userDoc, { forRole, baseUrl } = {}) => {
  const u = toPlain(userDoc) || {};

  // אל תחזיר שדות רגישים:
  // password, verificationToken, usernameLower, resetPasswordToken, resetPasswordExpire, וכו'

  const userBase = {
    id:            String(u._id || ''),
    username:      safeStr(u.username),
    email:         safeStr(u.email),
    role:          safeStr(u.role),
    isVerified:    safeBool(u.isVerified),
    isApproved:    safeBool(u.isApproved),
    bio:           safeStr(u.bio),
    profileImage:  buildAbsoluteUrl(u.profileImage, baseUrl),

    // שדות פרופיל “רכים” שנוספו/יוספו (לא חובה בהרשמה):
    firstName:     safeStr(u.firstName),
    lastName:      safeStr(u.lastName),
    city:          safeStr(u.city),
    country:       safeStr(u.country),
    birthDate: u.birthDate ? new Date(u.birthDate) : null,
    phone:         safeStr(u.phone),
    social: {
      website:     safeStr(u?.social?.website),
      instagram:   safeStr(u?.social?.instagram),
      dribbble:    safeStr(u?.social?.dribbble),
      behance:     safeStr(u?.social?.behance),
      linkedin:    safeStr(u?.social?.linkedin),
      github:      safeStr(u?.social?.github),
    },

    // חותמות זמן בסיסיות לשקיפות למשתמש
    createdAt:     u.createdAt || undefined,
    updatedAt:     u.updatedAt || undefined,
  };

  // הרחבות לאדמין בלבד (זהירות לא לחשוף מידע רגיש)
  if (forRole === 'admin') {
    userBase.flags = {
      // דוגמה לדגלים/סטטוסים שמותרים לאדמין
      pendingApproval: !(u.role === 'customer') && !safeBool(u.isApproved),
    };
    // אם ממש צריך לתת לאדמין גישה ל-approvalDocument (URL בלבד, לא נתיב דיסק):
    if (u.approvalDocument) {
      userBase.approvalDocument = buildAbsoluteUrl(u.approvalDocument, baseUrl);
    }
  }

  return userBase;
};

/**
 * pickProjectPublic
 * אופציונלי: סיריאלייזר לפרויקט (אם תרצה עקביות גם בהחזרת פרויקטים).
 * אינו חושף דבר רגיש (למשל שבילי קבצים פנימיים – החזרנו רק URLs ציבוריים/מבוקרים).
 */
const pickProjectPublic = (projectDoc, { req, viewer } = {}) => {
  const p = toPlain(projectDoc) || {};

  const isAdmin = viewer?.role === 'admin';
  const isOwner = viewer?.id && String(viewer.id) === String(p.createdBy?._id || p.createdBy);

  // מדיה ציבורית (תמיד)
  const media = safeArr(p.files)
    .filter(f => f.fileType === 'image' || f.fileType === 'video')
    .map(f => {
      const filename = safeStr(f.filename);
      const legacyUrl = safeStr(f.path); // אם פעם נשמר URL מלא בשדה path
      const url = filename
        ? buildFileUrl(req, 'projectImages', filename)  // הדרך התקנית היום
        : legacyUrl;                                    // נפילה לאחור אם ישן
      return {
        id:       String(f._id || ''),
        filename,
        fileType: safeStr(f.fileType),
        url,
      };
    });

  // קבצים רגישים (Owner/Admin בלבד)
  const documentsRaw = safeArr(p.files)
    .filter(f => !(f.fileType === 'image' || f.fileType === 'video'));

  const files = (isOwner || isAdmin)
    ? documentsRaw.map(f => {
        const filename = safeStr(f.filename);
        const legacyUrl = safeStr(f.path);
        const url = filename
          ? buildFileUrl(req, 'projectFiles', filename)
          : legacyUrl;
        return {
          id:       String(f._id || ''),
          filename,
          fileType: safeStr(f.fileType),
          url,
        };
      })
    : undefined;

  return {
    id:          String(p._id || ''),
    title:       safeStr(p.title),
    description: safeStr(p.description),
    category:    safeStr(p.category),
    price:       safeNum(p.price),
    createdBy:   p.createdBy ? String(p.createdBy._id || p.createdBy) : undefined,
    mainImageId: p.mainImageId ? String(p.mainImageId) : undefined,
    media,                          // תמיד חשוף
    hasFiles: documentsRaw.length > 0,
    files,                          // Owner/Admin בלבד
    averageRating: safeNum(p.averageRating) ?? 0,
    reviewsCount:  safeNum(p.reviewsCount)  ?? 0,
    createdAt:   p.createdAt || undefined,
    updatedAt:   p.updatedAt || undefined,
  };
};

// ---- Review serializer ----
const pickReviewPublic = (reviewDoc, { viewer } = {}) => {
  const r = toPlain(reviewDoc) || {};
  const authorId = String(r.userId?._id || r.userId || '');
  const viewerId = viewer?.id ? String(viewer.id) : undefined;
  const viewerRole = viewer?.role;

  const canEdit   = viewerId && viewerId === authorId;           // רק יוצר יכול לערוך
  const canDelete = canEdit || viewerRole === 'admin';           // יוצר או אדמין

  return {
    id:        String(r._id || ''),
    projectId: String(r.projectId?._id || r.projectId || ''),
    user: r.userId ? {
      id:         String(r.userId._id || ''),
      username:   safeStr(r.userId.username),
      profileImg: safeStr(r.userId.profileImage), // כבר URL דרך /api/files/...
    } : undefined,
    rating:    safeNum(r.rating) ?? 0,
    text:      safeStr(r.text),
    canEdit,
    canDelete,
    createdAt: r.createdAt || undefined,
    updatedAt: r.updatedAt || undefined,
  };
};

module.exports = { pickUserPublic, pickProjectPublic, pickReviewPublic };