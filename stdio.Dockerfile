FROM node:20-alpine
WORKDIR /app

# Install required system dependencies including SSH client
RUN apk add --no-cache openssh-client

# Install Mittwald CLI globally (version 1.11.1)
RUN npm install -g @mittwald/cli@1.11.1

COPY package*.json ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
RUN npm run build
ARG PORT=3000
EXPOSE ${PORT}
CMD ["node", "build/stdio-server.js"]
