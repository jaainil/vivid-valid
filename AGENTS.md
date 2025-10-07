# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Project Patterns

- **Development server runs on port 8080** - Vite dev server uses port 8080, not the standard 5173
- **Backend connection testing** - Frontend caches backend connectivity status in sessionStorage, tests against /health endpoint before API calls
- **Environment-specific API URLs** - Frontend defaults to localhost:3001 but uses VITE_API_BASE_URL environment variable when available
- **Component tagging in development only** - "lovable-tagger" plugin active only in development mode for component identification
- **CORS accepts multiple localhost ports** - Backend accepts connections from ports 3000, 8080, 5173, and FRONTEND_URL environment variable
- **Extensive API error logging** - All API calls include console logging for debugging, responses checked for both HTTP errors and data structure
- **Rate limiting constraints** - Backend limits clients to 100 requests per 15-minute window with specific error responses
- **Path alias consistency** - "@" alias maps to src directory across frontend and backend, used consistently in imports
- **ESLint configuration** - "@typescript-eslint/no-unused-vars" rule disabled, React refresh plugin configured for component exports
- **Health check endpoint** - Backend exposes GET /health endpoint returning service status and timestamp for monitoring

## Build Commands

- Frontend: `npm run dev` (starts on port 8080), `npm run build`, `npm run build:dev`, `npm run lint`
- Backend: `npm run start`, `npm run dev` (with nodemon), `npm run test` (Jest)

## Architecture Overview

Full-stack email validation application with React/TypeScript frontend, Node.js/Express backend, comprehensive email validation APIs, shadcn/ui components, and extensive error handling patterns.
