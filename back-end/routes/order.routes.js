// back-end/routes/order.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  paypalCreateOrder,
  paypalCaptureOrder,
  paypalCancel,
  paypalReturn,
  cancelMyPendingOrder,
} = require('../controllers/order.controller');
const {
  createPaypalOrderValidators,
  capturePaypalOrderValidators,
} = require('../validators/orders.validators');

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
  createPaypalOrderValidators,
  validate,
  paypalCreateOrder
);

// POST /api/orders/paypal/capture
// כל משתמש מחובר יכול להשלים רכישה
router.post(
  '/paypal/capture',
  authMiddleware,
  capturePaypalOrderValidators,
  validate,
  paypalCaptureOrder
);

// GET /api/orders/paypal/return
// נקודת החזרה מ-PayPal לאחר תשלום מוצלח
// כרגע רק מחזיר סטטוס 200 OK
router.get('/paypal/return', paypalReturn);

// GET /api/orders/paypal/cancel
// נקודת ביטול מ-PayPal אם המשתמש ביטל את התשלום
// כרגע רק מחזיר סטטוס 200 OK
router.get('/paypal/cancel', paypalCancel);

// POST /api/orders/:id/cancel
// משתמשים יכולים לבטל הזמנות שהם יצרו, בתנאי שהן עדיין במצב "pending" (לא הושלמו).
router.post('/:id/cancel', authMiddleware, cancelMyPendingOrder);

module.exports = router;
