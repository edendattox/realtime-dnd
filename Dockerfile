# Use the official Node LTS image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to leverage Docker cache
COPY package*.json ./

# Install dependencies (this installs the dev dependency "concurrently" as well)
RUN npm install

# Copy the rest of the project files into the container
COPY . .

# Build the client application
# (Assumes your client folder has its own package.json and build script)
RUN cd client && npm install && npm run build

# Optionally, if you want to serve the client build from your server,
# you can copy the build into the server folder or configure your server to serve it.

# Expose ports needed by your app
# (For example, if your server runs on 3000 and client on 3001, adjust accordingly)
EXPOSE 3000
EXPOSE 3001

# Start both the server and client concurrently in production
CMD ["npm", "run", "dev"]
