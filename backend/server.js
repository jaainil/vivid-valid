const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// Load environment variables
require("dotenv").config();

const emailRoutes = require("./src/routes/emailRoutes");

const app = express();

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================

// Server Configuration
const PORT = parseInt(process.env.PORT) || parseInt(process.env.DEFAULT_PORT) || 3123;
const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// CORS Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const CORS_ORIGINS = [
  process.env.CORS_ORIGIN || "http://localhost:8080",
  process.env.CORS_ORIGIN_2 || "http://localhost:3000",
  process.env.CORS_ORIGIN_3 || "http://localhost:5173",
].filter(Boolean);

// Rate Limiting
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const RATE_LIMIT_MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// File Upload Limits
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || "10485760"; // 10MB

// Security middleware
app.use(helmet());
const allowedOrigins = CORS_ORIGINS;

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  },
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Vivid Valid Email Validator",
  });
});

// API routes
app.use("/api/email", emailRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vivid Valid Email Validator API running on port ${PORT}`);
  console.log(`📧 Ready to validate emails with world-class accuracy!`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`⚙️ Environment: ${NODE_ENV}`);
});
module.exports = app;
