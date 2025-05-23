# Stage 1: Build the Nuxt application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./
# Or if using yarn:
# COPY package.json yarn.lock ./

# Install dependencies
RUN npm install
# Or if using yarn:
# RUN yarn install

# Copy the rest of the application source code
COPY . .

# Build the application for production using nuxi build
RUN npm run build

# Prune development dependencies if you want a smaller final node_modules for runtime
# This step is optional but good practice if the runtime needs node_modules
# RUN npm prune --production

# Stage 2: Serve the Nuxt application using a Node.js server
FROM node:18-alpine

WORKDIR /app

# Set the Node environment to production
ENV NODE_ENV=production

# Copy the built Nuxt application (the .output directory)
COPY --from=builder /app/.output ./.output

# If your Nuxt server runtime has its own production dependencies from your package.json
# (often not strictly necessary for Nuxt 3 as .output/server is self-contained, but can be safer)
# COPY --from=builder /app/package.json /app/package.json
# COPY --from=builder /app/package-lock.json /app/package-lock.json # or yarn.lock
# RUN npm install --only=production

# Expose the port Nuxt will listen on (default is 3000)
# You can override this with the PORT environment variable
EXPOSE 3000

# Command to start the Nuxt server
# The server entry point is typically .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"] 