// back-end/utils/serializers.utils.js
/**
 * שכבת סיריאלייזרים שמחזירה “מבנה API” אחיד:
 * מסננת שדות רגישים, בונה URLs, ושולטת בחשיפת קבצים לפי הרשאות viewer.
 */
const { buildFileUrl } = require('../utils/url.utils');

/**
 * Utilities
 */
const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const safeStr = (v) => (typeof v === 'string' ? v.trim() : '');
const safeBool = (v) => Boolean(v);
const safeNum = (v) => (typeof v === 'number' ? v : undefined);
const safeArr = (v) => (Array.isArray(v) ? v : []);

/**
 * buildAbsoluteUrl
 * אם profileImage שמור כנתיב יחסי (למשל "/api/files/profileImages/...."),
 * ניתן לספק baseUrl (למשל "http://localhost:5000") כדי להפוך ל-URL מלא.
 * אם כבר שמור כ-URL מלא – נשתמש בו כמות שהוא.
 */
const buildAbsoluteUrl = (maybeUrl, baseUrl) => {
  const val = safeStr(maybeUrl);
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val; // כבר URL מלא
  if (!baseUrl) return val; // אין baseUrl – נחזיר כמו שהוא
  return `${baseUrl.replace(/\/+$/, '')}/${val.replace(/^\/+/, '')}`;
};

/**
 * pickUserPublic
 * מחזיר משתמש “בטוח” לפרונט ללא שדות רגישים (password/tokens וכו’).
 * לאדמין מאפשר הרחבה מוגבלת (כמו approvalDocument) בלי לחשוף נתיבי דיסק.
 */
const pickUserPublic = (userDoc, { forRole, baseUrl } = {}) => {
  const u = toPlain(userDoc) || {};

  const userBase = {
    id: String(u._id || ''),
    username: safeStr(u.username),
    email: safeStr(u.email),
    role: safeStr(u.role),
    isVerified: safeBool(u.isVerified),
    isApproved: safeBool(u.isApproved),
    bio: safeStr(u.bio),
    profileImage: buildAbsoluteUrl(u.profileImage, baseUrl),

    // שדות פרופיל “רכים”
    firstName: safeStr(u.firstName),
    lastName: safeStr(u.lastName),
    city: safeStr(u.city),
    country: safeStr(u.country),
    birthDate: u.birthDate ? new Date(u.birthDate) : null,
    phone: safeStr(u.phone),
    paypalEmail: safeStr(u.paypalEmail),
    social: {
      website: safeStr(u?.social?.website),
      instagram: safeStr(u?.social?.instagram),
      dribbble: safeStr(u?.social?.dribbble),
      behance: safeStr(u?.social?.behance),
      linkedin: safeStr(u?.social?.linkedin),
      github: safeStr(u?.social?.github),
    },

    createdAt: u.createdAt || undefined,
    updatedAt: u.updatedAt || undefined,
  };

  // הרחבות לאדמין בלבד
  if (forRole === 'admin') {
    userBase.flags = {
      pendingApproval: !(u.role === 'customer') && !safeBool(u.isApproved),
    };

    // URL למסמך אישור (לא נתיב דיסק)
    if (u.approvalDocument) {
      userBase.approvalDocument = buildAbsoluteUrl(u.approvalDocument, baseUrl);
    }
  }

  return userBase;
};

/**
 * pickProjectPublic
 * מחזיר פרויקט בפורמט אחיד:
 * media תמיד חשוף, files רגישים נחשפים רק לבעלים/אדמין/קונה ששילם לפי viewer.
 */
