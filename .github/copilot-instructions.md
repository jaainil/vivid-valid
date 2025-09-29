# Vivid Valid - AI Coding Agent Instructions

## Project Overview

Vivid Valid is a full-stack email validation application with a React/TypeScript frontend (Vite + Shadcn UI + Tailwind) and Node.js/Express backend. The frontend provides UI for single and bulk email verification, calling the backend API for multi-layer validation (RFC syntax, domain/MX checks, SMTP testing, disposable detection via blocklist in `backend/src/data/disposable_email_blocklist.conf`). Data flows from UI components (`src/components/BulkEmailVerifier.tsx`, `SingleEmailVerifier.tsx`) → API calls in `src/lib/emailValidation.ts` → backend routes (`backend/src/routes/emailRoutes.js`) → validators (`backend/src/validators/emailValidator.js`, etc.) → JSON response with score/status/factors. Stateless design with node-cache for results; no DB. Dockerized for deployment.

## Key Architecture Components

- **Frontend (`src/`)**: App.tsx sets up QueryClient, ThemeProvider, Router. Pages in `pages/` (Index.tsx handles routing to verifiers). UI: Shadcn components in `components/ui/` (e.g., button.tsx, input.tsx); custom in `components/` (VerificationResults.tsx displays API responses with Recharts for scoring viz).
- **Backend (`backend/src/`)**: server.js configures Express with helmet/CORS/rate-limit. Routes: emailRoutes.js handles POST /validate (single) and /validate-bulk. Validators: Modular JS files (rfcParser.js for syntax, disposableDetector.js checks against blocklist, smtp via smtp-connection lib). Data flow: Input → chain of validators → aggregate score (0-100) → response with `domainHealth` (SPF/DKIM/DMARC).
- **Cross-boundary**: Frontend uses fetch to `http://localhost:3001/api/email` (update API_BASE_URL in emailValidation.ts for prod). Backend exposes /health for monitoring.

## Development Workflows

- **Local Setup**: `cd backend && npm i && npm run dev` (nodemon on port 3001); `cd .. && npm i && npm run dev` (Vite on 5173). Use .env in backend for PORT, SMTP_TIMEOUT=5000, ENABLE_CACHE=true.
- **Build**: Frontend: `npm run build` (outputs to dist/); Backend: No build step, direct node.
- **Lint**: `npm run lint` (ESLint on .); Fix with existing config in eslint.config.js (React hooks, globals).
- **Test**: Backend: `cd backend && npm test` (Jest on validators/routes); Frontend: No dedicated tests—add via React Testing Library if extending. Manual: Use test-emails.txt with curl to /validate-bulk.
- **Debug**: Backend: Console logs in validators; Frontend: React DevTools + Tanstack Query inspector. SMTP issues: Check SMTP_FROM_DOMAIN in .env.

## Coding Conventions & Patterns

- **Frontend**: TS strict (tsconfig.json); Components: Functional with hooks (useToast from ui/, use-mobile.tsx for responsive). Forms: React Hook Form + Zod (e.g., in BulkEmailVerifier.tsx). State: Tanstack Query for API caching/mutations. Styling: Tailwind classes via clsx/cva; Dark mode via next-themes.
- **Backend**: CommonJS (require); Modular validators return {valid: bool, reason: str, score: num}. Error handling: Global in server.js (500 JSON). Caching: node-cache with TTL from env. No async/await in validators—use callbacks for SMTP.
- **Shared**: Env-driven (dotenv); Semantic commits; PRs to main trigger GH Actions. Avoid external APIs—local validation only. Internationalization: Punycode for IDN domains.

## Integration Points

- **External**: SMTP lib (smtp-connection) for RCPT TO; DNS implicit via Node; Blocklist: Update disposable_email_blocklist.conf from GitHub/disposable-email-domains.
- **Communication**: API responses include `checks_performed` array (e.g., ["syntax", "mx", "smtp"]). Frontend parses for UI (e.g., progress bars in VerificationResults.tsx). Rate-limit: 100 req/15min per IP—bump via env for testing.
- **Extensibility**: Add validators by chaining in emailValidator.js (e.g., new typoCorrector.js). Frontend: Extend routes in App.tsx before \* catch-all.

## Deployment & CI/CD

- **Docker**: `docker-compose up -d` (builds local); `docker-compose -f docker-compose.prod.yml up -d` (GHCR images: ghcr.io/${GITHUB_REPOSITORY}/frontend:latest). Health: /health on backend.
- **CI**: .github/workflows/build-and-publish.yml: Builds/pushes on push/PR/tags to GHCR (multi-arch, cache). Triggers: main/develop pushes publish latest; tags create vX.Y.Z.
- **Prod Notes**: Update image refs in compose for org repo (Aexawareinfotech-Pvt-Ltd/vivid-valid). Scale: Horizontal backend instances (stateless).

Reference: README.md for full setup; backend/README.md for API details. Focus changes on validators/UI without breaking score logic.
