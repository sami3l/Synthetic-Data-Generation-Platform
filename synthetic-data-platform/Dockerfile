# synthetic-data-platform/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Expo CLI
RUN npm install -g @expo/cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy project files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port for Expo dev server
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8081 || exit 1

# Start Expo dev server
CMD ["npx", "expo", "start", "--web", "--port", "8081"]
