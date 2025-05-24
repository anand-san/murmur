# Stage 1: Build the application
FROM oven/bun:1.2-slim as builder

WORKDIR /app

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL

# Install dependencies (including devDependencies needed for build)
COPY ./ ./
RUN bun install --frozen-lockfile

# Copy source code and configuration files
# Run database migrations before building
RUN bun run db:migrate

# Build the application
# This will create the 'dist' directory based on your build script
RUN bun run build

# Stage 2: Create the production image
FROM oven/bun:1.2-slim as production

WORKDIR /app

# Copy only necessary artifacts from the builder stage
COPY --from=builder /app/dist ./

# Expose the port the app runs on (default 5555)
# The actual port can be overridden by the PORT environment variable
EXPOSE 5555

# Define the command to run the built application
# We run the compiled JS file directly using bun
CMD ["bun", "run", "index.js"]