const pickProjectPublic = (projectDoc, { req, viewer } = {}) => {
  const p = toPlain(projectDoc) || {};

  const isAdmin = viewer?.role === 'admin';
  const isOwner = viewer?.id && String(viewer.id) === String(p.createdBy?._id || p.createdBy);

  // ✅ חדש: גם קונה ששילם יכול לראות files רגישים
  // ברירת מחדל: אם לא העבירו canAccessFiles, נשאר owner/admin בלבד
  const canAccessFiles = isOwner || isAdmin || viewer?.canAccessFiles === true;

  // מדיה ציבורית (תמיד)
  const media = safeArr(p.files)
    .filter((f) => f.fileType === 'image' || f.fileType === 'video')
    .map((f) => {
      const filename = safeStr(f.filename);
      const savedUrl = safeStr(f.path); // URL תקין שנשמר בזמן יצירה
      const url =
        savedUrl || (filename ? buildFileUrl(req, ['projects', 'projectImages'], filename) : '');
      return {
        id: String(f._id || ''),
        filename,
        fileType: safeStr(f.fileType),
        url,
      };
    });

  // mainImageUrl (נוח לפרונט)
  const mainImage = safeArr(p.files).find((f) => String(f._id) === String(p.mainImageId));
  const mainImageUrl = mainImage
    ? safeStr(mainImage.path) ||
      (safeStr(mainImage.filename)
        ? buildFileUrl(req, ['projects', 'projectImages'], safeStr(mainImage.filename))
        : '')
    : '';

  // קבצים רגישים
  const documentsRaw = safeArr(p.files).filter(
    (f) => !(f.fileType === 'image' || f.fileType === 'video')
  );

  const files = canAccessFiles
    ? documentsRaw.map((f) => {
        const filename = safeStr(f.filename);
        const savedUrl = safeStr(f.path);
        const url =
          savedUrl || (filename ? buildFileUrl(req, ['projects', 'projectFiles'], filename) : '');
        return {
          id: String(f._id || ''),
          filename,
          fileType: safeStr(f.fileType),
          url,
        };
      })
    : undefined;

  return {
    id: String(p._id || ''),
    title: safeStr(p.title),
    description: safeStr(p.description),
    category: safeStr(p.category),
    price: safeNum(p.price),
    createdBy: p.createdBy ? String(p.createdBy._id || p.createdBy) : undefined,
    tags: safeArr(p.tags).map(safeStr).filter(Boolean),
    isSold: safeBool(p.isSold),

    // מצב פרסום — רק לאדמין/בעלים
    isPublished: isAdmin || isOwner ? safeBool(p.isPublished) : undefined,

    mainImageId: p.mainImageId ? String(p.mainImageId) : undefined,
    mainImageUrl,

    media, // תמיד חשוף
    hasFiles: documentsRaw.length > 0,
    files, // ✅ Owner/Admin/PAID buyer

    averageRating: safeNum(p.averageRating) ?? 0,
    reviewsCount: safeNum(p.reviewsCount) ?? 0,

    createdAt: p.createdAt || undefined,
    updatedAt: p.updatedAt || undefined,
  };
};

/**
 * pickReviewPublic
 * מחזיר ביקורת עם מידע מחבר בסיסי + flags canEdit/canDelete לפי viewer.
 * מאפשר לפרונט להחליט אם להציג כפתורי עריכה/מחיקה בלי לשכפל לוגיקה.
 */
const pickReviewPublic = (reviewDoc, { viewer } = {}) => {
  const r = toPlain(reviewDoc) || {};

  const authorId = String(r.userId?._id || r.userId || '');
  const viewerId = viewer?.id ? String(viewer.id) : undefined;
  const viewerRole = viewer?.role;

  const canEdit = viewerId && viewerId === authorId; // רק יוצר יכול לערוך
  const canDelete = canEdit || viewerRole === 'admin'; // יוצר או אדמין

  return {
    id: String(r._id || ''),
    projectId: String(r.projectId?._id || r.projectId || ''),
    user: r.userId
      ? {
          id: String(r.userId._id || ''),
          username: safeStr(r.userId.username),
          profileImg: safeStr(r.userId.profileImage),
        }
      : undefined,
    rating: safeNum(r.rating) ?? 0,
    text: safeStr(r.text),
    canEdit,
    canDelete,
    createdAt: r.createdAt || undefined,
    updatedAt: r.updatedAt || undefined,
  };
};

// ---- Project stats ----
const pickProjectStats = (projectDoc) => {
  const p = toPlain(projectDoc) || {};
  return {
    id: String(p._id || ''),
    title: safeStr(p.title),
    averageRating: safeNum(p.averageRating) ?? 0,
    reviewsCount: safeNum(p.reviewsCount) ?? 0,
    isPublished: safeBool(p.isPublished),
  };
};

const pickUserProfilePublic = (user, { baseUrl } = {}) => {
  if (!user) return null;

  const u = user.toObject ? user.toObject() : user;

  return {
    id: String(u._id || ''),
    username: safeStr(u.username),
    bio: safeStr(u.bio),
    profileImage: buildAbsoluteUrl(u.profileImage, baseUrl),

    firstName: safeStr(u.firstName),
    lastName: safeStr(u.lastName),
    city: safeStr(u.city),
    country: safeStr(u.country),
    birthDate: u.birthDate ? new Date(u.birthDate) : null,
    social: {
      website: safeStr(u?.social?.website),
      instagram: safeStr(u?.social?.instagram),
      dribbble: safeStr(u?.social?.dribbble),
      behance: safeStr(u?.social?.behance),
      linkedin: safeStr(u?.social?.linkedin),
      github: safeStr(u?.social?.github),
    },

    createdAt: u.createdAt || undefined,
  };
};

module.exports = {
  pickUserPublic,
  pickProjectPublic,
  pickReviewPublic,
  pickProjectStats,
  pickUserProfilePublic,
};
