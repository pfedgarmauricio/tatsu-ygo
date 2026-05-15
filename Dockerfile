# Multi-stage build for tatsu-ygo
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Compile TypeScript server
RUN npx tsc server/index.ts --target ES2020 --module ES2020 --esModuleInterop --resolveJsonModule --outDir server_build

# Production stage
FROM node:25-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy compiled server from builder
COPY --from=builder /app/server_build ./server_build

# Create data directory for tournament storage
RUN mkdir -p data

# Expose port 3001 for API
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/tournaments', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to run the server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server_build/index.js"]
