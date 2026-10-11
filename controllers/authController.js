const User = require("../models/User");
const HealthProfile = require("../models/HealthProfile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, age, gender, height, weight, goal } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      height,
      weight,
      goal,
    });

    // Create default HealthProfile with Vegetarian default and pending safety questionnaire
    await HealthProfile.create({
      user: user._id,
      age: age ? Number(age) : 25,
      gender: gender || 'male',
      height: height ? Number(height) : 170,
      weight: weight ? Number(weight) : 70,
      primaryGoal: goal || 'general_fitness',
      dietType: 'vegetarian', // MANDATORY REQUIREMENT: Default Vegetarian
      safetyQuestionnaireCompleted: false,
      hasFoodAllergies: 'unsure',
      hasInjuries: 'unsure',
      onboardingCompleted: false
    });

    // Generate JWT token for seamless post-registration onboarding
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'smart_health_jwt_secret',
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check onboarding status
    const profile = await HealthProfile.findOne({ user: user._id });
    const onboardingCompleted = profile ? Boolean(profile.onboardingCompleted) : false;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'smart_health_jwt_secret',
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      onboardingCompleted,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// LOGOUT USER (Session Revocation)
const logoutUser = async (req, res) => {
  try {
    // Acknowledge session termination on backend
    res.status(200).json({
      success: true,
      message: "Session logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during logout"
    });
  }
};

// GET LOGGED-IN USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    res.status(200).json({
      success: true,
      user: req.user,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while getting profile",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
};