# Use Node.js 18 Alpine Linux image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of the app directory to the backend user
USER backend

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]