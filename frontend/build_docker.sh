#!/bin/bash
# This script builds the Docker image for the frontend and extracts the built files to the ./dist directory.

set -e 

if ! docker info > /dev/null 2>&1; then
    echo "Failed to invoke Docker daemon. Please ensure Docker is running."
    echo "You need to be in the docker group or have sudo privileges to run this script."
    exit 1
fi

# Save the original symlink state
if [ -L public/docs ]; then
    mv public/docs public/docs_symlink
    mkdir -p public/docs
    cp -rL public/docs_symlink/* public/docs
fi

cleanup() {
    # restore symlink
    rm -rf public/docs
    mv public/docs_symlink public/docs
    echo "Cleanup complete."
}

# Register the cleanup function to run on script exit
trap cleanup EXIT

docker build -t woc-frontend:latest .
docker run --rm -v "$(pwd)/dist:/app/dist" woc-frontend:latest