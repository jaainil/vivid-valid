const fs = require("fs").promises;
const path = require("path");
const NodeCache = require("node-cache");

// Cache for disposable domain lookups (24 hour TTL)
const cache = new NodeCache({ stdTTL: 86400 });

class DisposableDetector {
  constructor() {
    this.disposableDomains = new Set();
    this.loadDisposableDomains();

    // Common patterns for disposable emails
    this.disposablePatterns = [
      /temp.*mail/i,
      /10.*min.*mail/i,
      /guerrilla.*mail/i,
      /throwaway/i,
      /disposable/i,
      /fake.*mail/i,
      /spam.*mail/i,
      /trash.*mail/i,
      /mailinator/i,
      /getairmail/i,
      /sharklasers/i,
      /grr\.la/i,
      /yopmail/i,
      /maildrop/i,
      /tempail/i,
      /10minutemail/i,
      /dispostable/i,
      /spamgourmet/i,
      /mailnesia/i,
      /emailondeck/i,
      /tempinbox/i,
      /incognitomail/i,
      /anonymbox/i,
      /deadaddress/i,
      /mytrashmail/i,
      /no-spam/i,
      /spam4/i,
      /tempemail/i,
      /tempmail/i,
      /mailcatch/i,
      /mailexpire/i,
      /emailsensei/i,
      /spamex/i,
      /dropmail/i,
      /jetable/i,
      /wegwerfemail/i,
      /weg-werf-email/i,
      /email60/i,
      /mailforspam/i,
      /emailmiser/i,
      /anonbox/i,
      /spamhole/i,
      /spamstack/i,
      /spam\.la/i,
      /mintemail/i,
      /throwam/i,
      /tempsky/i,
      /discard\.email/i,
      /burnermail/i,
      /inboxkitten/i,
      /mohmal/i,
      /temp-mail/i,
      /20minutemail/i,
      /luxusmail/i,
      /spamfree24/i,
      /emailfake/i,
      /mailtemporary/i,
      /instantemail/i,
      /tempemails/i,
    ];

    // Known disposable domains (static list)
    this.knownDisposableDomains = [
      "10minutemail.com",
      "10minutemail.net",
      "20minutemail.com",
      "anonbox.net",
      "anonymbox.com",
      "burnermail.io",
      "clickamail.com",
      "deadaddress.com",
      "discard.email",
      "dropmail.me",
      "emailfake.com",
      "emailondeck.com",
      "emailsensei.com",
      "getairmail.com",
      "grr.la",
      "guerrillamail.com",
      "guerrillamail.net",
      "incognitomail.org",
      "inboxkitten.com",
      "jetable.org",
      "luxusmail.org",
      "mailcatch.com",
      "maildrop.cc",
      "mailexpire.com",
      "mailforspam.com",
      "mailinator.com",
      "mailnesia.com",
      "mintemail.com",
      "mohmal.com",
      "mytrashmail.com",
      "sharklasers.com",
      "spam.la",
      "spam4.me",
      "spamex.com",
      "spamfree24.org",
      "spamgourmet.com",
      "spamhole.com",
      "spamstack.net",
      "temp-mail.org",
      "tempail.com",
      "tempemail.com",
      "tempemail.net",
      "tempemails.net",
      "tempinbox.com",
      "tempmail.it",
      "tempmail.org",
      "tempsky.com",
      "throwam.com",
      "throwaway.email",
      "trashmail.com",
      "wegwerfemail.de",
      "yopmail.com",
      "yopmail.fr",
      "yopmail.net",
    ];

    // Add known domains to set
    this.knownDisposableDomains.forEach((domain) => {
      this.disposableDomains.add(domain.toLowerCase());
    });
  }

  async loadDisposableDomains() {
    try {
      // Load from the comprehensive GitHub disposable email domains list
      const filePath = path.join(
        __dirname,
        "..",
        "data",
        "disposable_email_blocklist.conf"
      );

      try {
        const data = await fs.readFile(filePath, "utf8");
        const domains = data
          .split("\n")
          .map((line) => line.trim().toLowerCase())
          .filter((line) => line && !line.startsWith("#"));

        // Clear existing domains and load from the comprehensive list
        this.disposableDomains.clear();
        domains.forEach((domain) => {
          this.disposableDomains.add(domain);
        });

        console.log(
          `Loaded ${domains.length} disposable domains from GitHub blocklist`
        );
      } catch (fileError) {
        // File doesn't exist, use built-in list
        console.log(
          "GitHub blocklist not found, using built-in disposable domains list"
        );
      }
    } catch (error) {
      console.error("Error loading disposable domains:", error);
    }
  }

