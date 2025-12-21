#!/bin/bash

echo "Starting development environment..."
echo "==================================="

# Check for docker
if ! command -v docker &> /dev/null
then
	echo "docker could not be found. Please install docker."
	exit
fi

# Check for docker-compose
if ! command -v docker compose &> /dev/null
then
	echo "docker compose could not be found. Please install docker-compose."
	exit
fi

# Check docker-compose version
DOCKER_COMPOSE_VERSION=$(docker compose version | awk '{print $3}' | sed 's/,//')
REQUIRED_VERSION="2.22.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$DOCKER_COMPOSE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
	echo "docker-compose version must be $REQUIRED_VERSION or higher. Current version: $DOCKER_COMPOSE_VERSION"
	exit
fi

# Run docker compose
docker compose up dms-dev --watch --build

echo "==============================================="
echo "Shut down development environment."
echo "Use 'docker compose down' to remove containers."
echo "==============================================="
