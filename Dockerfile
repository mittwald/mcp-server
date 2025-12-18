# Stage 1: Build the library package with ALL dependencies
FROM node:24.11.0-alpine AS library-builder
WORKDIR /app

# Copy root and library package files
COPY package*.json ./
COPY packages/mittwald-cli-core/package*.json ./packages/mittwald-cli-core/
COPY packages/mittwald-cli-core/tsconfig.json ./packages/mittwald-cli-core/

# Install all workspace dependencies (needed for library package)
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# Copy library source (including rendering, basecommands, ddev)
COPY packages/mittwald-cli-core/src ./packages/mittwald-cli-core/src

# Build library with all dependencies present
RUN cd packages/mittwald-cli-core && npm run build

# Stage 2: Build main application
FROM node:24.11.0-alpine AS app-builder
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssh-client

# Install Mittwald CLI globally
RUN npm install -g @mittwald/cli@1.12.0

# Copy package files for workspace setup
COPY package*.json ./
COPY packages/mittwald-cli-core/package*.json ./packages/mittwald-cli-core/
COPY packages/oauth-bridge/package*.json ./packages/oauth-bridge/
COPY packages/mcp-server/package*.json ./packages/mcp-server/

# Copy pre-built library from stage 1
COPY --from=library-builder /app/packages/mittwald-cli-core/dist ./packages/mittwald-cli-core/dist
COPY --from=library-builder /app/packages/mittwald-cli-core/node_modules ./packages/mittwald-cli-core/node_modules

# Install workspace dependencies
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# Copy application source
COPY src ./src
COPY tests ./tests
COPY tsconfig.json ./tsconfig.json
COPY packages/oauth-bridge ./packages/oauth-bridge
COPY packages/mcp-server ./packages/mcp-server

# Build main application (library already compiled)
RUN npm run build

# Stage 3: Production runtime
FROM node:24.11.0-alpine AS runtime
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssh-client
RUN npm install -g @mittwald/cli@1.12.0

# Copy built artifacts
COPY --from=app-builder /app/build ./build
COPY --from=app-builder /app/node_modules ./node_modules
COPY --from=app-builder /app/packages ./packages
COPY --from=app-builder /app/package*.json ./

# Create non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

ARG PORT=3000
EXPOSE ${PORT}
CMD ["node", "--max-old-space-size=768", "build/index.js"]
