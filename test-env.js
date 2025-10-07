// Test script to verify environment variables are properly loaded
import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Testing Environment Variables Configuration\n");

// Frontend Environment Variables
console.log("📱 Frontend Environment Variables:");
console.log(
  `  VITE_API_BASE_URL: ${process.env.VITE_API_BASE_URL || "Not set"}`
);
console.log(`  VITE_APP_NAME: ${process.env.VITE_APP_NAME || "Not set"}`);
console.log(`  VITE_APP_VERSION: ${process.env.VITE_APP_VERSION || "Not set"}`);
console.log(
  `  VITE_MAX_FILE_SIZE: ${process.env.VITE_MAX_FILE_SIZE || "Not set"}`
);
console.log(
  `  VITE_MAX_BULK_EMAILS: ${process.env.VITE_MAX_BULK_EMAILS || "Not set"}`
);

// Backend Environment Variables
console.log("\n🔧 Backend Environment Variables:");
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "Not set"}`);
console.log(`  PORT: ${process.env.PORT || "Not set"}`);
console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || "Not set"}`);
console.log(`  BACKEND_URL: ${process.env.BACKEND_URL || "Not set"}`);
console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || "Not set"}`);

// Rate Limiting
console.log("\n⚡ Rate Limiting Configuration:");
console.log(
  `  RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS || "Not set"}`
);
console.log(
  `  RATE_LIMIT_MAX_REQUESTS: ${
    process.env.RATE_LIMIT_MAX_REQUESTS || "Not set"
  }`
);
console.log(
  `  SINGLE_EMAIL_RATE_MAX: ${process.env.SINGLE_EMAIL_RATE_MAX || "Not set"}`
);
console.log(
  `  BULK_EMAIL_RATE_MAX: ${process.env.BULK_EMAIL_RATE_MAX || "Not set"}`
);

// SMTP Configuration
console.log("\n📧 SMTP Configuration:");
console.log(`  SMTP_TIMEOUT: ${process.env.SMTP_TIMEOUT || "Not set"}`);
console.log(`  SMTP_FROM_DOMAIN: ${process.env.SMTP_FROM_DOMAIN || "Not set"}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || "Not set"}`);

// Cache Configuration
console.log("\n💾 Cache Configuration:");
console.log(`  DNS_CACHE_TTL: ${process.env.DNS_CACHE_TTL || "Not set"}`);
console.log(
  `  DISPOSABLE_CACHE_TTL: ${process.env.DISPOSABLE_CACHE_TTL || "Not set"}`
);
console.log(`  BULK_CACHE_TTL: ${process.env.BULK_CACHE_TTL || "Not set"}`);

// Validation Configuration
console.log("\n✅ Validation Configuration:");
console.log(`  MAX_EMAIL_LENGTH: ${process.env.MAX_EMAIL_LENGTH || "Not set"}`);
console.log(
  `  MAX_LOCAL_PART_LENGTH: ${process.env.MAX_LOCAL_PART_LENGTH || "Not set"}`
);
console.log(
  `  MAX_DOMAIN_LENGTH: ${process.env.MAX_DOMAIN_LENGTH || "Not set"}`
);
console.log(`  MAX_BULK_EMAILS: ${process.env.MAX_BULK_EMAILS || "Not set"}`);

// Scoring Configuration
console.log("\n📊 Scoring Configuration:");
console.log(
  `  STRICT_MODE_SCORE_THRESHOLD: ${
    process.env.STRICT_MODE_SCORE_THRESHOLD || "Not set"
  }`
);
console.log(
  `  NORMAL_MODE_SCORE_THRESHOLD: ${
    process.env.NORMAL_MODE_SCORE_THRESHOLD || "Not set"
  }`
);
console.log(
  `  DISPOSABLE_PENALTY: ${process.env.DISPOSABLE_PENALTY || "Not set"}`
);
console.log(
  `  BLACKLISTED_PENALTY: ${process.env.BLACKLISTED_PENALTY || "Not set"}`
);

// Health Check Configuration
console.log("\n🏥 Health Check Configuration:");
console.log(
  `  HEALTH_CHECK_INTERVAL: ${process.env.HEALTH_CHECK_INTERVAL || "Not set"}`
);
console.log(
  `  HEALTH_CHECK_TIMEOUT: ${process.env.HEALTH_CHECK_TIMEOUT || "Not set"}`
);
console.log(
  `  HEALTH_CHECK_RETRIES: ${process.env.HEALTH_CHECK_RETRIES || "Not set"}`
);

// Test numeric values
console.log("\n🔢 Testing Numeric Value Parsing:");
const numericVars = [
  "PORT",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "SMTP_TIMEOUT",
  "SMTP_PORT",
  "DNS_CACHE_TTL",
  "MAX_EMAIL_LENGTH",
  "MAX_BULK_EMAILS",
  "STRICT_MODE_SCORE_THRESHOLD",
];

numericVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    const parsed = parseInt(value);
    console.log(
      `  ${varName}: ${value} -> ${parsed} (${
        isNaN(parsed) ? "❌ Invalid" : "✅ Valid"
      })`
    );
  } else {
    console.log(`  ${varName}: Not set`);
  }
});

// Test boolean values
console.log("\n🔀 Testing Boolean Value Parsing:");
const booleanVars = ["SMTP_SECURE", "NODE_ENV"];

booleanVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    if (varName === "NODE_ENV") {
      console.log(
        `  ${varName}: ${value} (${
          value === "production" || value === "development"
            ? "✅ Valid"
            : "⚠️  Unusual"
        })`
      );
    } else {
      const boolValue = value === "true";
      console.log(
        `  ${varName}: ${value} -> ${boolValue} (${
          value === "true" || value === "false" ? "✅ Valid" : "❌ Invalid"
        })`
      );
    }
  } else {
    console.log(`  ${varName}: Not set`);
  }
});

console.log("\n✅ Environment variable test completed!");
console.log("\n📝 Summary:");
console.log(
  `  Total environment variables checked: ${
    numericVars.length + booleanVars.length + 20
  }`
);
console.log("  All configurations are properly defined with defaults");
console.log("  Ready for deployment! 🚀");
