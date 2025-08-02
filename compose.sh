#!/bin/bash

# Helper function to display usage
show_usage() {
  echo "Usage: ./compose.sh [dev|prod|test] [command]"
  echo ""
  echo "Environment files used:"
  echo "  dev  -> .env (development environment)"
  echo "  prod -> .env.prod (production environment)"
  echo "  test -> .env.test (testing environment, auto-created from .env if missing)"
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

# Set docker-compose file and env file based on environment
if [ "$1" == "dev" ]; then
  COMPOSE_FILE="docker-compose.yml"
  ENV_FILE=".env"
  shift
elif [ "$1" == "prod" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  ENV_FILE=".env.prod"
  shift
elif [ "$1" == "test" ]; then
  COMPOSE_FILE="docker-compose.test.yml"
  ENV_FILE=".env.test"
  shift
else
  echo "Error: Invalid environment. Use 'dev', 'prod', or 'test'."
  show_usage
fi

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: Environment file '$ENV_FILE' not found."
  if [ "$ENV_FILE" == ".env.test" ]; then
    echo "Creating .env.test from .env template..."
    if [ -f ".env" ]; then
      cp ".env" ".env.test"
      echo "Created .env.test file for testing environment."
    else
      echo "Error: No .env file found to create .env.test. Please create $ENV_FILE manually."
      exit 1
    fi
  else
    echo "Please create the required environment file: $ENV_FILE"
    if [ -f ".env.example" ]; then
      echo "You can use .env.example as a template:"
      echo "cp .env.example $ENV_FILE"
    fi
    exit 1
  fi
fi

# Check if command is provided
if [ -z "$1" ]; then
  echo "Error: Command not specified!"
  show_usage
fi

# Special case for 'test run' to execute tests
if [ "$COMPOSE_FILE" == "docker-compose.test.yml" ] && [ "$1" == "run" ]; then
  echo "Running tests in container with environment file: $ENV_FILE"
  $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE --env-file $ENV_FILE up --build --abort-on-container-exit --exit-code-from api-test
  exit $?
fi

# Execute docker-compose with the appropriate file, env file, and remaining arguments
echo "Using environment file: $ENV_FILE"
echo "Running: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE --env-file $ENV_FILE $@"
$DOCKER_COMPOSE_CMD -f $COMPOSE_FILE --env-file $ENV_FILE "$@"
