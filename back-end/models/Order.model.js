// back-end/models/Order.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    currency: { type: String, default: 'USD' },

    amountTotal: { type: Number, required: true }, // כמה הקונה שילם
    platformFee: { type: Number, default: 0 }, // העמלה של האתר
    sellerAmount: { type: Number, required: true }, // כמה עובר למוכר

    status: {
      type: String,
      enum: ['CREATED', 'APPROVED', 'PAID', 'PAYOUT_SENT', 'PAYOUT_FAILED', 'CANCELED'],
      default: 'CREATED',
    },

    paypalOrderId: { type: String, default: '' },
    paypalCaptureId: { type: String, default: '' },

    payoutBatchId: { type: String, default: '' },
    payoutItemId: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
