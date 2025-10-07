# Project Coding Rules (Non-Obvious Only)

- **shadcn/ui component imports** - Always use "@/components/ui/" alias for UI components, never relative paths
- **Email validation interfaces** - EmailAnalysis interface in src/lib/emailValidation.ts has 15+ required fields that must be handled
- **React Query integration** - All API calls use TanStack React Query with error boundaries and loading states
- **TypeScript strict mode** - Strict typing enforced with complex union types for email validation status
- **Component structure** - Single responsibility components with clear prop interfaces, validation components separated from UI
- **API wrapper pattern** - All backend calls go through apiCall() wrapper with consistent error handling and logging
- **Backend connectivity caching** - sessionStorage used to cache backend connection status, preventing redundant health checks
- **Environment variable pattern** - VITE_API_BASE_URL overrides default localhost:3001, must be handled in all API calls
