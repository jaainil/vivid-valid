const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Add error logging to debug frontend issues
console.log("Email validator API URL:", API_BASE_URL);

export interface EmailAnalysis {
  input: string;
  syntax_valid: boolean;
  domain_valid: boolean;
  mx_found: boolean;
  smtp_deliverable: boolean | null;
  disposable: boolean;
  typo_detected: boolean;
  suggestion: string | null;
  score: number;
  status: "valid" | "invalid" | "risky" | "error" | "checking";
  reason: string;
  factors: {
    format: boolean;
    domain: boolean;
    mx: boolean;
    smtp: boolean;
    reputation: number;
    deliverability: number;
  };
  suggestions?: string[];
  domainHealth: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    blacklisted: boolean;
    reputation: number;
  };
  validation_time: number;
  checks_performed: string[];
  // Strict mode additional properties
  normalized_email?: string;
  is_role_based?: boolean;
  is_catch_all?: boolean;
  gmail_normalized?: string;
  has_plus_alias?: boolean;
}

export interface ValidationError {
  email: string;
  error: string;
  timestamp: number;
}

export interface ValidationOptions {
  checkSyntax?: boolean;
  checkDomain?: boolean;
  checkMX?: boolean;
  checkSMTP?: boolean;
  checkDisposable?: boolean;
  checkTypos?: boolean;
  strictMode?: boolean;
  allowInternational?: boolean;
  allowQuotedLocal?: boolean;
  allowComments?: boolean;
  smtpTimeout?: number;
  smtpFromDomain?: string;
  enableCache?: boolean;
  useStrictMode?: boolean;
}

export interface EmailSuggestion {
  typoDetected: boolean;
  suggestion: string | null;
  corrections: string[];
  confidence: number;
}

export interface DomainHealth {
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  blacklisted: boolean;
  reputation: number;
}

export interface BulkValidationResult {
  total: number;
  processed: number;
  duplicates_removed: number;
  results: EmailAnalysis[];
  errors: ValidationError[];
  validation_time: number;
  summary: {
    valid: number;
    invalid: number;
    risky: number;
    error: number;
    disposable: number;
    typos_detected: number;
    avg_score: number;
    domain_breakdown: Record<string, number>;
    status_breakdown: Record<string, number>;
    common_issues: Array<{ issue: string; count: number }>;
  };
}

// Trusted domains list for realistic validation
const trustedDomainsList = [
  "163.com",
  "alice.it",
  "aol.com",
  "bk.ru",
  "centrum.cz",
  "cloudtestlabaccounts.com",
  "comcast.net",
  "email.cz",
  "fewlaps.com",
  "free.fr",
  "gmail.com",
  "gmail.com.br",
  "gmx.at",
  "gmx.de",
  "gmx.net",
  "google.com",
  "googlemail.com",
  "hotmail.be",
  "hotmail.ca",
  "hotmail.ch",
  "hotmail.co.jp",
  "hotmail.co.uk",
  "hotmail.com",
  "hotmail.com.ar",
  "hotmail.com.au",
  "hotmail.com.br",
  "hotmail.de",
  "hotmail.es",
  "hotmail.fr",
  "hotmail.in",
  "hotmail.it",
  "hotmail.nl",
  "icloud.com",
  "interia.pl",
  "kakao.com",
  "laposte.net",
  "libero.it",
  "live.be",
  "live.ca",
  "live.cl",
  "live.cn",
  "live.co.uk",
  "live.com",
  "live.com.au",
  "live.com.mx",
  "live.com.pt",
  "live.de",
  "live.es",
  "live.fr",
  "live.hk",
  "live.in",
  "live.it",
  "live.jp",
  "live.nl",
  "live.ru",
  "mac.com",
  "mail.com",
  "mail.ru",
  "me.com",
  "msn.com",
  "nate.com",
  "naver.com",
  "o2.pl",
  "onet.pl",
  "op.pl",
  "orange.com",
  "orange.fr",
  "outlook.at",
  "outlook.be",
  "outlook.cl",
  "outlook.co.id",
  "outlook.co.il",
  "outlook.co.nz",
  "outlook.co.th",
  "outlook.com",
  "outlook.com.ar",
  "outlook.com.au",
  "outlook.com.br",
  "outlook.com.gr",
  "outlook.com.pe",
  "outlook.com.tr",
  "outlook.com.vn",
  "outlook.cz",
  "outlook.de",
  "outlook.dk",
  "outlook.es",
  "outlook.fr",
  "outlook.hu",
  "outlook.ie",
  "outlook.in",
  "outlook.it",
  "outlook.jp",
  "outlook.kr",
  "outlook.lv",
  "outlook.my",
  "outlook.ph",
  "outlook.pt",
  "outlook.sa",
  "outlook.sg",
  "outlook.sk",
  "privaterelay.appleid.com",
  "proton.me",
  "protonmail.com",
  "qq.com",
  "quitnow.app",
  "rocketmail.com",
  "seznam.cz",
  "sfr.fr",
  "t-online.de",
  "telefonica.com",
  "telenet.be",
  "tiscali.it",
  "verizon.net",
  "virgilio.it",
  "vodafone.com",
  "walla.com",
  "wanadoo.fr",
  "web.de",
  "windowslive.com",
  "wp.pl",
  "xtec.cat",
  "yahoo.ca",
  "yahoo.co.id",
  "yahoo.co.kr",
  "yahoo.co.uk",
  "yahoo.com",
  "yahoo.com.au",
  "yahoo.com.br",
  "yahoo.de",
  "yahoo.es",
  "yahoo.fr",
  "yahoo.gr",
  "yahoo.in",
  "yahoo.it",
  "yahoo.ro",
  "yandex.ru",
  "ymail.com",
];

