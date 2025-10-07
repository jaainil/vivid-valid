# Project Debug Rules (Non-Obvious Only)

- **API logging locations** - All API calls log to browser console with request/response details for debugging
- **Backend connection caching** - sessionStorage key "backendConnected" prevents redundant /health endpoint calls
- **Error response structure** - API errors return both HTTP status and structured error data with retry information
- **Rate limit debugging** - Backend returns specific 429 responses with "retryAfter" field when rate limited
- **Environment variable debugging** - VITE_API_BASE_URL environment variable overrides hardcoded localhost:3001
- **Health check debugging** - GET /health endpoint provides service status without authentication for monitoring
