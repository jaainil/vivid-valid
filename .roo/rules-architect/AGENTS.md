# Project Architecture Rules (Non-Obvious Only)

- **Frontend-backend communication** - Strict API wrapper pattern with consistent error handling across all endpoints
- **State management strategy** - React Query for server state, React Context for theme, local state for UI interactions
- **Development workflow architecture** - Multiple localhost ports required for frontend-backend communication during development
- **Error boundary patterns** - Comprehensive error handling with graceful degradation for email validation failures
- **Security architecture** - Rate limiting and CORS configured for production deployment, not just development convenience
- **Monitoring architecture** - Health check endpoint provides system visibility without requiring authentication
- **Caching strategy** - sessionStorage-based backend connectivity caching prevents unnecessary network requests
