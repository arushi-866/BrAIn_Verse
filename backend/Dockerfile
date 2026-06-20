# Use the official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the backend files
COPY . .

# Expose the API port (as hardcoded in server.js)
EXPOSE 3001

# Command to run the application
CMD ["node", "server.js"]
