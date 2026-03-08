// back-end/controllers/order.controller.js
const Order = require('../models/Order.model');
const Project = require('../models/Project.model');
const User = require('../models/Users.models');
const { createPaypalOrder, capturePaypalOrder, sendPayout } = require('../utils/paypal.utils');
const { ok } = require('../utils/response.utils');
const { getPaging, toSort } = require('../utils/query.utils');
const { buildMeta } = require('../utils/meta.utils');

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 0); // אפשר 0 אם ויתרת
const PENDING_TTL_MIN = Number(process.env.ORDER_PENDING_TTL_MIN || 30);

const markOrderCanceled = async (order, reason = 'canceled') => {
  order.status = 'CANCELED';
  order.canceledAt = new Date();
  order.canceledReason = reason;
  await order.save();
  return order;
};

const markOrderExpired = async (order, reason = 'expired') => {
  order.status = 'EXPIRED';
  order.canceledAt = new Date();
  order.canceledReason = reason;
  await order.save();
  return order;
};

/*
 * Create a new marketplace order before redirecting the buyer to PayPal.
 * This function validates the project, blocks invalid purchase scenarios,
 * calculates marketplace financial values, stores an internal pending order,
 * and then creates the external PayPal order.
 * The backend owns this flow to prevent client-side tampering with payment data.
 */

