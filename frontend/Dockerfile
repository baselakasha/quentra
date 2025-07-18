FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application for production
RUN yarn build

# Production stage with Nginx
FROM nginx:alpine

# Copy built application to nginx serve directory
COPY --from=builder /app/dist/quentra/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
