# packages/oauth-server/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install system dependencies for health checks
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
# Install full deps for build, then prune if desired
RUN npm ci

# Copy application code
COPY . .

# Create JWKS storage directory
RUN mkdir -p /app/jwks

# Build TypeScript
RUN npm run build && npm prune --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S oauth && \
    adduser -S oauth -u 1001 -G oauth

# Change ownership of app directory
RUN chown -R oauth:oauth /app

# Switch to non-root user
USER oauth

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run application
CMD ["npm", "start"]
