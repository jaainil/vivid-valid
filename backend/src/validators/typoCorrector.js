const NodeCache = require("node-cache");

// Cache for typo corrections (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600 });

class TypoCorrector {
  constructor() {
    // Common domain typos mapping
    this.domainCorrections = {
      // Gmail variations
      "gmail.con": "gmail.com",
      "gmail.co": "gmail.com",
      "gmai.com": "gmail.com",
      "gmial.com": "gmail.com",
      "gmal.com": "gmail.com",
      "gmeil.com": "gmail.com",
      "gnail.com": "gmail.com",
      "gimail.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "gmail.comm": "gmail.com",
      "gmail.ccom": "gmail.com",
      "gmail.om": "gmail.com",
      "gmail.cm": "gmail.com",
      "gmailo.com": "gmail.com",
      "gmail.c": "gmail.com",

      // Yahoo variations
      "yahoo.con": "yahoo.com",
      "yahoo.co": "yahoo.com",
      "yhoo.com": "yahoo.com",
      "yaho.com": "yahoo.com",
      "yahoo.om": "yahoo.com",
      "yahoo.cm": "yahoo.com",
      "yahooo.com": "yahoo.com",
      "yahoo.comm": "yahoo.com",
      "yahho.com": "yahoo.com",
      "yaoho.com": "yahoo.com",
      "yahoo.c": "yahoo.com",

      // Hotmail variations
      "hotmail.con": "hotmail.com",
      "hotmail.co": "hotmail.com",
      "hotnail.com": "hotmail.com",
      "hotmial.com": "hotmail.com",
      "hotmal.com": "hotmail.com",
      "hotmeil.com": "hotmail.com",
      "hotmail.om": "hotmail.com",
      "hotmail.cm": "hotmail.com",
      "hotmail.comm": "hotmail.com",
      "hotmaill.com": "hotmail.com",
      "hotmial.co": "hotmail.com",

      // Outlook variations
      "outlook.con": "outlook.com",
      "outlook.co": "outlook.com",
      "outlok.com": "outlook.com",
      "outloo.com": "outlook.com",
      "outlook.om": "outlook.com",
      "outlook.cm": "outlook.com",
      "outlook.comm": "outlook.com",
      "outlookk.com": "outlook.com",
      "outllook.com": "outlook.com",

      // iCloud variations
      "icloud.con": "icloud.com",
      "icloud.co": "icloud.com",
      "iclod.com": "icloud.com",
      "icoud.com": "icloud.com",
      "icloud.om": "icloud.com",
      "icloud.cm": "icloud.com",

      // AOL variations
      "aol.con": "aol.com",
      "aol.co": "aol.com",
      "ao.com": "aol.com",
      "aoll.com": "aol.com",

      // Protonmail variations
      "protonmail.con": "protonmail.com",
      "protonmail.co": "protonmail.com",
      "protonmial.com": "protonmail.com",
      "protonmal.com": "protonmail.com",

      // Other common domains
      "live.con": "live.com",
      "live.co": "live.com",
      "msn.con": "msn.com",
      "msn.co": "msn.com",
      "mail.con": "mail.com",
      "mail.co": "mail.com",
      "ymail.con": "ymail.com",
      "ymail.co": "ymail.com",

      // Common TLD typos
      ".con": ".com",
      ".co": ".com",
      ".cmo": ".com",
      ".comm": ".com",
      ".om": ".com",
      ".cm": ".com",
      ".ccom": ".com",
    };

    // Common keyboard layout typos
    this.keyboardLayouts = {
      qwerty: {
        q: ["w", "a", "s"],
        w: ["q", "e", "a", "s", "d"],
        e: ["w", "r", "s", "d", "f"],
        r: ["e", "t", "d", "f", "g"],
        t: ["r", "y", "f", "g", "h"],
        y: ["t", "u", "g", "h", "j"],
        u: ["y", "i", "h", "j", "k"],
        i: ["u", "o", "j", "k", "l"],
        o: ["i", "p", "k", "l"],
        p: ["o", "l"],
        a: ["q", "w", "s", "z", "x"],
        s: ["q", "w", "e", "a", "d", "z", "x", "c"],
        d: ["w", "e", "r", "s", "f", "x", "c", "v"],
        f: ["e", "r", "t", "d", "g", "c", "v", "b"],
        g: ["r", "t", "y", "f", "h", "v", "b", "n"],
        h: ["t", "y", "u", "g", "j", "b", "n", "m"],
        j: ["y", "u", "i", "h", "k", "n", "m"],
        k: ["u", "i", "o", "j", "l", "m"],
        l: ["i", "o", "p", "k"],
        z: ["a", "s", "x"],
        x: ["a", "s", "d", "z", "c"],
        c: ["s", "d", "f", "x", "v"],
        v: ["d", "f", "g", "c", "b"],
        b: ["f", "g", "h", "v", "n"],
        n: ["g", "h", "j", "b", "m"],
        m: ["h", "j", "k", "n"],
      },
    };
  }

