# Use Node.js 18 Alpine Linux image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S backend -u 1001

# Change ownership of the app directory to the backend user
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE 3001

# Health check script
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1

# Start the application
CMD ["pnpm", "start"]