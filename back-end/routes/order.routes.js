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

// כל משתמש מחובר יכול לרכוש
router.post(
  '/paypal/create',
  authMiddleware,
  permit('admin', 'student', 'designer', 'customer'),
  createPaypalOrderValidators,
  validate,
  paypalCreateOrder
);

router.post(
  '/paypal/capture',
  authMiddleware,
  permit('admin', 'student', 'designer', 'customer'),
  capturePaypalOrderValidators,
  validate,
  paypalCaptureOrder
);

router.get('/paypal/return', (req, res) => res.status(200).send('PAYPAL RETURN OK'));
router.get('/paypal/cancel', (req, res) => res.status(200).send('PAYPAL CANCEL OK'));

module.exports = router;
