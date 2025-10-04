# syntax=docker/dockerfile:1

FROM node:20.12.2-alpine AS build
WORKDIR /app

# Copy repo-level TypeScript config that the bridge package extends
COPY tsconfig.json ./tsconfig.json
COPY config/mittwald-scopes.json ./config/mittwald-scopes.json

# Copy bridge sources and package metadata
COPY packages/oauth-bridge/package.json ./packages/oauth-bridge/package.json
COPY packages/oauth-bridge/tsconfig.json ./packages/oauth-bridge/tsconfig.json
COPY packages/oauth-bridge/src ./packages/oauth-bridge/src

# Install dependencies and build the bridge
RUN cd packages/oauth-bridge \
  && npm install \
  && npm run build \
  && npm prune --omit=dev

FROM node:20.12.2-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and runtime dependencies
COPY --from=build /app/packages/oauth-bridge/dist ./dist
COPY --from=build /app/packages/oauth-bridge/node_modules ./node_modules
COPY packages/oauth-bridge/package.json ./package.json
COPY config/mittwald-scopes.json ./config/mittwald-scopes.json

EXPOSE 3000
CMD ["node", "dist/server.js"]
