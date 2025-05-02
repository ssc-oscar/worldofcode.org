#!/bin/bash
# This script builds the Docker image for the frontend and extracts the built files to the ./dist directory.

set -e 

if ! docker info > /dev/null 2>&1; then
    echo "You need to be in the docker group or have sudo privileges to run this script."
    echo "Please run 'sudo usermod -aG docker $USER' and log out and back in."
    exit 1
fi

docker build -t woc-frontend:latest .
docker run --rm -v "$(pwd)/dist:/app/dist" woc-frontend:latest