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
  isApproved: {
    type: Boolean,
    default: function () {
      // לקוחות לא צריכים אישור, השאר כן
      return this.role === 'customer';
    }
  },
  approvalDocument: {
    type: String,
    default: '' // מיקום הקובץ של תעודת האימות (למשל תמונה)
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
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
