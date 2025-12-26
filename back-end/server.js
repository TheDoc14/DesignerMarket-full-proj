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

// ✅ ייבוא ראוטים
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const projectRoutes = require('./routes/project.routes');
const fileRoutes = require('./routes/file.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler } = require('./middleware/error.middleware');

// ✅ מידלוורים כלליים
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/api/test', (req, res) => {
  res.json({ msg: 'API is working fine 🚀' });
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

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();
