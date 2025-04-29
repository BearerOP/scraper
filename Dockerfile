# Use the official Node.js base image
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your app uses
EXPOSE 8081

# Start the server
CMD ["npm", "start"]