  async checkAndSuggest(email) {
    const cacheKey = `typo_${email}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = {
      typoDetected: false,
      suggestion: null,
      corrections: [],
      confidence: 0,
    };

    try {
      // Basic email format check
      if (!email || !email.includes("@")) {
        result.corrections.push("Email must contain @ symbol");
        cache.set(cacheKey, result);
        return result;
      }

      const [localPart, domain] = email.split("@");

      if (!localPart || !domain) {
        result.corrections.push("Email must have both local and domain parts");
        cache.set(cacheKey, result);
        return result;
      }

      // Check for domain typos (only for actual typos)
      const domainCorrection = this.checkDomainTypos(domain);
      if (domainCorrection) {
        result.typoDetected = true;
        result.suggestion = `${localPart}@${domainCorrection.suggested}`;
        result.corrections.push(`Did you mean ${domainCorrection.suggested}?`);
        result.confidence = domainCorrection.confidence;

        // Early return if we found a real typo
        cache.set(cacheKey, result);
        return result;
      }

      // Check for missing TLD
      if (!domain.includes(".")) {
        result.typoDetected = true;
        result.corrections.push(
          "Domain is missing top-level domain (e.g., .com, .org)"
        );
        result.suggestion = `${localPart}@${domain}.com`;
      }

      // Check for double dots
      if (email.includes("..")) {
        result.typoDetected = true;
        result.corrections.push("Email contains consecutive dots");
        result.suggestion = email.replace(/\.+/g, ".");
      }

      // Check for spaces
      if (email.includes(" ")) {
        result.typoDetected = true;
        result.corrections.push("Email contains spaces");
        result.suggestion = email.replace(/\s+/g, "");
      }

      // Only check for very obvious local part issues (dots, spaces)
      if (localPart.includes("..") && !result.typoDetected) {
        result.typoDetected = true;
        result.suggestion = `${localPart.replace(/\.+/g, ".")}@${domain}`;
        result.corrections.push("Consecutive dots in local part");
      }

      // Disable other aggressive corrections that cause false positives

      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Typo correction error:", error);
      cache.set(cacheKey, result);
      return result;
    }
  }

  checkDomainTypos(domain) {
    const lowercaseDomain = domain.toLowerCase();

    // Direct lookup in corrections mapping
    if (this.domainCorrections[lowercaseDomain]) {
      return {
        suggested: this.domainCorrections[lowercaseDomain],
        confidence: 95,
      };
    }

    // Check for TLD typos
    for (const typo in this.domainCorrections) {
      if (typo.startsWith(".") && lowercaseDomain.endsWith(typo)) {
        const correctedDomain = lowercaseDomain.replace(
          typo,
          this.domainCorrections[typo]
        );
        return {
          suggested: correctedDomain,
          confidence: 90,
        };
      }
    }

    // Check for similar domains using edit distance
    const suggestion = this.findSimilarDomain(lowercaseDomain);
    if (suggestion) {
      return {
        suggested: suggestion,
        confidence: 80,
      };
    }

    return null;
  }

  findSimilarDomain(domain) {
    const popularDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "protonmail.com",
      "live.com",
      "msn.com",
      "ymail.com",
      "mail.com",
    ];

    // DON'T suggest corrections for domains that are already popular/correct
    if (popularDomains.includes(domain.toLowerCase())) {
      return null;
    }

    let bestMatch = null;
    let lowestDistance = Infinity;

    for (const popularDomain of popularDomains) {
      const distance = this.calculateEditDistance(
        domain.toLowerCase(),
        popularDomain
      );

      // Only suggest if the edit distance is reasonable (1-3 characters different)
      if (distance > 0 && distance <= 3 && distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = popularDomain;
      }
    }

    // Only return if the edit distance suggests it's a likely typo
    return lowestDistance <= 2 ? bestMatch : null;
  }

  calculateEditDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Calculate edit distance
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  checkLocalPartTypos(localPart) {
    // Check for common local part issues
    const corrections = [];

    // Remove leading/trailing dots
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return localPart.replace(/^\.+|\.+$/g, "");
    }

    // Fix consecutive dots
    if (localPart.includes("..")) {
      return localPart.replace(/\.+/g, ".");
    }

    // Check for common substitutions
    const substitutions = {
      0: "o",
      1: "l",
      3: "e",
      5: "s",
      8: "b",
    };

    let corrected = localPart;
    for (const [wrong, right] of Object.entries(substitutions)) {
      if (corrected.includes(wrong)) {
        corrected = corrected.replace(new RegExp(wrong, "g"), right);
      }
    }

    return corrected !== localPart ? corrected : null;
  }

  checkKeyboardTypos(email) {
    const [localPart, domain] = email.split("@");

    // Check if domain might be a shifted key typo
    const qwertyShifts = {
      1: "!",
      2: "@",
      3: "#",
      4: "$",
      5: "%",
      6: "^",
      7: "&",
      8: "*",
      9: "(",
      0: ")",
      q: "Q",
      w: "W",
      e: "E",
      r: "R",
      t: "T",
      y: "Y",
      u: "U",
      i: "I",
      o: "O",
      p: "P",
      a: "A",
      s: "S",
      d: "D",
      f: "F",
      g: "G",
      h: "H",
      j: "J",
      k: "K",
      l: "L",
      z: "Z",
      x: "X",
      c: "C",
      v: "V",
      b: "B",
      n: "N",
      m: "M",
    };

    // Check for adjacent key typos in domain
    if (domain) {
      const keyboard = this.keyboardLayouts.qwerty;
      let correctedDomain = "";

      for (let i = 0; i < domain.length; i++) {
        const char = domain[i].toLowerCase();
        if (keyboard[char]) {
          // This character has adjacent keys, check if any adjacent key makes more sense
          const adjacent = keyboard[char];
          const popularDomains = ["gmail.com", "yahoo.com", "hotmail.com"];

          for (const adjChar of adjacent) {
            const testDomain =
              domain.substring(0, i) + adjChar + domain.substring(i + 1);
            if (
              popularDomains.some((pd) => pd.includes(testDomain.toLowerCase()))
            ) {
              correctedDomain = testDomain;
              break;
            }
          }
        }
      }

      if (correctedDomain) {
        return `${localPart}@${correctedDomain}`;
      }
    }

    return null;
  }

  checkCharacterSubstitutions(email) {
    // Only check for obvious number-to-letter substitutions in specific contexts
    const [localPart, domain] = email.split("@");

    // Don't suggest substitutions for well-known domains
    const wellKnownDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "live.com",
      "msn.com",
    ];

    if (domain && wellKnownDomains.includes(domain.toLowerCase())) {
      return null; // Don't substitute characters in known good domains
    }

    // Only check for obvious substitutions (numbers that should clearly be letters)
    const obviousSubstitutions = [
      { from: /0/g, to: "o", pattern: /[a-z]0[a-z]/ }, // 0 between letters
      { from: /1/g, to: "l", pattern: /[a-z]1[a-z]/ }, // 1 between letters
      { from: /3/g, to: "e", pattern: /[a-z]3[a-z]/ }, // 3 between letters
      { from: /5/g, to: "s", pattern: /[a-z]5[a-z]/ }, // 5 between letters
    ];

    let corrected = email;
    let hasChanges = false;

    for (const sub of obviousSubstitutions) {
      if (sub.pattern.test(email.toLowerCase())) {
        const newCorrected = corrected.replace(sub.from, sub.to);
        if (newCorrected !== corrected) {
          corrected = newCorrected;
          hasChanges = true;
        }
      }
    }

    // Only return if we made actual improvements and result looks better
    if (
      hasChanges &&
      this.looksLikeValidEmail(corrected) &&
      corrected !== email
    ) {
      return corrected;
    }

    return null;
  }

  looksLikeValidEmail(email) {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Method to add new domain corrections (for learning)
  addDomainCorrection(wrong, correct) {
    this.domainCorrections[wrong.toLowerCase()] = correct.toLowerCase();
  }

  // Method to get suggestion confidence score
  getSuggestionConfidence(original, suggestion) {
    const editDistance = this.calculateEditDistance(
      original.toLowerCase(),
      suggestion.toLowerCase()
    );
    const maxLength = Math.max(original.length, suggestion.length);

    // Convert edit distance to confidence score (0-100)
    const similarity = 1 - editDistance / maxLength;
    return Math.round(similarity * 100);
  }

  // Method to check multiple emails for batch typo detection
  async checkBatch(emails) {
    const results = [];

    for (const email of emails) {
      const result = await this.checkAndSuggest(email);
      results.push({
        email,
        ...result,
      });
    }

    return results;
  }

  // Get statistics about typo corrections
  getStats() {
    return {
      domainCorrectionsCount: Object.keys(this.domainCorrections).length,
      cacheSize: cache.keys().length,
      keyboardLayoutsCount: Object.keys(this.keyboardLayouts).length,
    };
  }
}

module.exports = TypoCorrector;
