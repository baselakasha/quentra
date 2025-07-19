FROM node:22-alpine AS builder

# Set build argument with default value
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy source code
COPY . .

# Build application for production
RUN yarn build --configuration=production

# Production stage with Nginx
FROM nginx:alpine

# Copy built application to nginx serve directory
COPY --from=builder /app/dist/frontend-quentra/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
