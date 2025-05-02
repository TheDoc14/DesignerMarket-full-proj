require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes=require('./routes/auth.routes')
const profileRoutes = require('./routes/profile.routes');
const projectRoutes = require('./routes/project.routes');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);



async function startServer() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ MongoDB connected');
    
    app.get('/api/test', (req, res) => {
      try {
        res.json({ msg: 'API is working' });
      } catch (err) {
        console.error('❌ Error in test route:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to connect to DB:', err);
  }
}

startServer();
