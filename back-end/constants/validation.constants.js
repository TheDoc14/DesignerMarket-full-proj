// back-end/constants/validation.constants.js

// Define validation limits and sorting options
const LIMITS = Object.freeze({
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
});

// Define sortable fields for different entities
const SORT_FIELDS = Object.freeze({
  PROJECTS: ['createdAt', 'price', 'averageRating', 'reviewsCount'],
  REVIEWS: ['createdAt', 'rating'],
  PROFILE_PROJECTS_ME: [
    'createdAt',
    'price',
    'averageRating',
    'reviewsCount',
    'title',
    'isPublished',
    'isSold',
  ],
  PROFILE_PROJECTS_PUBLIC: ['createdAt', 'updatedAt', 'price', 'title'],
});

// Define order values
const ORDER_VALUES = Object.freeze(['asc', 'desc']);

module.exports = { LIMITS, SORT_FIELDS, ORDER_VALUES };
