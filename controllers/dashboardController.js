const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const TrackingLog = require('../models/TrackingLog');
const {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargets
} = require('../utils/metricsCalculator');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch User & Profile
    const user = await User.findById(userId).select('-password');
    const profile = await HealthProfile.findOne({ user: userId });

    // 2. Fetch Active Plans
    const [dietPlan, workoutPlan] = await Promise.all([
      DietPlan.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 }),
      WorkoutPlan.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 })
    ]);

    // 3. Fetch Today's Tracking Log
    const today = new Date().toISOString().split('T')[0];
    let trackingLog = await TrackingLog.findOne({ user: userId, date: today });
    if (!trackingLog) {
      trackingLog = {
        date: today,
        waterIntakeMl: 0,
        waterTargetMl: 2500,
        meals: [],
        workoutCompleted: false,
        workoutDurationMinutes: 0,
        completedExercises: []
      };
    }

    // 4. Calculate Nutritional Intake from Confirmed Meals
    const consumedNutrition = (trackingLog.meals || []).reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fats += meal.fats || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // 5. Calculate Body Metrics & Energy
    let metrics = {
      bmi: null,
      bmr: null,
      tdee: null,
      targets: null
    };

    if (profile && profile.weight && profile.height) {
      metrics.bmi = calculateBMI(profile.weight, profile.height);
      metrics.bmr = calculateBMR(profile.weight, profile.height, profile.age || 25, profile.gender || 'unspecified');
      if (metrics.bmr) {
        metrics.tdee = calculateTDEE(metrics.bmr.value, profile.activityLevel || 'moderately_active');
        if (metrics.tdee) {
          metrics.targets = calculateTargets(metrics.tdee.value, profile.weight, profile.primaryGoal);
        }
      }
    }

    // 6. Calculate 7-day consistency stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentLogs = await TrackingLog.find({
      user: userId,
      date: { $gte: sevenDaysAgoStr }
    });

    const workoutsCompletedLast7Days = recentLogs.filter(l => l.workoutCompleted).length;
    const adherencePercent = Math.min(100, Math.round((workoutsCompletedLast7Days / 5) * 100)); // target 5 days/wk

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      profile,
      metrics,
      activeDietPlan: dietPlan ? dietPlan.plan : null,
      activeWorkoutPlan: workoutPlan ? workoutPlan.plan : null,
      todayLog: {
        ...trackingLog.toObject ? trackingLog.toObject() : trackingLog,
        consumedNutrition
      },
      weeklyStats: {
        workoutsCompleted: workoutsCompletedLast7Days,
        adherencePercent
      }
    });
  } catch (error) {
    console.error('getDashboardData error:', error);
    res.status(500).json({ success: false, message: 'Server error loading dashboard data' });
  }
};

module.exports = {
  getDashboardData
};
