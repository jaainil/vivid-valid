const EmailValidator = require("./emailValidator");
const NodeCache = require("node-cache");

// Cache for bulk validation results (30 minute TTL)
const cache = new NodeCache({ stdTTL: parseInt(process.env.BULK_CACHE_TTL) });

class BulkValidator {
  constructor(options = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || parseInt(process.env.MAX_CONCURRENCY),
      batchSize: options.batchSize || parseInt(process.env.BATCH_SIZE),
      progressCallback: options.progressCallback || null,
      enableCache: options.enableCache !== false,
      skipDuplicates: options.skipDuplicates !== false,
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

    this.emailValidator = new EmailValidator(this.options);
  }

  async validateBatch(emails) {
    const startTime = Date.now();

    // Remove duplicates if requested
    let uniqueEmails = emails;
    if (this.options.skipDuplicates) {
      uniqueEmails = [...new Set(emails.map((email) => email.toLowerCase()))];
    }

    const results = [];
    const errors = [];
    let processed = 0;

    // Process in batches to control concurrency
    for (let i = 0; i < uniqueEmails.length; i += this.options.batchSize) {
      const batch = uniqueEmails.slice(i, i + this.options.batchSize);

      try {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
        processed += batch.length;

        // Call progress callback if provided
        if (this.options.progressCallback) {
          this.options.progressCallback({
            total: uniqueEmails.length,
            processed,
            percentage: Math.round((processed / uniqueEmails.length) * 100),
          });
        }

        // Small delay between batches to prevent overwhelming
        if (i + this.options.batchSize < uniqueEmails.length) {
          await new Promise((resolve) => setTimeout(resolve, parseInt(process.env.BATCH_DELAY_MS)));
        }
      } catch (error) {
        console.error(
          `Batch processing error for batch starting at index ${i}:`,
          error
        );

        // Add error entries for this batch
        batch.forEach((email) => {
          errors.push({
            email,
            error: error.message,
            timestamp: Date.now(),
          });
        });
      }
    }

    const validationTime = Date.now() - startTime;

    return {
      total: emails.length,
      processed: results.length,
      duplicates_removed: emails.length - uniqueEmails.length,
      results,
      errors,
      validation_time: validationTime,
      summary: this.generateSummary(results),
    };
  }

