FROM node:20.12.2-alpine
WORKDIR /app

# Install required system dependencies including SSH client
RUN apk add --no-cache openssh-client

# Install Mittwald CLI globally (version 1.11.2)
RUN npm install -g @mittwald/cli@1.12.0

COPY package*.json ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
RUN npm run build

RUN apk add --no-cache python3 py3-uv

COPY docker/openapi-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app && \
    chown nodejs:nodejs /entrypoint.sh

USER nodejs

ENV PORT=3000
EXPOSE $PORT

ENTRYPOINT ["/entrypoint.sh"]
