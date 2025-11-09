// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ✅ ייבוא ראוטים
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const projectRoutes = require('./routes/project.routes');
const fileRoutes = require('./routes/file.routes')
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ✅ מידלוורים כלליים
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ מאפשר גישה לקבצים סטטיים בתיקיית uploads
app.use('/uploads', express.static('uploads'));

// ✅ ראוטים עיקריים של המערכת
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files',fileRoutes)

app.get('/api/test', (req, res) => {
  res.json({ msg: 'API is working fine 🚀' });
});

app.use(errorHandler);

// ✅ חיבור למסד הנתונים והרצת השרת
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