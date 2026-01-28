// back-end/validators/orders.validators.js
const { body } = require('express-validator');

/**
 * ✅ Orders Validators
 * אחריות: ולידציה לקלט של Orders לפני שהקונטרולר רץ.
 */

// POST /api/orders/create-paypal-order
const createPaypalOrderValidators = [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project id'),
];

// POST /api/orders/capture-paypal-order
const capturePaypalOrderValidators = [
  body('paypalOrderId').trim().notEmpty().withMessage('PayPal order id is required'),
];

module.exports = { createPaypalOrderValidators, capturePaypalOrderValidators };
