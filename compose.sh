#!/bin/bash

# Helper function to display usage
show_usage() {
  echo "Usage: ./compose.sh [dev|prod|test] [command]"
  echo ""
  echo "Examples:"
  echo "  ./compose.sh dev up     # Start development environment"
  echo "  ./compose.sh prod up    # Start production environment"
  echo "  ./compose.sh test up    # Start test environment"
  echo "  ./compose.sh test run   # Run tests in container"
  echo "  ./compose.sh dev down   # Stop development environment"
  echo "  ./compose.sh prod down  # Stop production environment"
  echo "  ./compose.sh test down  # Stop test environment"
  echo ""
  echo "Available commands are standard docker compose commands:"
  echo "  up, down, build, logs, ps, run, etc."
  exit 1
}

# Function to detect Docker Compose command
detect_docker_compose_cmd() {
  # Check if docker compose V2 is available
  if docker compose version &>/dev/null; then
    echo "docker compose"
  # Check if docker-compose V1 is available
  elif docker-compose --version &>/dev/null; then
    echo "docker-compose"
  else
    echo "Error: Neither 'docker compose' (V2) nor 'docker-compose' (V1) was found."
    echo "Please install Docker Compose and try again."
    exit 1
  fi
}

# Store the appropriate docker compose command
DOCKER_COMPOSE_CMD=$(detect_docker_compose_cmd)

# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Error: Environment (dev or prod) not specified!"
  show_usage
fi

# Set docker-compose file based on environment
if [ "$1" == "dev" ]; then
  COMPOSE_FILE="docker-compose.yml"
  shift
elif [ "$1" == "prod" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  shift
elif [ "$1" == "test" ]; then
  COMPOSE_FILE="docker-compose.test.yml"
  shift
else
  echo "Error: Invalid environment. Use 'dev', 'prod', or 'test'."
  show_usage
fi

# Check if command is provided
if [ -z "$1" ]; then
  echo "Error: Command not specified!"
  show_usage
fi

# Special case for 'test run' to execute tests
if [ "$COMPOSE_FILE" == "docker-compose.test.yml" ] && [ "$1" == "run" ]; then
  echo "Running tests in container..."
  $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up --build --abort-on-container-exit --exit-code-from api-test
  exit $?
fi

# Execute docker-compose with the appropriate file and remaining arguments
echo "Running: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE $@"
$DOCKER_COMPOSE_CMD -f $COMPOSE_FILE "$@"
