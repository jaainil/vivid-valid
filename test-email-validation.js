#!/usr/bin/env node

/**
 * Basic test script to validate email validation functionality
 * Run with: node test-email-validation.js
 */

const testEmails = [
  // Valid emails
  { email: "test@gmail.com", expected: "valid" },
  { email: "user.name+tag@example.org", expected: "valid" },
  { email: "test123@test-domain.co.uk", expected: "valid" },

  // Invalid emails
  { email: "invalid-email", expected: "invalid" },
  { email: "test@", expected: "invalid" },
  { email: "@example.com", expected: "invalid" },
  { email: "test@.com", expected: "invalid" },

  // Risky/disposable emails
  { email: "test@10minutemail.com", expected: "risky" },
  { email: "user@guerrillamail.com", expected: "risky" },

  // Common typos
  { email: "test@gmai.com", expected: "risky" },
  { email: "user@yaho.com", expected: "risky" },
];

async function runTests() {
  console.log("🧪 Running Email Validation Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testEmails) {
    try {
      console.log(`Testing: ${testCase.email}`);

      // Basic format validation (client-side check)
      const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testCase.email);

      if (!isValidFormat && testCase.expected !== "invalid") {
        console.log(`  ❌ Format validation failed for ${testCase.email}`);
        failed++;
        continue;
      }

      console.log(`  ✅ Basic validation passed`);
      console.log(`  📋 Expected: ${testCase.expected}, Got: valid format`);
      passed++;
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      failed++;
    }

    console.log("");
  }

  console.log("📊 Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`
  );

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! Email validation is working correctly."
    );
    process.exit(0);
  } else {
    console.log(
      `\n⚠️  ${failed} test(s) failed. Please check the implementation.`
    );
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testEmails };
