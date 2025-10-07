# Vivid Valid - World's Most Accurate Email Validator

A comprehensive email validation system that combines RFC compliance, multi-layer validation, and advanced heuristics to provide the most accurate email validation in the world.

## 🌟 Features

### 🔧 Technical Excellence

- **RFC 5321/5322 Compliant**: Full implementation of email standards
- **Multi-Layer Validation**: Syntax → Domain → MX → SMTP → Heuristics
- **International Support**: IDN (Internationalized Domain Name) support
- **Real SMTP Testing**: Actual mailbox existence verification
- **Comprehensive Database**: 4,725+ disposable email domains from GitHub

### 🎯 Validation Layers

1. **Syntax Layer**: RFC-compliant email parsing with quoted strings and comments
2. **Domain Layer**: DNS resolution and MX record verification
3. **Mail Server Layer**: Real SMTP handshake and mailbox verification
4. **Deliverability Layer**: Disposable detection, role-based filtering, typo correction
5. **Reputation Layer**: Domain health, SPF/DMARC/DKIM checking

### 🚀 Advanced Features

- **Gmail Normalization**: Handles dots and plus aliases correctly
- **Role-Based Detection**: Identifies admin@, support@, info@ addresses
- **Catch-All Detection**: Detects domains that accept all emails
- **Typo Correction**: Intelligent suggestions for common typos
- **Bulk Validation**: Process hundreds of emails simultaneously
- **Real-Time Scoring**: 0-100 confidence score with detailed factors

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React + Vite) │◄──►│   (Node.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Single Email  │    │ • Email Validator│    │ • DNS Lookups   │
│ • Bulk Email    │    │ • SMTP Testing   │    │ • SMTP Servers  │
│ • Results UI    │    │ • Domain Health  │    │ • Blocklists    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Strict Mode

The validator now includes a **Strict Mode** that enables maximum validation strictness with a single switch. When enabled:

- **Stricter RFC Compliance**: Enforces stricter email format rules
- **Enhanced SMTP Testing**: More thorough mailbox verification
- **Deep Domain Analysis**: Comprehensive domain reputation checks
- **Advanced Heuristics**: Sophisticated pattern detection
- **Role-Based Detection**: Identifies role-based accounts (admin@, support@)
- **Gmail Normalization**: Proper handling of Gmail dots and plus aliases
- **Catch-All Detection**: Identifies domains that accept all emails
- **Stricter Scoring**: Higher thresholds for validity (85+ instead of 75+)

### Usage

```javascript
// Frontend - Toggle strict mode with UI switch
// Backend - Automatically enabled when useStrictMode: true
const options = {
  useStrictMode: true, // Enables all strict features
};
```

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vivid-valid
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**

   ```bash
   cd ..
   npm install
   ```

4. **Start the Backend Server**

   ```bash
   cd backend
   npm start
   ```

   Backend will run on `http://localhost:3001`

5. **Start the Frontend Development Server**
   ```bash
   cd ..
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## 🚢 Deployment with Nixpacks

This project is configured for deployment with [Nixpacks](https://nixpacks.com), which automatically generates Docker images from your source code.

### Prerequisites

- Install Nixpacks CLI:

```bash
curl -sSL https://nixpacks.com/install.sh | bash
```

### Deploy with Nixpacks

1. **Quick Deploy** (recommended):

```bash
nixpacks build
```

2. **Using the deployment script**:

```bash
# Install dependencies and build
./deploy.sh install
./deploy.sh build

# Deploy
./deploy.sh deploy

# Full pipeline (install, build, test, deploy)
./deploy.sh all
```

3. **Manual deployment with custom settings**:

```bash
nixpacks build --name vivid-valid \
  --env NODE_ENV=production \
  --env FRONTEND_URL=https://yourdomain.com
```

### Nixpacks Configuration

The `nixpacks.toml` file is configured for:

- **Node.js 18.x** runtime
- **Frontend**: React/Vite build served on port 8080
- **Backend**: Express.js API on port 3001
- **PNPM** package manager
- **Static asset serving** for the built frontend

### Environment Variables

Set these environment variables for production:

```bash
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
PORT=3001
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
SMTP_TIMEOUT=5000
SMTP_FROM_DOMAIN=validator.example.com
ENABLE_CACHE=true
CACHE_TTL=300
```

### Frontend Configuration

Update the API base URL in `src/lib/emailValidation.ts`:

```typescript
const API_BASE_URL = "http://localhost:3001/api";
```

## 📖 Usage

### Single Email Validation

```javascript
const response = await fetch("http://localhost:3001/api/email/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "john@gmail.com" }),
});

const result = await response.json();
console.log(result);
```

### Bulk Email Validation

```javascript
const response = await fetch("http://localhost:3001/api/email/validate-bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    emails: ["john@gmail.com", "jane@yahoo.com", "invalid-email"],
  }),
});

const result = await response.json();
console.log(result);
```

### API Response Format

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

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
npm test
```

### Manual Testing

Use the provided `test-emails.txt` file for comprehensive testing:

```bash
curl -X POST http://localhost:3001/api/email/validate-bulk \
  -H "Content-Type: application/json" \
  -d "{\"emails\": $(cat test-emails.txt | jq -R -s -c 'split("\n")[:-1]')}"
```

## 📊 Performance

- **Validation Speed**: ~2-5 seconds per email (with SMTP testing)
- **Bulk Processing**: 100+ emails in parallel
- **Memory Usage**: Optimized with caching and connection pooling
- **Rate Limiting**: Built-in protection against abuse

## 🔒 Security

- **Input Validation**: All inputs sanitized and validated
- **Rate Limiting**: Prevents abuse and DoS attacks
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express.js
- **No External APIs**: All validation happens locally

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Disposable Email Domains**: [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) for the comprehensive blocklist
- **RFC Standards**: Internet Engineering Task Force for email specifications
- **Node.js Ecosystem**: All the amazing packages that make this possible

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the most accurate email validation in the world**
