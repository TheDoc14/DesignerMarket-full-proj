//back-end/utils/reviews.utils.js
const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const Project = require('../models/Project.model');

async function recalcProjectRatings(projectId) {
  const [res] = await Review.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: '$projectId', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
  ]);

  const averageRating = res?.avg || 0;
  const reviewsCount  = res?.cnt || 0;

  await Project.findByIdAndUpdate(projectId, { averageRating, reviewsCount });
}

module.exports = { recalcProjectRatings };