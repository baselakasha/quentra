FROM node:22-alpine AS builder

# Set build argument with default value
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy source code and TypeScript configs
COPY src/ ./src/
COPY tsconfig*.json ./

# Build application using production TypeScript config
RUN yarn build

# Production stage
FROM node:22-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set environment variable
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy package.json for production dependencies install
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Set environment variables
ENV NODE_ENV=production
# Required environment variables in production:
# - JWT_SECRET: Secret key for JWT token generation and validation
# - DATABASE_USERNAME: Database username
# - DATABASE_PASSWORD: Database password
# - DATABASE_HOST: Database host
# - DATABASE_NAME: Database name

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
