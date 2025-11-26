FROM node:20.12.2-alpine
WORKDIR /app

# System dependencies
RUN apk add --no-cache openssh-client

# Optional: global Mittwald CLI for any runtime hooks (kept from root Dockerfile)
RUN npm install -g @mittwald/cli@1.12.0

# Install deps
COPY package*.json ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# Copy source
COPY . .

# Build
RUN npm run build

# Port comes from Fly env (PORT)
EXPOSE 8080

CMD ["node", "build/index.js"]
