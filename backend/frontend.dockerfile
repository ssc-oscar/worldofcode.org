# Use the official Node.js image as a parent image
FROM node:22-alpine as builder

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

# Env vars
ARG VITE_TURNSTILE_SITE_ID
ENV VITE_TURNSTILE_SITE_ID=$VITE_TURNSTILE_SITE_ID
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

# Build the application
RUN pnpm build

# Use the official Nginx image as a parent image
# FROM fholzer/nginx-brotli
FROM nginx:alpine

# Copy the build output to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80
