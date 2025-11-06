// back-end/controllers/profile.controller.js
const User = require('../models/Users.models');
const Project = require('../models/Project.model');

/**
 * 📄 שליפת פרופיל המשתמש המחובר
 * כולל כל הפרויקטים שהעלה
 */
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) throw new Error('User not found');

    const projects = await Project.find({ createdBy: req.user.id });

    res.status(200).json({
      message: 'Profile fetched successfully',
      user,
      projects,
    });

  } catch (err) {next(err);}
};

/**
 * 🧾 עדכון פרטי פרופיל (שם, ביוגרפיה, תמונת פרופיל)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;

    const updates = {};
    if (username) updates.username = username;
    if (bio) updates.bio = bio;

    // תמונה חדשה
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`; // http://localhost:5000
      updates.profileImage = `${baseUrl}/uploads/profileImages/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) throw new Error('User not found for update');

    res.status(200).json({
      message: 'Profile updated successfully',
      updatedUser: {
        username: updatedUser.username,
        bio: updatedUser.bio,
        profileImage: updatedUser.profileImage,
      },
    });

  } catch (err) {next(err);}
};

module.exports = { getMyProfile, updateMyProfile };