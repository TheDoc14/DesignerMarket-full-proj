const mongoose = require('mongoose');

// סכמה של קובץ בודד
const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'presentation'],
    required: [true, 'File type is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  }
}, { _id: true });

// סכמה של פרויקט
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    minlength: 10,
  },
  files: {
    type: [fileSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10 files']
  },
  mainImageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Main image ID is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  category: {
    type: String,
    enum: ['product', 'graphic', 'architecture', 'fashion', 'other'],
    default: 'other',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isSold: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// פונקציה שמגבילה עד 10 קבצים
function arrayLimit(val) {
  return val.length <= 10;
}

module.exports = mongoose.model('Project', projectSchema);
