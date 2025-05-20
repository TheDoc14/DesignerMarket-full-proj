const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Email is invalid'],
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
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  // שדות לאימות מייל
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