const paypalCreateOrder = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    const project = await Project.findById(projectId).select(
      'price isPublished createdBy isSold title'
    );
    if (!project) throw new Error('Project not found');
    if (!project.isPublished) throw new Error('Access denied');

    if (String(project.createdBy) === String(req.user.id)) {
      throw new Error('Cannot purchase your own project');
    }

    const pendingOrder = await Order.findOne({
      projectId: project._id,
      buyerId: req.user.id,
      status: { $in: ['CREATED', 'APPROVED'] },
    }).select('_id status paypalOrderId updatedAt createdAt');

    if (pendingOrder) {
      const ttlMs = PENDING_TTL_MIN * 60 * 1000;
      const last = pendingOrder.updatedAt || pendingOrder.createdAt;
      const isStale = last && Date.now() - new Date(last).getTime() > ttlMs;

      // אם ההזמנה "ישנה" – נסגור אותה כדי לא לחסום את המשתמש
      if (isStale) {
        await markOrderExpired(pendingOrder, 'auto-expired (retry allowed)');
      } else {
        const e = new Error('Order already pending for this project');
        e.statusCode = 409;
        e.details = {
          orderId: String(pendingOrder._id),
          paypalOrderId: pendingOrder.paypalOrderId || '',
          status: pendingOrder.status,
        };
        throw e;
      }
    }

    const seller = await User.findById(project.createdBy).select('paypalEmail');
    if (!seller) throw new Error('User not found');
    if (!seller.paypalEmail) throw new Error('Seller PayPal email missing');

    const total = Number(project.price);
    if (!Number.isFinite(total) || total <= 0) throw new Error('Invalid request');

    const fee = PLATFORM_FEE_PERCENT > 0 ? (total * PLATFORM_FEE_PERCENT) / 100 : 0;
    const sellerAmount = total - fee;

    const currency = (process.env.PAYPAL_CURRENCY || 'USD').toUpperCase();

    // 1) ליצור הזמנה פנימית DB
    const order = await Order.create({
      projectId: project._id,
      buyerId: req.user.id,
      sellerId: project.createdBy,
      currency,
      amountTotal: total,
      platformFee: fee,
      sellerAmount,
      status: 'CREATED',
    });

    // ✅ חדש: לבנות return/cancel URL כדי ש-PayPal לא ייכנס ללופ
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`; // עובד בלוקאל וגם בשרת

    const returnUrl = `${base}/api/orders/paypal/return`;
    const cancelUrl = `${base}/api/orders/paypal/cancel`;

    // 2) ליצור הזמנה ב-PayPal
    const { paypalOrderId, approveLink } = await createPaypalOrder({
      currency,
      value: total,
      returnUrl,
      cancelUrl,
    });

    order.paypalOrderId = paypalOrderId;
    await order.save();

    return res.status(200).json({
      message: 'PayPal order created',
      order: {
        id: String(order._id),
        paypalOrderId,
        approveLink,
        amountTotal: total,
        currency,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*
 * Complete the purchase after the buyer approves the payment on PayPal.
 * This function validates order ownership and state, captures the payment,
 * updates the internal order record, marks the project as sold,
 * and automatically sends the seller payout.
 * It also records payout failure states to keep the transaction lifecycle auditable.
 */

const paypalCaptureOrder = async (req, res, next) => {
  try {
    const { paypalOrderId } = req.body;

    const order = await Order.findOne({ paypalOrderId });
    if (!order) throw new Error('Order not found');

    // רק הקונה יכול לבצע capture אצלנו
    if (String(order.buyerId) !== String(req.user.id)) throw new Error('Access denied');

    if (['PAID', 'PAYOUT_SENT', 'PAYOUT_FAILED'].includes(order.status)) {
      throw new Error('Order already processed');
    }
    if (order.status === 'CANCELED') {
      throw new Error('Order is canceled');
    }
    if (!['CREATED', 'APPROVED'].includes(order.status)) {
      throw new Error('Invalid order state');
    }

    const { status, captureId } = await capturePaypalOrder(paypalOrderId);
    if (status !== 'COMPLETED') throw new Error('PayPal capture failed');

    order.status = 'PAID';
    order.paypalCaptureId = captureId || '';
    await order.save();

    // לסמן פרויקט כ-sold אחרי התשלום הראשון (אבל עדיין מאפשרים עוד רכישות)
    await Project.findByIdAndUpdate(order.projectId, { isSold: true });

    // payout למוכר (אוטומטי)
    const seller = await User.findById(order.sellerId).select('paypalEmail');
    if (!seller || !seller.paypalEmail) throw new Error('Seller PayPal email missing');

    const payout = await sendPayout({
      receiverEmail: seller.paypalEmail,
      currency: order.currency,
      value: Number(order.sellerAmount),
      note: 'Designer Market sale payout',
    });

    order.status = 'PAYOUT_SENT';
    order.payoutBatchId = payout.payoutBatchId;
    order.payoutItemId = payout.payoutItemId;
    await order.save();

    return res.status(200).json({
      message: 'Payment captured and payout sent',
      order: {
        id: String(order._id),
        status: order.status,
        paypalOrderId: order.paypalOrderId,
        paypalCaptureId: order.paypalCaptureId,
      },
    });
  } catch (err) {
    // אם payout נכשל — נסמן ב-DB כדי שתדע שזה תשלום התקבל אבל payout נכשל
    try {
      const { paypalOrderId } = req.body;
      const order = await Order.findOne({ paypalOrderId });
      if (order && order.status === 'PAID') {
        order.status = 'PAYOUT_FAILED';
        await order.save();
      }
    } catch (_e) {}

    next(err);
  }
};

/*
 * Handle the return path from PayPal after buyer approval.
 * If the user returns from the provider before the capture step is completed,
 * the system marks the order as APPROVED so the transaction stage remains traceable.
 */

const paypalReturn = async (req, res, next) => {
  try {
    // PayPal שולח token=PAYPAL_ORDER_ID ברוב הזרימות
    const paypalOrderId = String(req.query.token || '').trim();
    if (!paypalOrderId) throw new Error('Missing PayPal order id');

    const order = await Order.findOne({ paypalOrderId });
    if (!order) throw new Error('Order not found');

    // אם כבר שולם/טופל — לא שוברים כלום
    if (['PAID', 'PAYOUT_SENT', 'PAYOUT_FAILED'].includes(order.status)) {
      return res.status(200).json({
        message: 'PayPal return OK',
        order: { id: String(order._id), status: order.status },
      });
    }

    // אם המשתמש חזר בלי capture (או משהו נשבר בדרך) — נסמן כ-APPROVED בלבד
    // (אפשר גם להשאיר CREATED, אבל APPROVED עוזר להבין שהמשתמש הגיע מפייפאל)
    if (order.status === 'CREATED') {
      order.status = 'APPROVED';
      await order.save();
    }

    return res.status(200).json({
      message: 'PayPal return OK',
      order: { id: String(order._id), status: order.status, paypalOrderId: order.paypalOrderId },
    });
  } catch (err) {
    next(err);
  }
};

/*
 * Handle the cancellation path from PayPal.
 * Pending orders are explicitly marked as canceled so they do not block
 * future purchase attempts for the same project.
 */

const paypalCancel = async (req, res, next) => {
  try {
    const paypalOrderId = String(req.query.token || '').trim();
    if (!paypalOrderId) throw new Error('Missing PayPal order id');

    const order = await Order.findOne({ paypalOrderId });
    if (!order) throw new Error('Order not found');

    // אם עוד pending — לבטל כדי לא לחסום קנייה עתידית
    if (['CREATED', 'APPROVED'].includes(order.status)) {
      await markOrderCanceled(order, 'paypal-cancel');
    }

    return res.status(200).json({
      message: 'PayPal cancel OK',
      order: { id: String(order._id), status: order.status, paypalOrderId: order.paypalOrderId },
    });
  } catch (err) {
    next(err);
  }
};

/*
 * Allow the buyer to manually cancel a still-pending order.
 * This recovery path prevents users from getting stuck with unfinished transactions.
 */

const cancelMyPendingOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new Error('Order not found');

    if (String(order.buyerId) !== String(req.user.id)) throw new Error('Access denied');

    if (!['CREATED', 'APPROVED'].includes(order.status)) throw new Error('Invalid order state');

    await markOrderCanceled(order, 'user-cancel');

    return res.status(200).json({
      message: 'Order canceled',
      order: { id: String(order._id), status: order.status },
    });
  } catch (err) {
    next(err);
  }
};

/*
 * Return the authenticated buyer's order history with filtering, sorting, and pagination.
 * This endpoint supports transparency for the user and allows the frontend
 * to detect existing pending or completed purchases for a project.
 */
const listMyOrders = async (req, res, next) => {
  try {
    const buyerId = req.user.id;

    // Pagination
    const { page, limit, skip } = getPaging(req.query, 20);

    // Filters
    const filter = { buyerId };

    // status filter (optional)
    if (req.query.status) {
      filter.status = String(req.query.status).trim().toUpperCase();
    }

    // project filter (optional)
    if (req.query.projectId) {
      filter.projectId = String(req.query.projectId).trim();
    }

    // Sorting
    const sort = toSort(
      req.query.sortBy,
      req.query.order,
      ['createdAt', 'updatedAt', 'status', 'amountTotal'],
      'createdAt'
    );

    // Query
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('projectId', 'title price isSold isPublished')
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Shape response (clean + stable)
    const data = (items || []).map((o) => ({
      id: String(o._id),
      status: o.status,
      currency: o.currency,
      amountTotal: o.amountTotal,
      platformFee: o.platformFee,
      sellerAmount: o.sellerAmount,

      paypalOrderId: o.paypalOrderId || '',
      paypalCaptureId: o.paypalCaptureId || '',

      canceledAt: o.canceledAt || null,
      canceledReason: o.canceledReason || '',

      createdAt: o.createdAt,
      updatedAt: o.updatedAt,

      project: o.projectId
        ? {
            id: String(o.projectId._id),
            title: o.projectId.title,
            price: o.projectId.price,
            isPublished: o.projectId.isPublished,
            isSold: o.projectId.isSold,
          }
        : null,
    }));

    return ok(res, {
      message: 'My orders fetched',
      data,
      meta: buildMeta(total, page, limit),
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  paypalCreateOrder,
  paypalCaptureOrder,
  paypalReturn,
  paypalCancel,
  cancelMyPendingOrder,
  listMyOrders,
};
