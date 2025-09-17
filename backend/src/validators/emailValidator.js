const dns = require("dns").promises;
const net = require("net");
const punycode = require("punycode/");
const NodeCache = require("node-cache");
const DisposableDetector = require("./disposableDetector");
const TypoCorrector = require("./typoCorrector");
const RFCParser = require("./rfcParser");

// Cache for DNS and domain reputation results (5 minute TTL)
const cache = new NodeCache({ stdTTL: 300 });

class EmailValidator {
  constructor(options = {}) {
    this.options = {
      // Validation layers to enable
      checkSyntax: options.checkSyntax !== false,
      checkDomain: options.checkDomain !== false,
      checkMX: options.checkMX !== false,
      checkSMTP: options.checkSMTP !== false,
      checkDisposable: options.checkDisposable !== false,
      checkTypos: options.checkTypos !== false,

      // Validation modes
      strictMode: options.strictMode || false,
      allowInternational: options.allowInternational !== false,
      allowQuotedLocal: options.allowQuotedLocal !== false,
      allowComments: options.allowComments !== false,

      // SMTP options
      smtpTimeout: options.smtpTimeout || 5000,
      smtpFromDomain: options.smtpFromDomain || "validator.example.com",

      // Performance options
      enableCache: options.enableCache !== false,
      ...options,
    };

    this.disposableDetector = new DisposableDetector();
    this.typoCorrector = new TypoCorrector();
    this.rfcParser = new RFCParser(this.options);
  }

