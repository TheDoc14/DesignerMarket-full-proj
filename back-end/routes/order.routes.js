// back-end/routes/order.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { paypalCreateOrder, paypalCaptureOrder } = require('../controllers/order.controller');
const {
  createPaypalOrderValidators,
  capturePaypalOrderValidators,
} = require('../validators/orders.validators');
const { ROLE_GROUPS } = require('../constants/roles.constants');

/**
 * 🛒 Order Routes
 * אחריות: יצירת והשלמת הזמנות PayPal.
 *
 */

// POST /api/orders/paypal/create
// כל משתמש מחובר יכול לרכוש
router.post(
  '/paypal/create',
  authMiddleware,
  permit(ROLE_GROUPS.ANY_AUTH),
  createPaypalOrderValidators,
  validate,
  paypalCreateOrder
);

// POST /api/orders/paypal/capture
// כל משתמש מחובר יכול להשלים רכישה
router.post(
  '/paypal/capture',
  authMiddleware,
  permit(ROLE_GROUPS.ANY_AUTH),
  capturePaypalOrderValidators,
  validate,
  paypalCaptureOrder
);

// GET /api/orders/paypal/return
// נקודת החזרה מ-PayPal לאחר תשלום מוצלח
// כרגע רק מחזיר סטטוס 200 OK
router.get('/paypal/return', (req, res) => res.status(200).json({ message: 'PayPal return OK' }));

// GET /api/orders/paypal/cancel
// נקודת ביטול מ-PayPal אם המשתמש ביטל את התשלום
// כרגע רק מחזיר סטטוס 200 OK
router.get('/paypal/cancel', (req, res) => res.status(200).json({ message: 'PayPal cancel OK' }));

module.exports = router;
