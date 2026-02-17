// back-end/models/AiChat.model.js
const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    // העדפת שפה של המשתמש עבור ה-AI (he/en וכו')
    language: { type: String, default: 'en', index: true },

    // כותרת לשיחה (אפשר לקבוע אוטומטית בשיחה הראשונה)
    title: { type: String, default: 'New AI Chat' },

    // soft delete
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// חיפוש מהיר של שיחות משתמש על פרויקט
aiChatSchema.index({ ownerId: 1, projectId: 1, deletedAt: 1 });

module.exports = mongoose.model('AiChat', aiChatSchema);