  async validate(email) {
    const startTime = Date.now();

    // Initialize result structure
    const result = {
      input: email,
      syntax_valid: false,
      domain_valid: false,
      mx_found: false,
      smtp_deliverable: null,
      disposable: false,
      typo_detected: false,
      suggestion: null,
      score: 0,
      status: "invalid",
      reason: "",
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

    try {
      // Step 1: Syntax validation (RFC 5321/5322)
      if (this.options.checkSyntax) {
        result.checks_performed.push("syntax");
        const syntaxResult = await this.validateSyntax(email);
        result.syntax_valid = syntaxResult.valid;
        result.factors.format = syntaxResult.valid;

        if (!syntaxResult.valid) {
          result.reason = syntaxResult.reason;
          result.validation_time = Date.now() - startTime;
          return result;
        }
      }

      // Parse email into components
      const parsed = this.rfcParser.parseEmail(email);
      if (!parsed) {
        result.reason = "Failed to parse email components";
        result.validation_time = Date.now() - startTime;
        return result;
      }

      const { localPart, domain } = parsed;

      // Step 2: Typo detection and correction (only for known domain typos)
      if (this.options.checkTypos) {
        result.checks_performed.push("typos");
        const [localPart, domain] = email.split("@");

        // Check only our known domain corrections mapping
        if (
          domain &&
          this.typoCorrector.domainCorrections[domain.toLowerCase()]
        ) {
          result.typo_detected = true;
          result.suggestion = `${localPart}@${
            this.typoCorrector.domainCorrections[domain.toLowerCase()]
          }`;
        }
      }

      // Step 3: Disposable email detection
      if (this.options.checkDisposable) {
        result.checks_performed.push("disposable");
        result.disposable = await this.disposableDetector.isDisposable(domain);
        if (result.disposable) {
          result.factors.reputation = -20; // Penalize disposable emails
        }
      }

      // Step 4: Domain validation
      if (this.options.checkDomain) {
        result.checks_performed.push("domain");
        const domainResult = await this.validateDomain(domain);
        result.domain_valid = domainResult.valid;
        result.factors.domain = domainResult.valid;

        if (!domainResult.valid) {
          result.reason = domainResult.reason;
          result.validation_time = Date.now() - startTime;
          return result;
        }
      }

      // Step 5: MX record lookup
      if (this.options.checkMX) {
        result.checks_performed.push("mx");
        const mxResult = await this.checkMXRecords(domain);
        result.mx_found = mxResult.found;
        result.factors.mx = mxResult.found;
        result.factors.deliverability = mxResult.deliverabilityScore;
      }

      // Step 6: SMTP deliverability test (optional)
      if (this.options.checkSMTP && result.mx_found) {
        result.checks_performed.push("smtp");
        const smtpResult = await this.testSMTPDeliverability(email, domain);
        result.smtp_deliverable = smtpResult.deliverable;
        result.factors.smtp = smtpResult.deliverable;
      }

      // Step 7: Domain health analysis
      result.checks_performed.push("domain_health");
      result.domainHealth = await this.checkDomainHealth(domain);

      // Step 8: Calculate final score and determine status
      result.score = this.calculateScore(result);
      result.factors.reputation = this.calculateReputationScore(parsed, result);

      // Determine final status with better logic
      if (result.disposable) {
        result.status = "risky";
        result.reason = "Disposable email address detected";
      } else if (result.domainHealth.blacklisted) {
        result.status = "invalid";
        result.reason = "Domain is blacklisted";
      } else if (!result.syntax_valid || !result.domain_valid) {
        result.status = "invalid";
        result.reason = "Invalid email format or domain";
      } else if (!result.mx_found) {
        result.status = "invalid";
        result.reason = "Domain cannot receive emails (no MX records)";
      } else if (result.score >= 75) {
        result.status = "valid";
        result.reason = "Email appears to be valid and deliverable";
      } else if (result.score >= 50) {
        result.status = "risky";
        result.reason = "Email may be risky - proceed with caution";
      } else {
        result.status = "invalid";
        result.reason = "Email is likely invalid or undeliverable";
      }

      result.validation_time = Date.now() - startTime;
      return result;
    } catch (error) {
      console.error("Validation error:", error);
      result.reason = "Validation failed due to technical error";
      result.validation_time = Date.now() - startTime;
      return result;
    }
  }

  async validateSyntax(email) {
    try {
      return this.rfcParser.validateRFC(email);
    } catch (error) {
      return {
        valid: false,
        reason: "Syntax validation failed: " + error.message,
      };
    }
  }

  async validateDomain(domain) {
    const cacheKey = `domain_${domain}`;

    if (this.options.enableCache && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      // Convert IDN domains to ASCII
      const asciiDomain = punycode.toASCII(domain);

      // Basic domain format check
      if (!asciiDomain || asciiDomain.length > 253) {
        return { valid: false, reason: "Invalid domain format" };
      }

      // Check if domain resolves
      try {
        await dns.lookup(asciiDomain);
        const result = { valid: true, reason: "Domain resolves correctly" };

        if (this.options.enableCache) {
          cache.set(cacheKey, result);
        }

        return result;
      } catch (dnsError) {
        return { valid: false, reason: "Domain does not resolve" };
      }
    } catch (error) {
      return {
        valid: false,
        reason: "Domain validation failed: " + error.message,
      };
    }
  }

  async checkMXRecords(domain) {
    const cacheKey = `mx_${domain}`;

    if (this.options.enableCache && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const asciiDomain = punycode.toASCII(domain);

      try {
        const mxRecords = await dns.resolveMx(asciiDomain);

        if (mxRecords && mxRecords.length > 0) {
          // Sort by priority and calculate deliverability score
          mxRecords.sort((a, b) => a.priority - b.priority);

          const deliverabilityScore = this.calculateMXScore(mxRecords);
          const result = {
            found: true,
            records: mxRecords,
            deliverabilityScore,
            reason: `Found ${mxRecords.length} MX record(s)`,
          };

          if (this.options.enableCache) {
            cache.set(cacheKey, result);
          }

          return result;
        } else {
          // Try A record as fallback
          try {
            await dns.resolve4(asciiDomain);
            const result = {
              found: true,
              records: [],
              deliverabilityScore: 60,
              reason: "No MX records, but A record exists (fallback)",
            };

            if (this.options.enableCache) {
              cache.set(cacheKey, result);
            }

            return result;
          } catch (aError) {
            return {
              found: false,
              deliverabilityScore: 0,
              reason: "No MX or A records found",
            };
          }
        }
      } catch (mxError) {
        return {
          found: false,
          deliverabilityScore: 0,
          reason: "MX lookup failed: " + mxError.message,
        };
      }
    } catch (error) {
      return {
        found: false,
        deliverabilityScore: 0,
        reason: "MX check failed: " + error.message,
      };
    }
  }

  async testSMTPDeliverability(email, domain) {
    try {
      const asciiDomain = punycode.toASCII(domain);
      const mxRecords = await dns.resolveMx(asciiDomain);

      if (!mxRecords || mxRecords.length === 0) {
        return { deliverable: false, reason: "No MX records found" };
      }

      // Sort by priority and try the highest priority MX
      mxRecords.sort((a, b) => a.priority - b.priority);
      const primaryMX = mxRecords[0].exchange;

      return new Promise((resolve) => {
        const socket = new net.Socket();
        let step = 0;
        let responses = [];

        const cleanup = () => {
          socket.destroy();
        };

        const timeout = setTimeout(() => {
          cleanup();
          resolve({ deliverable: false, reason: "SMTP connection timeout" });
        }, this.options.smtpTimeout);

        socket.connect(25, primaryMX, () => {
          // Connected successfully, wait for greeting
        });

        socket.on("data", (data) => {
          const response = data.toString().trim();
          responses.push(response);

          if (step === 0 && response.startsWith("220")) {
            // Received greeting, send HELO
            socket.write(`HELO ${this.options.smtpFromDomain}\r\n`);
            step = 1;
          } else if (step === 1 && response.startsWith("250")) {
            // HELO accepted, send MAIL FROM
            socket.write(`MAIL FROM:<test@${this.options.smtpFromDomain}>\r\n`);
            step = 2;
          } else if (step === 2 && response.startsWith("250")) {
            // MAIL FROM accepted, send RCPT TO
            socket.write(`RCPT TO:<${email}>\r\n`);
            step = 3;
          } else if (step === 3) {
            // Check RCPT TO response
            clearTimeout(timeout);
            cleanup();

            if (response.startsWith("250")) {
              resolve({
                deliverable: true,
                reason: "SMTP server accepts email",
              });
            } else if (response.startsWith("550")) {
              resolve({
                deliverable: false,
                reason: "Email address rejected by server",
              });
            } else {
              resolve({
                deliverable: null,
                reason: "Uncertain - server response: " + response,
              });
            }
          }
        });

        socket.on("error", (error) => {
          clearTimeout(timeout);
          cleanup();
          resolve({
            deliverable: false,
            reason: "SMTP connection error: " + error.message,
          });
        });
      });
    } catch (error) {
      return {
        deliverable: false,
        reason: "SMTP test failed: " + error.message,
      };
    }
  }

  async checkDomainHealth(domain) {
    const cacheKey = `health_${domain}`;

    if (this.options.enableCache && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const asciiDomain = punycode.toASCII(domain);
      const health = {
        spf: false,
        dkim: false,
        dmarc: false,
        blacklisted: false,
        reputation: 50,
      };

      // Check SPF record
      try {
        const txtRecords = await dns.resolveTxt(asciiDomain);
        health.spf = txtRecords.some((record) =>
          record.some((txt) => txt.startsWith("v=spf1"))
        );
      } catch (e) {
        // SPF record not found
      }

      // Check DMARC record
      try {
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${asciiDomain}`);
        health.dmarc = dmarcRecords.some((record) =>
          record.some((txt) => txt.startsWith("v=DMARC1"))
        );
      } catch (e) {
        // DMARC record not found
      }

      // Calculate reputation based on various factors
      health.reputation = this.calculateDomainReputation(domain, health);

      // Check blacklists (simplified simulation for demo)
      health.blacklisted = await this.checkDomainBlacklists(domain);

      if (this.options.enableCache) {
        cache.set(cacheKey, health);
      }

      return health;
    } catch (error) {
      console.error("Domain health check error:", error);
      return {
        spf: false,
        dkim: false,
        dmarc: false,
        blacklisted: false,
        reputation: 0,
      };
    }
  }

  calculateMXScore(mxRecords) {
    let score = 70; // Base score for having MX records

    // Bonus for multiple MX records (redundancy)
    if (mxRecords.length > 1) score += 10;
    if (mxRecords.length > 2) score += 5;

    // Check for known good mail providers
    const goodProviders = [
      "google.com",
      "outlook.com",
      "microsoft.com",
      "amazon.com",
    ];
    const hasGoodProvider = mxRecords.some((mx) =>
      goodProviders.some((provider) => mx.exchange.includes(provider))
    );

    if (hasGoodProvider) score += 15;

    return Math.min(100, score);
  }

  calculateDomainReputation(domain, health) {
    let reputation = 50; // Base reputation

    // Known good domains
    const trustedDomains = [
      "gmail.com",
      "outlook.com",
      "yahoo.com",
      "hotmail.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
    ];

    if (trustedDomains.includes(domain.toLowerCase())) {
      reputation += 40;
    }

    // Corporate domains (heuristic)
    if (
      domain.includes("corp") ||
      domain.includes("company") ||
      (!domain.includes(".com") && !domain.includes(".net"))
    ) {
      reputation += 20;
    }

    // Security features bonus
    if (health.spf) reputation += 5;
    if (health.dmarc) reputation += 10;
    if (health.dkim) reputation += 5;

    // TLD reputation
    const suspiciousTlds = [".tk", ".ml", ".ga", ".cf"];
    if (suspiciousTlds.some((tld) => domain.endsWith(tld))) {
      reputation -= 30;
    }

    return Math.max(0, Math.min(100, reputation));
  }

  async checkDomainBlacklists(domain) {
    // Simplified blacklist check (in production, use real blacklist APIs)
    const knownBadDomains = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "spam.com",
      "example.com",
    ];

    return knownBadDomains.includes(domain.toLowerCase());
  }

  calculateScore(result) {
    let score = 0;

    // Syntax (20 points)
    if (result.syntax_valid) score += 20;

    // Domain (20 points)
    if (result.domain_valid) score += 20;

    // MX Records (25 points)
    if (result.mx_found) score += 25;

    // SMTP (15 points)
    if (result.smtp_deliverable === true) score += 15;
    else if (result.smtp_deliverable === null) score += 7; // Uncertain

    // Domain health (10 points)
    const healthScore =
      (result.domainHealth.spf ? 3 : 0) +
      (result.domainHealth.dmarc ? 4 : 0) +
      (result.domainHealth.dkim ? 3 : 0);
    score += healthScore;

    // Penalties
    if (result.disposable) score -= 30;
    if (result.domainHealth.blacklisted) score -= 40;
    // Only penalize for typos if there's an actual correction suggested
    if (
      result.typo_detected &&
      result.suggestion &&
      result.suggestion !== result.input
    )
      score -= 10;

    // Domain reputation bonus/penalty (10 points)
    score += (result.domainHealth.reputation - 50) / 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateReputationScore(parsed, result) {
    const { localPart, domain } = parsed;
    let score = 50; // Base score

    // Local part analysis
    if (localPart.includes("noreply") || localPart.includes("no-reply"))
      score -= 20;
    if (localPart.includes("test") || localPart.includes("demo")) score -= 15;
    if (/\d{5,}/.test(localPart)) score -= 10; // Too many consecutive numbers
    if (localPart.length < 3) score -= 10; // Very short local part
    if (localPart.length > 20) score -= 5; // Very long local part

    // Use domain reputation
    score += (result.domainHealth.reputation - 50) / 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async getSuggestions(email) {
    return this.typoCorrector.checkAndSuggest(email);
  }
}

module.exports = EmailValidator;
