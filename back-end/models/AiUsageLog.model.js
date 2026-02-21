//back-end/models/AiUsageLog.model.js
const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiChat', default: null, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },

    // metadata שימושי לסטטיסטיקות בהמשך
    model: { type: String, default: null },
    latencyMs: { type: Number, default: null },
    promptChars: { type: Number, default: null },
    responseChars: { type: Number, default: null },
    tokensIn: { type: Number, default: null },
    tokensOut: { type: Number, default: null },

    outcome: { type: String, enum: ['success', 'fail'], required: true, index: true },
    errorCode: { type: String, default: null },
  },
  { timestamps: true }
);

// אינדקס יעיל לשאילתות "כמה היום"
aiUsageLogSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('AiUsageLog', aiUsageLogSchema);
