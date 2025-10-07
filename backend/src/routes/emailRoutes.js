const express = require("express");
const router = express.Router();
const EmailValidator = require("../validators/emailValidator");
const BulkValidator = require("../validators/bulkValidator");
const rateLimit = require("express-rate-limit");

// ========================================
// HARDCODED RATE LIMITING - NO .ENV NEEDED
// ========================================

// Rate limiting for single email validation
const singleEmailLimiter = rateLimit({
  windowMs: parseInt(process.env.SINGLE_EMAIL_RATE_WINDOW_MS) || 60000,
  max: parseInt(process.env.SINGLE_EMAIL_RATE_MAX) || 20,
  message: { error: "Too many validation requests. Please wait a moment." },
});

// Rate limiting for bulk validation (more restrictive)
const bulkEmailLimiter = rateLimit({
  windowMs: parseInt(process.env.BULK_EMAIL_RATE_WINDOW_MS) || 300000,
  max: parseInt(process.env.BULK_EMAIL_RATE_MAX) || 3,
  message: {
    error: "Bulk validation rate limit exceeded. Please wait 5 minutes.",
  },
});

// Single email validation endpoint
router.post("/validate", singleEmailLimiter, async (req, res) => {
  try {
    const { email, options = {} } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email address is required",
        code: "MISSING_EMAIL",
      });
    }

    const validator = new EmailValidator(options);
    const result = await validator.validate(email);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Validation failed",
      message: error.message,
      code: "VALIDATION_ERROR",
    });
  }
});

// Bulk email validation endpoint
router.post("/validate-bulk", bulkEmailLimiter, async (req, res) => {
  try {
    const { emails, options = {} } = req.body;

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        error: "Array of email addresses is required",
        code: "INVALID_EMAILS_ARRAY",
      });
    }

    const maxBulkEmails = parseInt(process.env.MAX_BULK_EMAILS) || 1000;
    if (emails.length > maxBulkEmails) {
      return res.status(400).json({
        error: `Maximum ${maxBulkEmails} emails allowed per bulk request`,
        code: "TOO_MANY_EMAILS",
      });
    }

    const bulkValidator = new BulkValidator(options);
    const results = await bulkValidator.validateBatch(emails);

    res.json({
      success: true,
      data: {
        total: emails.length,
        results: results.results,
        summary: results.summary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk validation error:", error);
    res.status(500).json({
      error: "Bulk validation failed",
      message: error.message,
      code: "BULK_VALIDATION_ERROR",
    });
  }
});

// Email suggestion endpoint
router.post("/suggest", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email address is required",
        code: "MISSING_EMAIL",
      });
    }

    const validator = new EmailValidator();
    const suggestions = await validator.getSuggestions(email);

    res.json({
      success: true,
      data: {
        email,
        suggestions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({
      error: "Suggestion generation failed",
      message: error.message,
      code: "SUGGESTION_ERROR",
    });
  }
});

// Domain health check endpoint
router.get("/domain/:domain/health", async (req, res) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        error: "Domain is required",
        code: "MISSING_DOMAIN",
      });
    }

    const validator = new EmailValidator();
    const health = await validator.checkDomainHealth(domain);

    res.json({
      success: true,
      data: {
        domain,
        health,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Domain health check error:", error);
    res.status(500).json({
      error: "Domain health check failed",
      message: error.message,
      code: "DOMAIN_HEALTH_ERROR",
    });
  }
});

module.exports = router;
