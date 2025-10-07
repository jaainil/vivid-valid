# Project Documentation Rules (Non-Obvious Only)

- **Email validation complexity** - EmailAnalysis interface contains 15+ fields requiring domain expertise for proper interpretation
- **Validation status types** - Five distinct status values: "valid", "invalid", "risky", "error", "checking" with specific meanings
- **API response structure** - All API responses wrapped in { data: T } structure, requiring .data access pattern
- **Error handling patterns** - API failures return structured error objects with validation state, not thrown exceptions
- **CORS configuration context** - Multiple localhost ports accepted due to development environment requirements
- **Rate limiting context** - 100 requests per 15-minute limit designed for production API protection
