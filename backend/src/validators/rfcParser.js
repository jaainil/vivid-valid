const punycode = require("punycode/");

class RFCParser {
  constructor(options = {}) {
    this.options = options;

    // RFC 5321/5322 compliant regex patterns
    this.patterns = {
      // Simplified but comprehensive email regex based on RFC 5322
      rfc5322:
        /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

      // Quoted local part pattern
      quotedLocal:
        /^"(?:[^"\\]|\\.)*"@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

      // Comment pattern (simplified)
      withComments:
        /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*\s*\([^)]*\)\s*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

      // Domain pattern
      domain:
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,

      // International domain pattern (after punycode conversion)
      internationalDomain:
        /^(?:xn--[a-zA-Z0-9-]+\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
    };
  }

  validateRFC(email) {
    try {
      // Basic null/empty check
      if (!email || typeof email !== "string") {
        return { valid: false, reason: "Email must be a non-empty string" };
      }

      // Trim whitespace
      email = email.trim();

      // Length check (RFC 5321 limit)
      if (email.length > 320) {
        return {
          valid: false,
          reason: "Email exceeds maximum length of 320 characters",
        };
      }

      // Must contain exactly one @ symbol
      const atCount = (email.match(/@/g) || []).length;
      if (atCount !== 1) {
        return {
          valid: false,
          reason:
            atCount === 0 ? "Missing @ symbol" : "Multiple @ symbols found",
        };
      }

      // Parse local and domain parts
      const [localPart, domain] = email.split("@");

      // Validate local part
      const localValidation = this.validateLocalPart(localPart);
      if (!localValidation.valid) {
        return localValidation;
      }

      // Validate domain part
      const domainValidation = this.validateDomainPart(domain);
      if (!domainValidation.valid) {
        return domainValidation;
      }

      // Check for internationalized domain names
      if (this.options.allowInternational) {
        try {
          const asciiDomain = punycode.toASCII(domain);
          if (asciiDomain !== domain) {
            // It's an IDN, validate the ASCII version
            const idnValidation = this.validateDomainPart(asciiDomain);
            if (!idnValidation.valid) {
              return {
                valid: false,
                reason:
                  "Invalid internationalized domain: " + idnValidation.reason,
              };
            }
          }
        } catch (error) {
          return {
            valid: false,
            reason: "Invalid internationalized domain encoding",
          };
        }
      }

      // Advanced RFC checks
      const advancedValidation = this.performAdvancedValidation(
        email,
        localPart,
        domain
      );
      if (!advancedValidation.valid) {
        return advancedValidation;
      }

      return { valid: true, reason: "Email passes RFC 5321/5322 validation" };
    } catch (error) {
      return {
        valid: false,
        reason: "Syntax validation error: " + error.message,
      };
    }
  }

  validateLocalPart(localPart) {
    // Length check (RFC 5321)
    if (localPart.length > 64) {
      return { valid: false, reason: "Local part exceeds 64 characters" };
    }

    if (localPart.length === 0) {
      return { valid: false, reason: "Local part cannot be empty" };
    }

    // Check for quoted local part
    if (localPart.startsWith('"') && localPart.endsWith('"')) {
      if (!this.options.allowQuotedLocal) {
        return {
          valid: false,
          reason: "Quoted local parts not allowed in strict mode",
        };
      }
      return this.validateQuotedLocalPart(localPart);
    }

    // Check for dots at beginning or end
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return {
        valid: false,
        reason: "Local part cannot start or end with a dot",
      };
    }

    // Check for consecutive dots
    if (localPart.includes("..")) {
      return {
        valid: false,
        reason: "Local part cannot contain consecutive dots",
      };
    }

    // Validate characters in local part
    const validLocalChars =
      /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
    if (!validLocalChars.test(localPart)) {
      return { valid: false, reason: "Local part contains invalid characters" };
    }

    return { valid: true };
  }

  validateQuotedLocalPart(localPart) {
    // Remove outer quotes
    const content = localPart.slice(1, -1);

    // Check for valid quoted content
    // Allow any ASCII character except \ and " unless escaped
    let i = 0;
    while (i < content.length) {
      const char = content[i];

      if (char === "\\") {
        // Escape sequence
        if (i + 1 >= content.length) {
          return {
            valid: false,
            reason: "Invalid escape sequence in quoted local part",
          };
        }
        i += 2; // Skip escaped character
      } else if (char === '"') {
        return { valid: false, reason: "Unescaped quote in quoted local part" };
      } else if (char.charCodeAt(0) > 127) {
        return {
          valid: false,
          reason: "Non-ASCII character in quoted local part",
        };
      } else {
        i++;
      }
    }

    return { valid: true };
  }

  validateDomainPart(domain) {
    // Length check
    if (domain.length > 253) {
      return { valid: false, reason: "Domain exceeds 253 characters" };
    }

    if (domain.length === 0) {
      return { valid: false, reason: "Domain cannot be empty" };
    }

    // Check for IP address literals (not commonly used)
    if (domain.startsWith("[") && domain.endsWith("]")) {
      return this.validateIPLiteral(domain);
    }

    // Split into labels
    const labels = domain.split(".");

    // Must have at least two labels (e.g., example.com)
    if (labels.length < 2) {
      return { valid: false, reason: "Domain must have at least two labels" };
    }

    // Validate each label
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelValidation = this.validateDomainLabel(
        label,
        i === labels.length - 1
      );
      if (!labelValidation.valid) {
        return labelValidation;
      }
    }

    return { valid: true };
  }

  validateDomainLabel(label, isTopLevel = false) {
    // Length check (RFC 1035)
    if (label.length > 63) {
      return { valid: false, reason: "Domain label exceeds 63 characters" };
    }

    if (label.length === 0) {
      return { valid: false, reason: "Domain label cannot be empty" };
    }

    // Cannot start or end with hyphen
    if (label.startsWith("-") || label.endsWith("-")) {
      return {
        valid: false,
        reason: "Domain label cannot start or end with hyphen",
      };
    }

    // Top-level domain must be alphabetic
    if (isTopLevel) {
      if (!/^[a-zA-Z]+$/.test(label)) {
        return {
          valid: false,
          reason: "Top-level domain must contain only letters",
        };
      }
      if (label.length < 2) {
        return {
          valid: false,
          reason: "Top-level domain must be at least 2 characters",
        };
      }
    } else {
      // Non-TLD labels can contain letters, numbers, and hyphens
      if (!/^[a-zA-Z0-9-]+$/.test(label)) {
        return {
          valid: false,
          reason: "Domain label contains invalid characters",
        };
      }
    }

    return { valid: true };
  }

  validateIPLiteral(ipLiteral) {
    // Remove brackets
    const ip = ipLiteral.slice(1, -1);

    // Check for IPv4
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ip.match(ipv4Pattern);

    if (ipv4Match) {
      // Validate IPv4 octets
      for (let i = 1; i <= 4; i++) {
        const octet = parseInt(ipv4Match[i], 10);
        if (octet > 255) {
          return {
            valid: false,
            reason: "Invalid IPv4 address in domain literal",
          };
        }
      }
      return { valid: true };
    }

    // Check for IPv6 (simplified)
    if (ip.includes(":")) {
      // Very basic IPv6 validation
      const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
      if (ipv6Pattern.test(ip)) {
        return { valid: true };
      }
    }

    return { valid: false, reason: "Invalid IP address in domain literal" };
  }

  performAdvancedValidation(email, localPart, domain) {
    // Check for common format issues
    if (email.includes(" ")) {
      return { valid: false, reason: "Email contains unescaped spaces" };
    }

    // Check for valid TLD length
    const tld = domain.split(".").pop();
    if (tld.length < 2 || tld.length > 6) {
      return { valid: false, reason: "Invalid top-level domain length" };
    }

    // Check for suspicious patterns
    if (this.options.strictMode) {
      // In strict mode, be more restrictive

      // No plus addressing in strict mode
      if (localPart.includes("+")) {
        return {
          valid: false,
          reason: "Plus addressing not allowed in strict mode",
        };
      }

      // No unusual characters
      if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
        return {
          valid: false,
          reason: "Local part contains unusual characters (strict mode)",
        };
      }
    }

    return { valid: true };
  }

  parseEmail(email) {
    try {
      const validation = this.validateRFC(email);
      if (!validation.valid) {
        return null;
      }

      const [localPart, domain] = email.split("@");

      return {
        original: email,
        localPart: localPart,
        domain: domain.toLowerCase(),
        isQuoted: localPart.startsWith('"') && localPart.endsWith('"'),
        isInternational: this.isInternationalDomain(domain),
        normalizedDomain: this.normalizeDomain(domain),
      };
    } catch (error) {
      return null;
    }
  }

  isInternationalDomain(domain) {
    try {
      return punycode.toASCII(domain) !== domain;
    } catch (error) {
      return false;
    }
  }

  normalizeDomain(domain) {
    try {
      // Convert to lowercase and punycode
      return punycode.toASCII(domain.toLowerCase());
    } catch (error) {
      return domain.toLowerCase();
    }
  }

  // Utility method to get detailed parsing information
  getParsingDetails(email) {
    const parsed = this.parseEmail(email);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      localPartLength: parsed.localPart.length,
      domainLength: parsed.domain.length,
      totalLength: email.length,
      domainLabels: parsed.domain.split("."),
      hasSubdomains: parsed.domain.split(".").length > 2,
      tld: parsed.domain.split(".").pop(),
      isValidRFC5321: this.validateRFC(email).valid,
    };
  }
}

module.exports = RFCParser;
