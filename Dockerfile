# Stage 1: Build React frontend
FROM node:20-alpine AS frontend

WORKDIR /app


# Copy package manifest and install dependencies (layer cached separately from source)
COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Install backend production dependencies
FROM node:20-alpine AS backend-deps

WORKDIR /app

# Copy only lockfiles first for optimal layer caching
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

# Stage 3: Lean production image — Node.js only
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy backend production deps and source
COPY --from=backend-deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup backend/ ./

# Copy built React frontend into Express public directory
COPY --from=frontend --chown=appuser:appgroup /app/dist ./public

ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
