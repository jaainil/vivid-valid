# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies and curl for health checks
# Use pnpm if available, fallback to npm
RUN apk add --no-cache curl && \
    (curl -fsSL https://get.pnpm.io/install.sh | sh -) && \
    export PATH="$PATH:$(npm config get prefix)/bin" && \
    if command -v pnpm >/dev/null 2>&1; then \
        pnpm install --frozen-lockfile; \
    else \
        npm ci --only=production && npm cache clean --force; \
    fi

# Copy application code
COPY . .

# Create data directory for disposable email list
RUN mkdir -p src/data

# Create .env file with defaults if it doesn't exist
RUN if [ ! -f .env ]; then \
        echo "NODE_ENV=production" > .env && \
        echo "PORT=3001" >> .env && \
        echo "LOG_LEVEL=info" >> .env && \
        echo "FRONTEND_URL=http://localhost:8080" >> .env; \
    fi

# Change ownership of app directory to non-root user
RUN chown -R app:nodejs /app

# Switch to non-root user
USER app

# Expose port (will be overridden by environment variable)
EXPOSE 3001

# Add health check with environment variable support
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c 'PORT="${PORT:-3001}" && curl -f "http://localhost:${PORT}/health" >/dev/null 2>&1 || exit 1'

# Start the application with proper environment variable support
# Uses pnpm if available, otherwise npm
CMD ["sh", "-c", "export PATH=\"$PATH:$(npm config get prefix)/bin\" && if command -v pnpm >/dev/null 2>&1; then pnpm start; else npm start; fi"]