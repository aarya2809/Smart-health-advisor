const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/plan", plannerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tracking", trackingRoutes);

// Health check routes
const healthCheckHandler = (req, res) => {
  const isDbConnected = require("mongoose").connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    status: isDbConnected ? "ok" : "degraded",
    message: "AdaptFit AI API is running",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
};

app.get("/health", healthCheckHandler);
app.get("/api/health", healthCheckHandler);

// Test root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AdaptFit AI API is running",
    docs: "/api/health",
  });
});

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});