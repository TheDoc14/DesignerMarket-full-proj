// back-end/models/Project.model.js

const mongoose = require('mongoose');

// סכמה לייצוג קובץ בודד בפרויקט
const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'presentation','document','other'],
    required: [true, 'File type is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  }
}, { _id: true });

// סכמה מרכזית עבור פרויקט
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    minlength: 10
  },
  files: {
    type: [fileSchema],
    validate: {
      validator: arr => arr.length <= 10,
      message: 'Max 10 files allowed'
    }
  },
  mainImageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Main image ID is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  category: {
    type: String,
    enum: ['product','graphic','architecture','fashion','other'],
    default: 'other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  averageRating: { 
    type: Number, 
    default: 0 
  },
  reviewsCount:  {
    type: Number, 
    default: 0 
  },
  isSold: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// אם כבר קיים מודל בשם 'Project' – לא לרשום מחדש
module.exports = mongoose.models.Project
  ? mongoose.models.Project
  : mongoose.model('Project', projectSchema);