  async processBatch(emails) {
    const promises = emails.map((email) => this.validateSingleEmail(email));

    // Use Promise.allSettled to handle individual failures gracefully
    const settledResults = await Promise.allSettled(promises);

    return settledResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // Return error result for failed validation
        const errorMessage =
          result.reason || result.message || "Unknown validation error";
        return {
          input: emails[index],
          syntax_valid: false,
          domain_valid: false,
          mx_found: false,
          smtp_deliverable: false,
          disposable: false,
          typo_detected: false,
          suggestion: null,
          score: 0,
          status: "error",
          reason: "Validation failed: " + errorMessage,
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
          error: errorMessage,
        };
      }
    });
  }

  async validateSingleEmail(email) {
    const cacheKey = `bulk_${email.toLowerCase()}`;

    // Check cache first
    if (this.options.enableCache && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const result = await this.emailValidator.validate(email);

      // Cache the result
      if (this.options.enableCache) {
        cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      throw new Error(`Validation failed for ${email}: ${error.message}`);
    }
  }

  generateSummary(results) {
    const summary = {
      valid: 0,
      invalid: 0,
      risky: 0,
      error: 0,
      disposable: 0,
      typos_detected: 0,
      avg_score: 0,
      domain_breakdown: {},
      status_breakdown: {},
      common_issues: [],
    };

    let totalScore = 0;
    const issues = {};
    const domains = {};

    for (const result of results) {
      // Count by status
      summary[result.status] = (summary[result.status] || 0) + 1;
      summary.status_breakdown[result.status] =
        (summary.status_breakdown[result.status] || 0) + 1;

      // Count disposable emails
      if (result.disposable) {
        summary.disposable++;
      }

      // Count typos
      if (result.typo_detected) {
        summary.typos_detected++;
      }

      // Accumulate score
      totalScore += result.score;

      // Track domains
      if (result.input && result.input.includes("@")) {
        const domain = result.input.split("@")[1].toLowerCase();
        domains[domain] = (domains[domain] || 0) + 1;
      }

      // Track common issues
      if (result.reason && result.status !== "valid") {
        issues[result.reason] = (issues[result.reason] || 0) + 1;
      }
    }

    // Calculate average score
    summary.avg_score =
      results.length > 0 ? Math.round(totalScore / results.length) : 0;

    // Get top domains
    summary.domain_breakdown = Object.entries(domains)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [domain, count]) => {
        obj[domain] = count;
        return obj;
      }, {});

    // Get common issues
    summary.common_issues = Object.entries(issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    return summary;
  }

  // Method to get detailed statistics
  getDetailedStats(results) {
    const stats = this.generateSummary(results);

    // Add more detailed analysis
    const deliverabilityStats = {
      excellent: results.filter((r) => r.score >= 90).length,
      good: results.filter((r) => r.score >= 70 && r.score < 90).length,
      fair: results.filter((r) => r.score >= 50 && r.score < 70).length,
      poor: results.filter((r) => r.score < 50).length,
    };

    const securityStats = {
      spf_enabled: results.filter((r) => r.domainHealth.spf).length,
      dkim_enabled: results.filter((r) => r.domainHealth.dkim).length,
      dmarc_enabled: results.filter((r) => r.domainHealth.dmarc).length,
      blacklisted: results.filter((r) => r.domainHealth.blacklisted).length,
    };

    const technicalStats = {
      syntax_valid: results.filter((r) => r.syntax_valid).length,
      domain_valid: results.filter((r) => r.domain_valid).length,
      mx_found: results.filter((r) => r.mx_found).length,
      smtp_deliverable: results.filter((r) => r.smtp_deliverable === true)
        .length,
      smtp_uncertain: results.filter((r) => r.smtp_deliverable === null).length,
    };

    return {
      ...stats,
      deliverability_breakdown: deliverabilityStats,
      security_features: securityStats,
      technical_validation: technicalStats,
      recommendations: this.generateRecommendations(stats, results),
    };
  }

  generateRecommendations(summary, results) {
    const recommendations = [];

    // High disposable email rate
    if (summary.disposable / results.length > 0.1) {
      recommendations.push({
        type: "warning",
        message: `${summary.disposable} disposable emails detected. Consider implementing stricter validation.`,
        action: "Filter out disposable email providers",
      });
    }

    // High typo rate
    if (summary.typos_detected / results.length > 0.05) {
      recommendations.push({
        type: "info",
        message: `${summary.typos_detected} potential typos detected. Consider implementing autocorrection.`,
        action: "Show typo suggestions to users",
      });
    }

    // Low average score
    if (summary.avg_score < 60) {
      recommendations.push({
        type: "warning",
        message: `Average email quality score is ${summary.avg_score}. Email list quality is below recommended threshold.`,
        action: "Review and clean email list",
      });
    }

    // High invalid rate
    const invalidRate = summary.invalid / results.length;
    if (invalidRate > 0.2) {
      recommendations.push({
        type: "error",
        message: `${Math.round(
          invalidRate * 100
        )}% of emails are invalid. This may impact deliverability.`,
        action: "Remove invalid emails before sending campaigns",
      });
    }

    // Domain concentration
    const topDomain = Object.entries(summary.domain_breakdown)[0];
    if (topDomain && topDomain[1] / results.length > 0.5) {
      recommendations.push({
        type: "info",
        message: `Over 50% of emails are from ${topDomain[0]}. Consider diversifying your email list.`,
        action: "Expand marketing reach to different platforms",
      });
    }

    return recommendations;
  }

  // Method to export results in various formats
  exportResults(results, format = "csv") {
    switch (format.toLowerCase()) {
      case "csv":
        return this.exportToCSV(results);
      case "json":
        return this.exportToJSON(results);
      case "xlsx":
        return this.exportToXLSX(results);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV(results) {
    const headers = [
      "Email",
      "Status",
      "Score",
      "Reason",
      "Syntax Valid",
      "Domain Valid",
      "MX Found",
      "SMTP Deliverable",
      "Disposable",
      "Typo Detected",
      "Suggestion",
      "Domain Reputation",
      "Validation Time",
    ];

    const rows = results.map((result) => [
      result.input,
      result.status,
      result.score,
      result.reason,
      result.syntax_valid,
      result.domain_valid,
      result.mx_found,
      result.smtp_deliverable,
      result.disposable,
      result.typo_detected,
      result.suggestion || "",
      result.domainHealth.reputation,
      result.validation_time,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }

  exportToJSON(results) {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total_results: results.length,
        summary: this.generateSummary(results),
        results: results,
      },
      null,
      2
    );
  }

  exportToXLSX(results) {
    // This would require additional XLSX library
    // For now, return CSV format
    return this.exportToCSV(results);
  }

  // Method to filter results by criteria
  filterResults(results, criteria) {
    return results.filter((result) => {
      for (const [key, value] of Object.entries(criteria)) {
        if (result[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Method to get cache statistics
  getCacheStats() {
    return {
      cacheSize: cache.keys().length,
      cacheHits: cache.getStats().hits,
      cacheMisses: cache.getStats().misses,
    };
  }

  // Method to clear cache
  clearCache() {
    cache.flushAll();
  }

  // Get processing performance metrics
  getPerformanceMetrics(validationTime, emailCount) {
    return {
      total_time: validationTime,
      emails_per_second: Math.round((emailCount / validationTime) * 1000),
      average_time_per_email: Math.round(validationTime / emailCount),
      throughput_rating: this.getThroughputRating(emailCount, validationTime),
    };
  }

  getThroughputRating(emailCount, validationTime) {
    const emailsPerSecond = (emailCount / validationTime) * 1000;

    if (emailsPerSecond > 50) return "excellent";
    if (emailsPerSecond > 20) return "good";
    if (emailsPerSecond > 10) return "fair";
    return "poor";
  }
}

module.exports = BulkValidator;
