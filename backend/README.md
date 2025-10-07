# Vivid Valid Backend - Email Validation API

World's most accurate email validation backend built with Node.js, implementing RFC 5321/5322 standards and multi-layer validation.

## 🌟 Features

### 🔧 Core Technologies

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **DNS/Promises**: MX, A/AAAA, TXT lookups
- **Punycode**: IDN domain support
- **SMTP-Connection**: Real SMTP sessions
- **Node-Cache**: High-performance caching

### 🎯 Validation Layers

#### 1. Syntax Validation (RFC 5321/5322)

- Full RFC-compliant email parsing
- Support for quoted strings and dot-atoms
- International email address support
- Pragmatic syntax validation

#### 2. Domain Validation

- DNS resolution verification
- Internationalized Domain Name (IDN) support
- Domain existence checking
- TLD validation

#### 3. MX Record Verification

- Comprehensive MX record lookup
- Priority-based mail server selection
- Fallback to A record checking
- Deliverability scoring

#### 4. SMTP Testing

- Real SMTP connection establishment
- HELO/EHLO handshake
- MAIL FROM and RCPT TO commands
- Catch-all domain detection
- Mailbox existence verification

#### 5. Advanced Heuristics

- **Disposable Email Detection**: 4,725+ domains from GitHub blocklist
- **Role-Based Account Detection**: admin@, support@, info@ identification
- **Gmail Normalization**: Dot and plus alias handling
- **Typo Detection**: Intelligent correction suggestions
- **Domain Health**: SPF, DMARC, DKIM checking

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**

   ```env
   PORT=3001
   NODE_ENV=development
   SMTP_TIMEOUT=5000
   SMTP_FROM_DOMAIN=validator.example.com
   ENABLE_CACHE=true
   CACHE_TTL=300
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX=100
   ```

5. **Start the server**
   ```bash
   npm start
   ```

For development with auto-reload:

```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

| Variable            | Description             | Default               |
| ------------------- | ----------------------- | --------------------- |
| `PORT`              | Server port             | 3001                  |
| `NODE_ENV`          | Environment             | development           |
| `SMTP_TIMEOUT`      | SMTP connection timeout | 5000                  |
| `SMTP_FROM_DOMAIN`  | Domain for SMTP FROM    | validator.example.com |
| `ENABLE_CACHE`      | Enable caching          | true                  |
| `CACHE_TTL`         | Cache TTL in seconds    | 300                   |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms | 900000                |
| `RATE_LIMIT_MAX`    | Max requests per window | 100                   |

### Validation Options

The validator supports granular control over validation layers:

```javascript
const options = {
  // Validation layers
  checkSyntax: true, // RFC syntax validation
  checkDomain: true, // Domain resolution
  checkMX: true, // MX record lookup
  checkSMTP: true, // SMTP mailbox testing
  checkDisposable: true, // Disposable email detection
  checkTypos: true, // Typo detection

  // Validation modes
  strictMode: false, // Strict RFC compliance
  allowInternational: true, // Allow international emails
  allowQuotedLocal: true, // Allow quoted local parts
  allowComments: true, // Allow comments in emails

  // Performance
  smtpTimeout: 5000, // SMTP timeout in ms
  smtpFromDomain: "validator.example.com",
  enableCache: true, // Enable result caching
  useStrictMode: false, // Enable strict validation mode
};
```

### Strict Mode

The validator includes a **Strict Mode** that enables maximum validation strictness with a single parameter. When `useStrictMode: true` is set, it automatically enables:

- `strictMode: true` - Stricter RFC compliance
- `enableStrictSMTP: true` - Enhanced SMTP testing
- `enableDeepDomainAnalysis: true` - Comprehensive domain checks
- `enableAdvancedHeuristics: true` - Sophisticated pattern detection
- `enableRoleBasedDetection: true` - Role-based account identification
- `enableGmailNormalization: true` - Gmail address normalization
- `enableCatchAllDetection: true` - Catch-all domain detection
- `allowQuotedLocal: false` - Disallow quoted local parts
- `allowComments: false` - Disallow comments in emails

Strict mode also applies stricter scoring thresholds:

- Valid: 85+ points (instead of 75+)
- Risky: 65+ points (instead of 50+)

```

## 📖 API Documentation

### Base URL

```

http://localhost:3001/api

````

### Endpoints

#### POST /email/validate

Validate a single email address.

**Request:**

```json
{
  "email": "john@gmail.com",
  "options": {
    "checkSMTP": true,
    "strictMode": false
  }
}
````

**Response:**