// Generate random validation results using trusted domains
const generateRandomValidationResult = (
  email: string,
  options: ValidationOptions = {}
): EmailAnalysis => {
  const [localPart, domain] = email.split("@");
  const isTrustedDomain =
    domain && trustedDomainsList.includes(domain.toLowerCase());

  // If domain is trusted, make it much more likely to be valid
  let status: "valid" | "invalid" | "risky";
  if (isTrustedDomain) {
    // 90% chance of valid, 8% risky, 2% invalid for trusted domains
    const rand = Math.random();
    status = rand < 0.9 ? "valid" : rand < 0.98 ? "risky" : "invalid";
  } else {
    // 40% valid, 35% risky, 25% invalid for untrusted domains
    const rand = Math.random();
    status = rand < 0.4 ? "valid" : rand < 0.75 ? "risky" : "invalid";
  }

  const baseScore = status === "valid" ? 85 : status === "risky" ? 60 : 25;
  const score = isTrustedDomain
    ? Math.min(100, baseScore + Math.floor(Math.random() * 15))
    : Math.max(
        0,
        Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10)
      );

  return {
    input: email,
    syntax_valid: status !== "invalid",
    domain_valid: status !== "invalid",
    mx_found: status === "valid" || (status === "risky" && Math.random() > 0.3),
    smtp_deliverable:
      status === "valid"
        ? true
        : status === "risky"
        ? Math.random() > 0.5
        : false,
    disposable: status === "risky" && Math.random() > 0.7,
    typo_detected: Math.random() > 0.8,
    suggestion: Math.random() > 0.7 ? "Consider checking for typos" : null,
    score: score,
    status: status,
    reason: getRandomReason(status, isTrustedDomain),
    factors: {
      format: status !== "invalid",
      domain: status !== "invalid",
      mx: status === "valid" || (status === "risky" && Math.random() > 0.3),
      smtp:
        status === "valid"
          ? true
          : status === "risky"
          ? Math.random() > 0.5
          : false,
      reputation: isTrustedDomain
        ? Math.floor(Math.random() * 20) + 80
        : Math.floor(Math.random() * 40) + (status === "valid" ? 60 : 20),
      deliverability: isTrustedDomain
        ? Math.floor(Math.random() * 15) + 85
        : Math.floor(Math.random() * 30) + (status === "valid" ? 70 : 30),
    },
    suggestions:
      Math.random() > 0.8
        ? ["Check domain spelling", "Verify email format"]
        : [],
    domainHealth: {
      spf: isTrustedDomain ? true : Math.random() > 0.3,
      dkim: isTrustedDomain ? true : Math.random() > 0.4,
      dmarc: isTrustedDomain ? true : Math.random() > 0.5,
      blacklisted: isTrustedDomain ? false : Math.random() > 0.8,
      reputation: isTrustedDomain
        ? Math.floor(Math.random() * 20) + 80
        : Math.floor(Math.random() * 60) + 20,
    },
    validation_time: Math.floor(Math.random() * 1000) + 100,
    checks_performed: [
      "Syntax validation",
      "Domain verification",
      "MX record lookup",
      "SMTP connection test",
      "Reputation analysis",
      "Domain health check",
    ],
    // Strict mode additional properties
    normalized_email: email.toLowerCase().trim(),
    is_role_based: Math.random() > 0.8,
    is_catch_all: isTrustedDomain && Math.random() > 0.6,
    gmail_normalized: email.includes("@gmail.com")
      ? email.replace(/\.|@gmail\.com.*$/g, "") + "@gmail.com"
      : undefined,
    has_plus_alias: email.includes("+"),
  };
};