  async isDisposable(domain) {
    const normalizedDomain = domain.toLowerCase().trim();

    // Check cache first
    const cacheKey = `disposable_${normalizedDomain}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    let isDisposable = false;

    // Check against known disposable domains
    if (this.disposableDomains.has(normalizedDomain)) {
      isDisposable = true;
    }

    // Check against patterns
    if (!isDisposable) {
      isDisposable = this.disposablePatterns.some((pattern) =>
        pattern.test(normalizedDomain)
      );
    }

    // Check for subdomain patterns (e.g., anything.10minutemail.com)
    if (!isDisposable) {
      const domainParts = normalizedDomain.split(".");
      if (domainParts.length > 2) {
        // Check if parent domain is disposable
        const parentDomain = domainParts.slice(-2).join(".");
        if (this.disposableDomains.has(parentDomain)) {
          isDisposable = true;
        }
      }
    }

    // Check for suspicious TLDs commonly used by disposable services
    if (!isDisposable) {
      const suspiciousTlds = [".tk", ".ml", ".ga", ".cf"];
      isDisposable = suspiciousTlds.some((tld) =>
        normalizedDomain.endsWith(tld)
      );
    }

    // Check for number-heavy domains (common in disposable services)
    if (!isDisposable) {
      const numberRatio =
        (normalizedDomain.match(/\d/g) || []).length / normalizedDomain.length;
      if (numberRatio > 0.3 && normalizedDomain.includes("mail")) {
        isDisposable = true;
      }
    }

    // Advanced heuristics for detecting disposable patterns
    if (!isDisposable) {
      isDisposable = this.checkAdvancedHeuristics(normalizedDomain);
    }

    // Cache the result
    cache.set(cacheKey, isDisposable);

    return isDisposable;
  }

  checkAdvancedHeuristics(domain) {
    // Check for common disposable email naming patterns
    const suspiciousPatterns = [
      // Time-based patterns
      /\d+min/i,
      /\d+hour/i,
      /\d+sec/i,
      /instant/i,
      /quick/i,
      /fast/i,

      // Action-based patterns
      /throw/i,
      /drop/i,
      /trash/i,
      /delete/i,
      /destroy/i,
      /burn/i,
      /expire/i,
      /vanish/i,

      // Purpose-based patterns
      /test/i,
      /demo/i,
      /sample/i,
      /fake/i,
      /dummy/i,
      /mock/i,

      // Privacy-based patterns
      /anon/i,
      /private/i,
      /secret/i,
      /hidden/i,
      /incognito/i,

      // Spam-related patterns
      /nospam/i,
      /antispam/i,
      /spamfree/i,
      /noads/i,

      // Generic patterns
      /mailbox/i,
      /inbox/i,
      /email/i,
      /mail/i,
    ];

    // Count how many patterns match
    const matches = suspiciousPatterns.filter((pattern) =>
      pattern.test(domain)
    ).length;

    // If multiple patterns match, it's likely disposable
    if (matches >= 2) {
      return true;
    }

    // Check for very short domains with mail-related terms
    if (domain.length <= 8 && /mail/i.test(domain)) {
      return true;
    }

    // Check for domains with excessive hyphens or numbers
    const hyphenCount = (domain.match(/-/g) || []).length;
    const numberCount = (domain.match(/\d/g) || []).length;

    if (hyphenCount > 2 || (numberCount > 3 && domain.includes("mail"))) {
      return true;
    }

    return false;
  }

  // Method to add new disposable domains (for learning/updating)
  addDisposableDomain(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    this.disposableDomains.add(normalizedDomain);

    // Clear cache for this domain
    const cacheKey = `disposable_${normalizedDomain}`;
    cache.del(cacheKey);
  }

  // Method to check if a domain is likely a business email
  async isBusinessEmail(domain) {
    const normalizedDomain = domain.toLowerCase().trim();

    // Known consumer email providers
    const consumerProviders = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "me.com",
      "mac.com",
      "live.com",
      "msn.com",
      "ymail.com",
      "rocketmail.com",
      "protonmail.com",
      "tutanota.com",
      "mail.com",
      "zoho.com",
      "fastmail.com",
    ];

    // If it's a consumer provider, it's not a business email
    if (consumerProviders.includes(normalizedDomain)) {
      return false;
    }

    // If it's disposable, it's definitely not business
    if (await this.isDisposable(normalizedDomain)) {
      return false;
    }

    // Simple heuristics for business emails
    const businessIndicators = [
      /corp/i,
      /company/i,
      /inc/i,
      /ltd/i,
      /llc/i,
      /org$/i,
      /edu$/i,
      /gov$/i,
    ];

    return businessIndicators.some((pattern) => pattern.test(normalizedDomain));
  }

  // Get statistics about disposable domains
  getStats() {
    return {
      totalDisposableDomains: this.disposableDomains.size,
      patternsCount: this.disposablePatterns.length,
      cacheSize: cache.keys().length,
    };
  }

  // Method to get disposable risk score (0-100)
  async getDisposableRiskScore(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    let riskScore = 0;

    // Direct match with known disposable domains
    if (this.disposableDomains.has(normalizedDomain)) {
      riskScore += 90;
    }

    // Pattern matching
    const patternMatches = this.disposablePatterns.filter((pattern) =>
      pattern.test(normalizedDomain)
    ).length;
    riskScore += Math.min(patternMatches * 15, 60);

    // Heuristic scoring
    if (this.checkAdvancedHeuristics(normalizedDomain)) {
      riskScore += 30;
    }

    // TLD scoring
    const suspiciousTlds = [".tk", ".ml", ".ga", ".cf"];
    if (suspiciousTlds.some((tld) => normalizedDomain.endsWith(tld))) {
      riskScore += 25;
    }

    // Domain length and structure
    if (normalizedDomain.length <= 6) {
      riskScore += 20;
    }

    return Math.min(100, riskScore);
  }
}

module.exports = DisposableDetector;
