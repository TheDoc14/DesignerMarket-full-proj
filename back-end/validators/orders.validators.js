// back-end/validators/orders.validators.js
const { body } = require('express-validator');

const createPaypalOrderValidators = [
  body('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid request'),
];

const capturePaypalOrderValidators = [
  body('paypalOrderId').trim().notEmpty().withMessage('PayPal order id is required'),
];

module.exports = { createPaypalOrderValidators, capturePaypalOrderValidators };
