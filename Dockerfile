# Use Node.js 18 Alpine Linux image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile && pnpm store prune

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S frontend -u 1001

# Change ownership of the app directory to the frontend user
RUN chown -R frontend:nodejs /app
USER frontend

# Expose port
EXPOSE 8080

# Health check script
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080 || exit 1

# Build the application
RUN pnpm run build

# Start the application with vite preview on configured port
CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port ${FRONTEND_PORT:-8080}"]