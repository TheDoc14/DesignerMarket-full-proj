// back-end/controllers/system.controller.js

const User = require('../models/Users.models');
const Project = require('../models/Project.model');
const Review = require('../models/Review.model');
const Order = require('../models/Order.model');

const { buildMeta } = require('../utils/meta.utils');

/**
 * 👀 helper: meta for non-paginated dashboards
 */
const dashboardMeta = (totalItems = 0) => {
  // buildMeta(total, page, limit) קיים אצלכם לרשימות,
  // פה אנחנו משתמשים בו כדי לשמור אחידות “meta” גם בדשבורדים.
  const limit = totalItems || 1;
  return {
    ...buildMeta(totalItems, 1, limit),
    generatedAt: new Date().toISOString(),
  };
};

/**
 * 📊 systemGetStats
 * read-only סטטיסטיקות כלליות למנהל מערכת/אדמין.
 * מחזיר מבנה עשיר: totals + breakdowns.
 */
const systemGetStats = async (req, res, next) => {
  try {
    const [
      usersTotal,
      projectsTotal,
      reviewsTotal,
      ordersTotal,

      usersByRole,
      projectsByCategory,
      projectsByPublish,
      ordersByStatus,
    ] = await Promise.all([
      User.countDocuments({}),
      Project.countDocuments({}),
      Review.countDocuments({}),
      Order.countDocuments({}),

      // Users by role (dynamic roles)
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),

      // Projects by category
      Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),

      // Published vs Unpublished
      Project.aggregate([
        { $group: { _id: '$isPublished', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),

      // Orders by status
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

    const data = {
      totals: {
        users: usersTotal,
        projects: projectsTotal,
        reviews: reviewsTotal,
        orders: ordersTotal,
      },
      breakdowns: {
        usersByRole: usersByRole.map((x) => ({ role: x._id || 'unknown', count: x.count })),
        projectsByCategory: projectsByCategory.map((x) => ({
          category: x._id || 'uncategorized',
          count: x.count,
        })),
        projectsByPublish: projectsByPublish.map((x) => ({
          isPublished: Boolean(x._id),
          count: x.count,
        })),
        ordersByStatus: ordersByStatus.map((x) => ({ status: x._id || 'unknown', count: x.count })),
      },
    };

    return res.status(200).json({
      message: 'System stats fetched',
      meta: dashboardMeta(
        // בשביל meta.total — בחרתי “סה״כ נתונים בדשבורד” (לא קריטי, אבל עקבי)
        4
      ),
      stats: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 💰 systemGetFinance
 * סיכום פיננסים לפי Orders (read-only).
 * Money received = PAID / PAYOUT_SENT / PAYOUT_FAILED
 */
const systemGetFinance = async (req, res, next) => {
  try {
    const moneyStatuses = ['PAID', 'PAYOUT_SENT', 'PAYOUT_FAILED'];

    const [totalsAgg] = await Order.aggregate([
      { $match: { status: { $in: moneyStatuses } } },
      {
        $group: {
          _id: null,
          ordersCount: { $sum: 1 },
          grossRevenue: { $sum: '$amountTotal' },
          platformFees: { $sum: '$platformFee' },
          sellerPayouts: { $sum: '$sellerAmount' },
        },
      },
    ]);

    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Optional: last 10 paid orders (lightweight)
    const lastMoneyOrders = await Order.find({ status: { $in: moneyStatuses } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id status amountTotal platformFee sellerAmount createdAt projectId buyerId');

    const totals = totalsAgg || {
      ordersCount: 0,
      grossRevenue: 0,
      platformFees: 0,
      sellerPayouts: 0,
    };

    const finance = {
      totals: {
        ordersCount: totals.ordersCount,
        grossRevenue: totals.grossRevenue,
        platformFees: totals.platformFees,
        sellerPayouts: totals.sellerPayouts,
      },
      byStatus: byStatus.map((x) => ({ status: x._id || 'unknown', count: x.count })),
      recent: lastMoneyOrders.map((o) => ({
        id: String(o._id),
        status: o.status,
        amountTotal: o.amountTotal,
        platformFee: o.platformFee,
        sellerAmount: o.sellerAmount,
        createdAt: o.createdAt,
        projectId: o.projectId ? String(o.projectId) : null,
        buyerId: o.buyerId ? String(o.buyerId) : null,
      })),
      notes: { moneyStatuses },
    };

    return res.status(200).json({
      message: 'Finance stats fetched',
      meta: dashboardMeta(finance.recent.length),
      finance,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { systemGetStats, systemGetFinance };