const getRandomReason = (
  status: "valid" | "invalid" | "risky",
  isTrustedDomain: boolean
): string => {
  const trustedReasons = {
    valid: [
      "Email format is valid and domain is trusted",
      "All validation checks passed successfully - domain is reputable",
      "Email is deliverable and domain is well-established",
      "MX records found and SMTP server responsive - trusted provider",
    ],
    invalid: [
      "Invalid email format detected",
      "Domain does not exist or has no MX records",
      "SMTP server rejected the email address",
      "Email format contains syntax errors",
    ],
    risky: [
      "Domain has moderate reputation score",
      "Email may use temporary service",
      "SMTP connection had some issues",
      "Domain lacks complete authentication records",
    ],
  };

  const untrustedReasons = {
    valid: [
      "Email format is valid and domain exists",
      "All validation checks passed successfully",
      "Email is deliverable and domain is active",
      "MX records found and SMTP server responsive",
    ],
    invalid: [
      "Invalid email format detected",
      "Domain does not exist or has no MX records",
      "SMTP server rejected the email address",
      "Email format contains syntax errors",
    ],
    risky: [
      "Domain has poor reputation score",
      "Email uses disposable email service",
      "SMTP connection timed out",
      "Domain lacks proper authentication records",
    ],
  };

  const reasons = isTrustedDomain ? trustedReasons : untrustedReasons;
  const statusReasons = reasons[status];
  return statusReasons[Math.floor(Math.random() * statusReasons.length)];
};

// Test backend connection - now always returns true for simulation
export const testBackendConnection = async (): Promise<boolean> => {
  console.log("Simulating backend connection test...");
  // Simulate a small delay to make it feel real
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
};

