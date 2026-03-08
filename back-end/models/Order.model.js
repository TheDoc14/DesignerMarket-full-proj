// back-end/models/Order.model.js
const mongoose = require('mongoose');

/*
 * Persistent order record for the marketplace payment lifecycle.
 * This schema links the buyer, seller, and purchased project,
 * while also storing financial values, provider identifiers,
 * payout tracking fields, and transaction state transitions.
 * It acts as the central source of truth for the full purchase flow.
 */

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
      enum: ['CREATED', 'APPROVED', 'PAID', 'PAYOUT_SENT', 'PAYOUT_FAILED', 'CANCELED', 'EXPIRED'],
      default: 'CREATED',
    },

    paypalOrderId: { type: String, default: '' },
    paypalCaptureId: { type: String, default: '' },

    payoutBatchId: { type: String, default: '' },
    payoutItemId: { type: String, default: '' },

    canceledAt: { type: Date, default: null },
    canceledReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
