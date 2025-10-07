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

## 🔧 Configuration

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
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
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

## 🚀 Railpack Deployment

This project is fully configured for deployment on [Railpack.com](https://railpack.com), a modern platform for deploying web applications.

### Quick Deploy to Railpack

1. **Push your code to GitHub**

2. **Connect your repository to Railpack**

   - Go to [Railpack.com](https://railpack.com)
   - Click "New Project"
   - Connect your GitHub repository
   - Select the "vivid-valid" repository

3. **Configure Environment Variables**
   Railpack will automatically use the `.env.railpack` file, but you can override these settings in the Railpack dashboard:

   ```env
   PORT=3001
   NODE_ENV=production
   SMTP_TIMEOUT=5000
   SMTP_FROM_DOMAIN=vivid-valid.railway.app
   ENABLE_CACHE=true
   CACHE_TTL=300
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX=100
   VITE_API_BASE_URL=https://your-app-url.railway.app/api
   ```

4. **Deploy**
   - Click "Deploy" and Railpack will automatically build and deploy your application
   - The deployment includes both frontend and backend services

### Railpack Configuration

The project includes a [`railpack.config.js`](railpack.config.js) file that configures:

- **Frontend**: Built with Vite and served via Nginx
- **Backend**: Node.js Express API server
- **Environment Variables**: Automatic configuration for production
- **Health Checks**: `/health` endpoint for monitoring
- **Optimization**: Compression, caching, and minification

### Manual Deployment Commands

If you prefer to deploy manually using the Railpack CLI:

```bash
# Install Railpack CLI
npm install -g @railpack/cli

# Build for Railpack
npm run railpack:build

# Deploy to Railpack
npm run railpack:deploy

# Run in development mode with Railpack
npm run railpack:dev
```

### Environment-Specific Configurations

- **Development**: Uses local backend on `http://localhost:3001`
- **Production**: Uses deployed API endpoints with proper environment variables
- **API Configuration**: Frontend automatically detects environment and adjusts API URLs

### Monitoring and Health Checks

Railpack automatically monitors your application using:

- **Health Endpoint**: `/health` for backend health
- **Frontend Health**: Nginx health checks
- **Automatic Restarts**: Failed services are automatically restarted
- **Logs**: Centralized logging through Railpack dashboard

### Scaling

Railpack supports automatic scaling:

- **Horizontal Scaling**: Multiple instances based on load
- **Load Balancing**: Built-in load balancer
- **Database Scaling**: Easy integration with managed databases

---

**Built with ❤️ for the most accurate email validation in the world**
