const dns = require("dns").promises;
const net = require("net");
const punycode = require("punycode/");
const NodeCache = require("node-cache");
const DisposableDetector = require("./disposableDetector");
const TypoCorrector = require("./typoCorrector");
const RFCParser = require("./rfcParser");
const SMTPConnection = require("smtp-connection");
const { promisify } = require("util");

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
      smtpPort: options.smtpPort || 25,
      smtpSecure: options.smtpSecure || false,

      // Hardcore validation features
      enableStrictSMTP: options.enableStrictSMTP !== false,
      enableDeepDomainAnalysis: options.enableDeepDomainAnalysis !== false,
      enableAdvancedHeuristics: options.enableAdvancedHeuristics !== false,
      enableRoleBasedDetection: options.enableRoleBasedDetection !== false,
      enableGmailNormalization: options.enableGmailNormalization !== false,
      enableCatchAllDetection: options.enableCatchAllDetection !== false,

      // Strict mode switch - enables all strict validation features
      useStrictMode: options.useStrictMode || false,

      // Performance options
      enableCache: options.enableCache !== false,
      ...options,
    };

    // If strict mode is enabled, override other options
    if (this.options.useStrictMode || this.options.strictMode) {
      this.options.strictMode = true;
      this.options.enableStrictSMTP = true;
      this.options.enableDeepDomainAnalysis = true;
      this.options.enableAdvancedHeuristics = true;
      this.options.enableRoleBasedDetection = true;
      this.options.enableGmailNormalization = true;
      this.options.enableCatchAllDetection = true;
      this.options.allowQuotedLocal = false;
      this.options.allowComments = false;

      // Apply stricter scoring thresholds
      this.options.strictScoring = true;
    }

    this.disposableDetector = new DisposableDetector();
    this.typoCorrector = new TypoCorrector();
    this.rfcParser = new RFCParser(this.options);

    // Role-based account patterns
    this.roleBasedPatterns = [
      /^abuse@/i,
      /^admin@/i,
      /^administrator@/i,
      /^billing@/i,
      /^compliance@/i,
      /^contact@/i,
      /^info@/i,
      /^inquiry@/i,
      /^it@/i,
      /^help@/i,
      /^hostmaster@/i,
      /^list@/i,
      /^marketing@/i,
      /^news@/i,
      /^noreply@/i,
      /^no-reply@/i,
      /^null@/i,
      /^operations@/i,
      /^postmaster@/i,
      /^privacy@/i,
      /^registrar@/i,
      /^root@/i,
      /^sales@/i,
      /^security@/i,
      /^support@/i,
      /^sysadmin@/i,
      /^tech@/i,
      /^test@/i,
      /^testing@/i,
      /^trouble@/i,
      /^undisclosed@/i,
      /^unsubscribe@/i,
      /^usenet@/i,
      /^uucp@/i,
      /^webmaster@/i,
      /^www@/i,
    ];
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
      // Hardcore validation features
      normalized_email: null,
      is_role_based: false,
      is_catch_all: false,
      gmail_normalized: null,
      has_plus_alias: false,
      validation_time: 0,
      checks_performed: [],
      // Enhanced features
      is_international: false,
      idn_domain: null,
      has_typo: false,
      typo_confidence: 0,
      is_free_provider: false,
      is_business_email: false,
      domain_age_days: null,
      smtp_server_response: null,
      smtp_server_banner: null,
      tls_supported: false,
      advanced_heuristics_score: 0,
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

      // Hardcore validation features
      result.normalized_email = this.normalizeEmail(email, localPart, domain);
      result.is_role_based = this.isRoleBased(localPart);
      result.has_plus_alias = localPart.includes("+");
      result.gmail_normalized = this.normalizeGmail(localPart, domain);
      result.is_international = this.rfcParser.isInternationalDomain(domain);
      result.idn_domain = result.is_international
        ? punycode.toASCII(domain)
        : null;
      result.is_free_provider = this.isFreeProvider(domain);
      result.is_business_email = await this.isBusinessEmail(domain);

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
        result.is_catch_all = smtpResult.isCatchAll || false;
        result.smtp_server_response = smtpResult.serverResponse || null;
        result.smtp_server_banner = smtpResult.serverBanner || null;
        result.tls_supported = smtpResult.tlsSupported || false;
      }

      // Step 7: Domain health analysis
      result.checks_performed.push("domain_health");
      result.domainHealth = await this.checkDomainHealth(domain);

      // Step 8: Advanced heuristics (if enabled)
      if (this.options.enableAdvancedHeuristics) {
        result.checks_performed.push("heuristics");
        result.advanced_heuristics_score = this.calculateAdvancedHeuristics(
          email,
          localPart,
          domain,
          result
        );
      }

      // Step 9: Calculate final score and determine status
      result.score = this.calculateScore(result);
      result.factors.reputation = this.calculateReputationScore(parsed, result);

      // Determine final status with stricter thresholds
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
      } else if (result.score >= (this.options.strictScoring ? 90 : 85)) {
        // Even higher threshold for strict mode
        result.status = "valid";
        result.reason = "Email appears to be valid and deliverable";
      } else if (result.score >= (this.options.strictScoring ? 70 : 65)) {
        // Higher threshold for strict mode
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

      let serverBanner = null;
      let serverResponse = null;
      let tlsSupported = false;
      let isCatchAll = false;

      return new Promise((resolve) => {
        const socket = new net.Socket();
        let step = 0;
        let responses = [];

        const cleanup = () => {
          socket.destroy();
        };

        const timeout = setTimeout(() => {
          cleanup();
          resolve({
            deliverable: false,
            reason: "SMTP connection timeout",
            serverBanner,
            serverResponse,
            tlsSupported,
            isCatchAll,
          });
        }, this.options.smtpTimeout);

        socket.connect(this.options.smtpPort, primaryMX, () => {
          // Connected successfully, wait for greeting
        });

        socket.on("data", (data) => {
          const response = data.toString().trim();
          responses.push(response);

          // Capture server banner on first response
          if (step === 0 && response.startsWith("220")) {
            serverBanner = response;
            // Check for TLS support in banner
            tlsSupported =
              response.toLowerCase().includes("tls") ||
              response.toLowerCase().includes("starttls");
          }

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
            // Store server response
            serverResponse = response;

            if (response.startsWith("250")) {
              // Test for catch-all by sending a RCPT TO to a random address
              const randomEmail = `nonexistent-${Date.now()}@${domain}`;
              socket.write(`RCPT TO:<${randomEmail}>\r\n`);
              step = 4;
            } else if (response.startsWith("550")) {
              // Check RCPT TO response
              clearTimeout(timeout);
              cleanup();
              resolve({
                deliverable: false,
                reason: "Email address rejected by server",
                serverBanner,
                serverResponse,
                tlsSupported,
                isCatchAll,
              });
            } else {
              // Check RCPT TO response
              clearTimeout(timeout);
              cleanup();
              resolve({
                deliverable: null,
                reason: "Uncertain - server response: " + response,
                serverBanner,
                serverResponse,
                tlsSupported,
                isCatchAll,
              });
            }
          } else if (step === 4) {
            // Check catch-all response
            clearTimeout(timeout);
            cleanup();

            if (response.startsWith("250")) {
              isCatchAll = true;
            }

            resolve({
              deliverable: true,
              reason: "SMTP server accepts email",
              serverBanner,
              serverResponse,
              tlsSupported,
              isCatchAll,
            });
          }
        });

        socket.on("error", (error) => {
          clearTimeout(timeout);
          cleanup();
          resolve({
            deliverable: false,
            reason: "SMTP connection error: " + error.message,
            serverBanner,
            serverResponse,
            tlsSupported,
            isCatchAll,
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

    // Syntax (25 points) - Increased weight
    if (result.syntax_valid) score += 25;

    // Domain (20 points)
    if (result.domain_valid) score += 20;

    // MX Records (25 points)
    if (result.mx_found) score += 25;

    // SMTP (20 points) - Increased weight
    if (result.smtp_deliverable === true) score += 20;
    else if (result.smtp_deliverable === null) score += 5; // Reduced for uncertainty

    // Domain health (15 points) - Increased weight
    const healthScore =
      (result.domainHealth.spf ? 5 : 0) + // Increased from 3
      (result.domainHealth.dmarc ? 7 : 0) + // Increased from 4
      (result.domainHealth.dkim ? 3 : 0);
    score += healthScore;

    // Advanced heuristics bonus (if enabled)
    if (result.advanced_heuristics_score > 70) {
      score += 10;
    } else if (result.advanced_heuristics_score > 50) {
      score += 5;
    }

    // Penalties (stricter)
    const disposablePenalty = this.options.strictScoring ? 50 : 40;
    const blacklistedPenalty = this.options.strictScoring ? 60 : 50;
    const roleBasedPenalty = this.options.strictScoring ? 25 : 15;
    const freeProviderPenalty = this.options.strictScoring ? 10 : 5;
    const typoPenalty = this.options.strictScoring ? 25 : 15;

    if (result.disposable) score -= disposablePenalty;
    if (result.domainHealth.blacklisted) score -= blacklistedPenalty;
    if (result.is_role_based) score -= roleBasedPenalty;
    if (result.is_free_provider) score -= freeProviderPenalty;

    // Only penalize for typos if there's an actual correction suggested
    if (
      result.typo_detected &&
      result.suggestion &&
      result.suggestion !== result.input
    )
      score -= typoPenalty;

    // TLS support bonus
    if (result.tls_supported) score += 5;

    // Domain reputation bonus/penalty (10 points)
    score += (result.domainHealth.reputation - 50) / 5;

    // Business email bonus
    if (result.is_business_email) score += 10;

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

  // Enhanced Gmail normalization with strict checking
  normalizeGmail(localPart, domain) {
    if (!this.options.enableGmailNormalization) return null;

    const gmailDomains = ["gmail.com", "googlemail.com"];
    if (!gmailDomains.includes(domain.toLowerCase())) return null;

    // Remove dots (gmail ignores them)
    let normalized = localPart.replace(/\./g, "");

    // Remove everything after + (plus addressing)
    const plusIndex = normalized.indexOf("+");
    if (plusIndex !== -1) {
      normalized = normalized.substring(0, plusIndex);
    }

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    return `${normalized}@gmail.com`;
  }

  // Enhanced role-based detection
  isRoleBased(localPart) {
    if (!this.options.enableRoleBasedDetection) return false;

    return this.roleBasedPatterns.some((pattern) =>
      pattern.test(localPart.toLowerCase())
    );
  }

  // Check if domain is a free email provider
  isFreeProvider(domain) {
    const freeProviders = [
      "gmail.com",
      "googlemail.com",
      "yahoo.com",
      "yahoo.co.uk",
      "yahoo.in",
      "hotmail.com",
      "outlook.com",
      "live.com",
      "msn.com",
      "icloud.com",
      "me.com",
      "mac.com",
      "aol.com",
      "protonmail.com",
      "tutanota.com",
      "zoho.com",
      "yandex.com",
      "mail.com",
      "gmx.com",
      "gmx.net",
      "fastmail.com",
      "hushmail.com",
      "lycos.com",
      "inbox.com",
      "mail.ru",
      "rambler.ru",
      "qq.com",
      "163.com",
      "126.com",
      "sina.com",
      "sohu.com",
      "tom.com",
      "yeah.net",
      "foxmail.com",
      "vip.163.com",
      "vip.126.com",
      "vip.sina.com",
      "vip.qq.com",
      "vip.sohu.com",
      "vip.tom.com",
      "vip.yeah.net",
      "vip.foxmail.com",
      "vip.mail.ru",
      "vip.rambler.ru",
      "vip.qq.com",
      "vip.163.com",
      "vip.126.com",
      "vip.sina.com",
      "vip.sohu.com",
      "vip.tom.com",
      "vip.yeah.net",
      "vip.foxmail.com",
      "vip.mail.ru",
      "vip.rambler.ru",
    ];

    return freeProviders.includes(domain.toLowerCase());
  }

  // Check if domain is likely a business email
  async isBusinessEmail(domain) {
    // Use disposable detector's business email check
    return await this.disposableDetector.isBusinessEmail(domain);
  }

  // Calculate advanced heuristics score
  calculateAdvancedHeuristics(email, localPart, domain, result) {
    let score = 50; // Base score

    // Local part analysis
    if (localPart.length < 3) score -= 15;
    if (localPart.length > 30) score -= 10;
    if (/^[0-9]+$/.test(localPart)) score -= 25; // All numbers
    if (/^.{1,2}[0-9]+$/.test(localPart)) score -= 15; // Short prefix + numbers
    if (localPart.match(/^[a-zA-Z]{1,2}\d{4,}$/)) score -= 20; // Likely auto-generated

    // Domain analysis
    if (domain.length < 4) score -= 20;
    if (domain.length > 30) score -= 5;
    if (domain.match(/\d{3,}/)) score -= 15; // Numbers in domain
    if (domain.match(/-[a-z]{2,}-/)) score -= 10; // Multiple hyphens

    // TLD analysis
    const tld = domain.split(".").pop();
    const suspiciousTlds = [
      ".tk",
      ".ml",
      ".ga",
      ".cf",
      ".gq",
      ".top",
      ".click",
      ".download",
    ];
    if (suspiciousTlds.includes(`.${tld}`)) score -= 30;

    // Subdomain analysis
    const domainParts = domain.split(".");
    if (domainParts.length > 4) score -= 10;
    if (domainParts.some((part) => part.length < 2)) score -= 15;

    // Character distribution analysis
    const specialChars = localPart.match(/[^a-zA-Z0-9._+-]/g);
    if (specialChars && specialChars.length > 2) score -= 20;

    // Consecutive characters
    if (localPart.match(/(.)\1{2,}/)) score -= 15; // Repeated characters
    if (localPart.match(/[0-9]{6,}/)) score -= 20; // Long number sequences

    // Dictionary words in local part
    const commonWords = [
      "admin",
      "user",
      "contact",
      "info",
      "support",
      "sales",
      "marketing",
    ];
    if (commonWords.includes(localPart.toLowerCase())) score -= 10;

    // Adjust based on other validation results
    if (result.disposable) score -= 40;
    if (result.is_role_based) score -= 15;
    if (result.typo_detected) score -= 25;
    if (result.domainHealth.blacklisted) score -= 50;
    if (result.domainHealth.spf) score += 10;
    if (result.domainHealth.dmarc) score += 15;
    if (result.tls_supported) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  // Enhanced email normalization
  normalizeEmail(email, localPart, domain) {
    // Convert to lowercase
    let normalized = email.toLowerCase();

    // For Gmail, apply strict normalization
    if (this.options.enableGmailNormalization) {
      const gmailNormalized = this.normalizeGmail(localPart, domain);
      if (gmailNormalized) {
        return gmailNormalized;
      }
    }

    // For other providers, basic normalization
    normalized = normalized.trim();

    return normalized;
  }
}
module.exports = EmailValidator;
