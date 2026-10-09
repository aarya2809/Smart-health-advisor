const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const upsertProfile = async (req, res) => {
  try {
    const profileData = { ...req.body, user: req.user._id };
    
    // Create or update profile
    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, message: 'Profile saved successfully', profile });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving profile' });
  }
};

module.exports = {
  getProfile,
  upsertProfile
};
