const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const emailRoutes = require("./src/routes/emailRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP to allow React app assets to load
  })
);
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 900,
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
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

// Global error handler (must be before static/SPA routes)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// Serve React frontend static files from /public directory
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

// SPA fallback — serve index.html for all non-API routes (React Router support)
app.get("*", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  res.sendFile(indexPath, (sendErr) => {
    if (sendErr) {
      res.status(404).json({ error: "Not found" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vivid Valid Email Validator API running on port ${PORT}`);
  console.log(`📧 Ready to validate emails with world-class accuracy!`);
  console.log(`🌐 Serving frontend from: ${frontendPath}`);
});

module.exports = app;
