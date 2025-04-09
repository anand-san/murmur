# Stage 1: Build the application
FROM oven/bun:1.2-slim as builder

WORKDIR /usr/src/app

# Install dependencies (including devDependencies needed for build)
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src

# Build the application
# This will create the 'dist' directory based on your build script
RUN bun run build

# Stage 2: Create the production image
FROM oven/bun:1.2-slim as production

WORKDIR /usr/src/app

# Copy only necessary artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on (default 3000)
# The actual port can be overridden by the PORT environment variable
EXPOSE 3000

# Define the command to run the built application
# We run the compiled JS file directly using bun
CMD ["bun", "run", "dist/index.js"]
