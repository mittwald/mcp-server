FROM node:24.11.0-alpine
WORKDIR /app

# Install required system dependencies including SSH client
RUN apk add --no-cache openssh-client

# Install Mittwald CLI globally (version 1.12.0)
RUN npm install -g @mittwald/cli@1.12.0

COPY package*.json ./
COPY packages/mittwald-cli-core/package*.json ./packages/mittwald-cli-core/
COPY packages/oauth-bridge/package*.json ./packages/oauth-bridge/
COPY packages/mcp-server/package*.json ./packages/mcp-server/
RUN npm ci --ignore-scripts || npm install --ignore-scripts

COPY . .
RUN rm -rf packages/mittwald-cli-core/src/rendering
RUN cd packages/mittwald-cli-core && npm run build && cd ../..
RUN npm run build

# Create non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

ARG PORT=3000
EXPOSE ${PORT}
CMD ["node", "--max-old-space-size=768", "build/index.js"]
