# Multi-stage build for full-stack application
FROM node:18-alpine AS base

# Install curl for health checks and pnpm for package management
RUN apk add --no-cache curl && \
    (curl -fsSL https://get.pnpm.io/install.sh | sh -)

# Set up pnpm in PATH
ENV PATH="$PATH:$(npm config get prefix)/bin"

# Create non-root user for security
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001

# Backend stage - Build the backend
FROM base AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN if command -v pnpm >/dev/null 2>&1; then \
        pnpm install --frozen-lockfile; \
    else \
        npm ci --only=production && npm cache clean --force; \
    fi

# Frontend stage - Build the frontend
FROM base AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN if command -v pnpm >/dev/null 2>&1; then \
        pnpm install --frozen-lockfile; \
    else \
        npm ci && npm cache clean --force; \
    fi

# Copy frontend source code
COPY . .

# Build frontend for production
RUN if command -v pnpm >/dev/null 2>&1; then \
        pnpm build; \
    else \
        npm run build; \
    fi

# Production stage - Final image with both frontend and backend
FROM base AS production

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend files
COPY --from=frontend-builder /app/dist ./frontend/dist

# Install serve for serving frontend (lightweight static server)
RUN npm install -g serve

# Create .env file with production defaults
RUN echo "NODE_ENV=production" > ./backend/.env && \
    echo "PORT=3001" >> ./backend/.env && \
    echo "LOG_LEVEL=info" >> ./backend/.env && \
    echo "FRONTEND_URL=http://localhost:3000" >> ./backend/.env

# Create data directory for disposable email list
RUN mkdir -p ./backend/src/data

# Change ownership to non-root user
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose ports (3000 for frontend, 3001 for backend)
EXPOSE 3000 3001

# Add health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f "http://localhost:3001/health" >/dev/null 2>&1 && \
        curl -f "http://localhost:3000" >/dev/null 2>&1 || exit 1

# Start both frontend and backend services
CMD ["sh", "-c", "serve -s frontend/dist -l 3000 & cd backend && (command -v pnpm >/dev/null 2>&1 && pnpm start || npm start)"]