FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json yarn.lock ./

# Set environment variables
ENV NODE_ENV=production

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