```json
{
  "success": true,
  "data": {
    "input": "john@gmail.com",
    "syntax_valid": true,
    "domain_valid": true,
    "mx_found": true,
    "smtp_deliverable": false,
    "disposable": false,
    "typo_detected": false,
    "suggestion": null,
    "score": 82,
    "status": "valid",
    "reason": "Email appears to be valid and deliverable",
    "factors": {
      "format": true,
      "domain": true,
      "mx": true,
      "smtp": false,
      "reputation": 75,
      "deliverability": 100
    },
    "domainHealth": {
      "spf": true,
      "dkim": false,
      "dmarc": true,
      "blacklisted": false,
      "reputation": 100
    },
    "normalized_email": "john@gmail.com",
    "is_role_based": false,
    "is_catch_all": false,
    "gmail_normalized": "john@gmail.com",
    "has_plus_alias": false,
    "validation_time": 259,
    "checks_performed": [
      "syntax",
      "typos",
      "disposable",
      "domain",
      "mx",
      "smtp",
      "domain_health"
    ]
  }
}
```

#### POST /email/validate-bulk

Validate multiple email addresses simultaneously.

**Request:**

```json
{
  "emails": ["john@gmail.com", "jane@yahoo.com", "invalid-email"],
  "options": {
    "checkSMTP": false,
    "enableCache": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 3,
    "processed": 3,
    "duplicates_removed": 0,
    "results": [
      {
        "input": "john@gmail.com",
        "syntax_valid": true,
        "domain_valid": true,
        "mx_found": true,
        "smtp_deliverable": null,
        "disposable": false,
        "typo_detected": false,
        "suggestion": null,
        "score": 85,
        "status": "valid",
        "reason": "Email appears to be valid"
      }
    ],
    "errors": [],
    "validation_time": 1500,
    "summary": {
      "valid": 2,
      "invalid": 1,
      "risky": 0,
      "error": 0,
      "disposable": 0,
      "typos_detected": 0,
      "avg_score": 70,
      "domain_breakdown": {
        "gmail.com": 1,
        "yahoo.com": 1
      },
      "status_breakdown": {
        "valid": 2,
        "invalid": 1
      },
      "common_issues": [
        {
          "issue": "Invalid syntax",
          "count": 1
        }
      ]
    }
  }
}
```

#### POST /email/suggest

Get typo correction suggestions for an email.

**Request:**

```json
{
  "email": "john@gmai.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": {
      "typoDetected": true,
      "suggestion": "john@gmail.com",
      "corrections": ["Did you mean gmail.com?"],
      "confidence": 95
    }
  }
}
```

#### GET /email/domain/{domain}/health

Check domain health and security configuration.

**Response:**

```json
{
  "success": true,
  "data": {
    "health": {
      "spf": true,
      "dkim": false,
      "dmarc": true,
      "blacklisted": false,
      "reputation": 85
    }
  }
}
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Performance Tests

```bash
npm run test:performance
```

### Test Coverage

```bash
npm run test:coverage
```

## 📊 Performance

### Benchmarks

- **Single Validation**: ~2-5 seconds (with SMTP)
- **Bulk Validation**: 100 emails in ~10 seconds
- **Memory Usage**: ~50MB base + ~1MB per 100 emails
- **Cache Hit Rate**: ~85% for repeated domains

### Optimization Features

- **Connection Pooling**: Reused SMTP connections
- **DNS Caching**: Cached DNS lookups
- **Result Caching**: Cached validation results
- **Parallel Processing**: Concurrent bulk validation
- **Rate Limiting**: Prevents abuse

## 🔒 Security

### Input Validation

- All inputs sanitized and validated
- SQL injection prevention
- XSS protection
- Command injection prevention

### Rate Limiting

- Window-based rate limiting
- IP-based tracking
- Configurable limits
- Abuse prevention

### Security Headers

- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- XSS Protection

### Data Privacy

- No email storage
- No logging of email content
- Anonymous validation
- GDPR compliant

## 🚀 Deployment

### Environment-Specific Configs

- **Development**: Full logging, debug mode
- **Production**: Optimized, minimal logging
- **Testing**: Mock services, test data

### Scaling Considerations

- **Horizontal Scaling**: Stateless design
- **Load Balancing**: Multiple instances
- **Database**: Redis for distributed caching
- **Monitoring**: Health checks and metrics

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Install dependencies
4. Write tests for new features
5. Ensure all tests pass
6. Submit pull request

### Code Style

- Use ESLint configuration
- Follow existing patterns
- Add JSDoc comments
- Write comprehensive tests

### Commit Guidelines

- Use semantic commit messages
- Include issue references
- Keep changes focused
- Update documentation

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Disposable Email Domains**: GitHub blocklist maintainers
- **RFC Standards**: IETF for email specifications
- **Node.js Community**: Package maintainers and contributors

---

**Built with precision for the most accurate email validation in the world**
