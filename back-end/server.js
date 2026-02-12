//back-end/server.js
/**
 * server.js
 * נקודת הכניסה של השרת: middlewares כלליים, חיבור למסד, רישום ראוטים, וטיפול שגיאות אחיד.
 * שומר על סדר נכון: parsing -> routes -> 404 -> errorHandler, כדי שכל throw new Error יגיע למנהל השגיאות.
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const helmet = require('helmet');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const isProd = process.env.NODE_ENV === 'production';
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// ✅ ייבוא ראוטים
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const projectRoutes = require('./routes/project.routes');
const fileRoutes = require('./routes/file.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const orderRoutes = require('./routes/order.routes');
const businessRoutes = require('./routes/business.routes');
const aiRoutes = require('./routes/ai.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { requestIdMiddleware } = require('./middleware/requestId.middleware');
const { ensureBaseRoles } = require('./utils/bootstrapRbac.utils');
const { ensureBaseCategories } = require('./utils/bootstrapCategories.utils');

// ✅ מידלוורים כלליים

// ✅ sanitize ONLY mongo keys ($ and .) to prevent NoSQL injection
// ⚠️ IMPORTANT: do NOT touch string values (we store permissions like "admin.panel.access")
const sanitizeMongoKeysOnly = (data) => {
  if (Array.isArray(data)) return data.map(sanitizeMongoKeysOnly);

  if (data && typeof data === 'object' && data.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      const safeKey = String(k).replace(/\$/g, '').replace(/\./g, '');
      out[safeKey] = sanitizeMongoKeysOnly(v);
    }
    return out;
  }

  return data; // keep primitives (strings) as-is
};

/**
 * 🛡️ Security headers (Helmet)
 * מוסיף HTTP Security Headers בסיסיים (Best Practice ל-Express).
 *
 * התאמות אצלנו:
 * - API מחזיר JSON (לא מגישים HTML) → לא מסתבכים עם CSP בשלב הזה.
 * - יש לנו /api/files לתמונות/קבצים שעשויים להיטען מהפרונט (Cross-Origin) → מאפשרים cross-origin resources.
 * - מבטלים COEP כדי למנוע חסימות בפיתוח/טעינת משאבים.
 * - HSTS רק בפרודקשן ורק אם עובדים עם HTTPS (אחרת זה עלול “להכריח” https).
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: isProd ? undefined : false,
  })
);

// 🔒 לא לחשוף טכנולוגיה (בנוסף למה ש-helmet עושה)
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize({ customSanitizer: (data, _options) => sanitizeMongoKeysOnly(data) }));
app.use(requestIdMiddleware);

/**
 * ✅ Routes mounting
 * כל ראוט מקבל prefix ברור תחת /api כדי לשמור על מבנה עקבי בפרונט ובבדיקות:
 * /api/auth, /api/profile, /api/projects, /api/files, /api/reviews, /api/admin
 */
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working fine 🚀' });
});

/**
 * ✅ 404 handler
 * מחזיר שגיאה אחידה לראוטים שלא קיימים (throw) כדי לעבור דרך errorHandler ולהחזיר JSON מסודר.
 */
app.use((_req, _res, _next) => {
  throw new Error('Route not found');
});

app.use(errorHandler);

/**
 * ✅ startServer
 * מתחבר ל-MongoDB ומרים את השרת.
 * אם החיבור נכשל — נופלים בצורה “קשיחה” (process.exit) כי אין טעם להריץ API בלי DB.
 */
async function startServer() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ MongoDB connected successfully');

    await ensureBaseRoles();
    console.log('✅ RBAC base roles ensured');

    await ensureBaseCategories();
    console.log('✅ Base categories ensured');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
