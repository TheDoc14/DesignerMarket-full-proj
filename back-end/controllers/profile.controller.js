const User = require('../models/Users.models');
const Project = require('../models/Project.model');

// שליפת פרופיל משתמש מחובר
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const projects = await Project.find({ createdBy: req.user.id });

    res.status(200).json({ 
      user,
      projects
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// עדכון פרטי פרופיל
const updateMyProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    const updates = {};
    if (username) updates.username = username;
    if (bio) updates.bio = bio;
    if (req.file) updates.profileImage = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ message: 'Profile updated', user: updatedUser });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

module.exports = { getMyProfile, updateMyProfile };