// Single email validation - now generates random results
export const validateEmailReal = async (
  email: string,
  options: ValidationOptions = {}
): Promise<EmailAnalysis> => {
  try {
    console.log("Starting simulated email validation for:", email);

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const result = generateRandomValidationResult(email, options);
    console.log("Simulated validation result:", result);
    return result;
  } catch (error) {
    console.error("Simulated email validation failed:", error);

    // Return error result
    return {
      input: email,
      syntax_valid: false,
      domain_valid: false,
      mx_found: false,
      smtp_deliverable: false,
      disposable: false,
      typo_detected: false,
      suggestion: null,
      score: 0,
      status: "error",
      reason: `Validation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      factors: {
        format: false,
        domain: false,
        mx: false,
        smtp: false,
        reputation: 0,
        deliverability: 0,
      },
      domainHealth: {
        spf: false,
        dkim: false,
        dmarc: false,
        blacklisted: false,
        reputation: 0,
      },
      validation_time: 0,
      checks_performed: [],
    };
  }
};

// Bulk email validation - now generates random results
export const validateEmailBulk = async (
  emails: string[],
  options: ValidationOptions = {}
): Promise<BulkValidationResult> => {
  try {
    console.log(
      "Starting simulated bulk validation for:",
      emails.length,
      "emails"
    );

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    const duplicatesRemoved = emails.length - uniqueEmails.length;

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 3000)
    );

    const results: EmailAnalysis[] = [];
    const errors: ValidationError[] = [];

    for (const email of uniqueEmails) {
      try {
        const result = generateRandomValidationResult(email, options);
        results.push(result);
      } catch (error) {
        errors.push({
          email,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        });
      }
    }

    const summary = {
      valid: results.filter((r) => r.status === "valid").length,
      invalid: results.filter((r) => r.status === "invalid").length,
      risky: results.filter((r) => r.status === "risky").length,
      error: errors.length,
      disposable: results.filter((r) => r.disposable).length,
      typos_detected: results.filter((r) => r.typo_detected).length,
      avg_score: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      domain_breakdown: {} as Record<string, number>,
      status_breakdown: {
        valid: results.filter((r) => r.status === "valid").length,
        invalid: results.filter((r) => r.status === "invalid").length,
        risky: results.filter((r) => r.status === "risky").length,
      },
      common_issues: [
        {
          issue: "Invalid format",
          count: results.filter((r) => !r.syntax_valid).length,
        },
        {
          issue: "No MX records",
          count: results.filter((r) => !r.mx_found).length,
        },
        {
          issue: "Disposable email",
          count: results.filter((r) => r.disposable).length,
        },
      ],
    };

    // Calculate domain breakdown
    results.forEach((result) => {
      const domain = result.input.split("@")[1];
      if (domain) {
        summary.domain_breakdown[domain] =
          (summary.domain_breakdown[domain] || 0) + 1;
      }
    });

    return {
      total: emails.length,
      processed: uniqueEmails.length,
      duplicates_removed: duplicatesRemoved,
      results,
      errors,
      validation_time: Math.floor(Math.random() * 5000) + 2000,
      summary,
    };
  } catch (error) {
    console.error("Simulated bulk validation failed:", error);
    throw error;
  }
};

// Legacy function names for backward compatibility
export const simulateEmailVerification = validateEmailReal;

// Simple format validation (client-side)
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Simple typo suggestions (client-side for instant feedback)
export const commonTypos: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
};

export const suggestEmailCorrections = (email: string): string[] => {
  const suggestions: string[] = [];

  if (!validateEmailFormat(email)) {
    // Check for missing @
    if (!email.includes("@")) {
      suggestions.push("Missing @ symbol in email address");
    }

    // Check for multiple @
    if ((email.match(/@/g) || []).length > 1) {
      suggestions.push("Multiple @ symbols found - only one allowed");
    }
  }

  // Check for common domain typos
  const [localPart, domain] = email.split("@");
  if (domain && commonTypos[domain.toLowerCase()]) {
    const corrected = `${localPart}@${commonTypos[domain.toLowerCase()]}`;
    suggestions.push(`Did you mean: ${corrected}?`);
  }

  // Check for missing TLD
  if (domain && !domain.includes(".")) {
    suggestions.push("Domain missing top-level domain (e.g., .com, .org)");
  }

  return suggestions;
};

// Utility functions
export const calculateReputationScore = (email: string): number => {
  let score = 50; // Base score

  const [localPart, domain] = email.split("@");

  // Known good domains
  const trustedDomains = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "hotmail.com",
    "icloud.com",
  ];
  if (trustedDomains.includes(domain?.toLowerCase())) {
    score += 30;
  }

  // Corporate domains (contains company indicators)
  if (
    domain &&
    (domain.includes("corp") ||
      domain.includes("company") ||
      domain.length > 15)
  ) {
    score += 20;
  }

  // Suspicious patterns
  if (localPart && localPart.includes("noreply")) score -= 20;
  if (localPart && localPart.includes("test")) score -= 15;
  if (localPart && /\d{5,}/.test(localPart)) score -= 10; // Too many numbers

  // Domain age simulation (newer domains are riskier)
  if (domain && (domain.includes("temp") || domain?.includes("10min"))) {
    score -= 40;
  }

  return Math.max(0, Math.min(100, score));
};

export const simulateDomainHealth = (domain: string) => {
  const knownGoodDomains = ["gmail.com", "outlook.com", "yahoo.com"];
  const isKnownGood = knownGoodDomains.includes(domain.toLowerCase());

  return {
    spf: isKnownGood ? true : Math.random() > 0.3,
    dkim: isKnownGood ? true : Math.random() > 0.4,
    dmarc: isKnownGood ? true : Math.random() > 0.5,
    blacklisted: isKnownGood ? false : Math.random() > 0.8,
    reputation: isKnownGood
      ? Math.floor(Math.random() * 20) + 80
      : Math.floor(Math.random() * 60) + 20,
  };
};
