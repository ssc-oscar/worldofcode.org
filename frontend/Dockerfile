# Use the official Node.js image as a parent image
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the package.json and package-lock.json files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY / .

# Build the application
RUN pnpm build

# Copy the artifacts to a new image
FROM alpine:latest AS artifacts

VOLUME [ "/dist" ]

COPY --from=builder /app/dist /app/dist

CMD cp -r /app/dist/* /dist