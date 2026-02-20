//back-end/models/AiMessage.model.js
const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiChat', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },

    // metadata שימושי לדמו + סטטיסטיקות
    model: { type: String, default: null },
    latencyMs: { type: Number, default: null },
    tokensIn: { type: Number, default: null },
    tokensOut: { type: Number, default: null },
  },
  { timestamps: true }
);

aiMessageSchema.index({ chatId: 1, createdAt: 1 });

module.exports = mongoose.model('AiMessage', aiMessageSchema);
