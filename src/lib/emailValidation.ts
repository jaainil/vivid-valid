// ========================================
// HARDCODED CONFIGURATION - NO .ENV NEEDED
// ========================================

// API Configuration
const API_BASE_URL = "http://backend:3001/api";
const MAX_BULK_EMAILS = 1000;
const MAX_FILE_SIZE = 10485760; // 10MB in bytes
const SUPPORTED_FILE_TYPES = ".csv,.txt";

// App Configuration
const APP_NAME = "Email Verifier Pro";
const APP_VERSION = "1.0.0";
const APP_DESCRIPTION =
  "The most advanced email verification tool with real-time validation, bulk processing, and beautiful progress animations";

// Debug logging
console.log("=== FRONTEND CONFIG ===");
console.log("✅ API_BASE_URL:", API_BASE_URL);
console.log("✅ MAX_BULK_EMAILS:", MAX_BULK_EMAILS);
console.log("✅ MAX_FILE_SIZE:", MAX_FILE_SIZE);
console.log("✅ SUPPORTED_FILE_TYPES:", SUPPORTED_FILE_TYPES);
console.log("✅ APP_NAME:", APP_NAME);

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

// API call wrapper with error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    console.log("API Call:", `${API_BASE_URL}${endpoint}`, options);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log("API Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      console.error("API Error Response:", errorData);
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("API Success Response:", data);
    return data.data || data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log("Testing backend connection...");
    const healthUrl = API_BASE_URL.replace("/api", "/health");
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Backend connection test successful:", data);
      return true;
    } else {
      console.error(
        "Backend connection test failed:",
        response.status,
        response.statusText
      );
      return false;
    }
  } catch (error) {
    console.error("Backend connection test error:", error);
    return false;
  }
};

// Single email validation
export const validateEmailReal = async (
  email: string,
  options: ValidationOptions = {}
): Promise<EmailAnalysis> => {
  try {
    console.log("Starting email validation for:", email);

    // Test backend connection first (cached)
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("backendConnected") !== "true") {
        const isConnected = await testBackendConnection();
        if (isConnected) {
          sessionStorage.setItem("backendConnected", "true");
        } else {
          throw new Error("Cannot connect to backend server");
        }
      }
    } else {
      throw new Error("Cannot connect to backend server");
    }

    const result = await apiCall<EmailAnalysis>("/email/validate", {
      method: "POST",
      body: JSON.stringify({ email, options }),
    });

    console.log("Validation successful:", result);
    return result;
  } catch (error) {
    console.error("Email validation failed:", error);

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

// Bulk email validation
export const validateEmailBulk = async (
  emails: string[],
  options: ValidationOptions = {}
): Promise<BulkValidationResult> => {
  try {
    const result = await apiCall<BulkValidationResult>("/email/validate-bulk", {
      method: "POST",
      body: JSON.stringify({ emails, options }),
    });

    return result;
  } catch (error) {
    console.error("Bulk email validation failed:", error);
    throw error;
  }
};

// Get email suggestions
export const getEmailSuggestions = async (
  email: string
): Promise<{ suggestions: EmailSuggestion }> => {
  try {
    const result = await apiCall<{ suggestions: EmailSuggestion }>(
      "/email/suggest",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );

    return result;
  } catch (error) {
    console.error("Email suggestion failed:", error);
    return {
      suggestions: {
        typoDetected: false,
        suggestion: null,
        corrections: [],
        confidence: 0,
      },
    };
  }
};

// Get domain health
export const getDomainHealth = async (
  domain: string
): Promise<DomainHealth> => {
  try {
    const result = await apiCall<{ health: DomainHealth }>(
      `/email/domain/${encodeURIComponent(domain)}/health`
    );
    return result.health;
  } catch (error) {
    console.error("Domain health check failed:", error);
    return {
      spf: false,
      dkim: false,
      dmarc: false,
      blacklisted: false,
      reputation: 0,
    };
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
