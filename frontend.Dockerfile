# Stage 1: Build React/Vite assets
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (dev dependencies are needed for the build process)
RUN npm ci

# Copy the application code
COPY . .

# Set dynamic API URL argument during build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the static site
RUN npm run build

# Stage 2: Serve build output using Nginx
FROM nginx:alpine

# Copy built assets from Stage 1 to Nginx default html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file for single-page routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
