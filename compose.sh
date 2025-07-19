#!/bin/bash

# Helper function to display usage
show_usage() {
  echo "Usage: ./compose.sh [dev|prod] [command]"
  echo ""
  echo "Examples:"
  echo "  ./compose.sh dev up     # Start development environment"
  echo "  ./compose.sh prod up    # Start production environment"
  echo "  ./compose.sh dev down   # Stop development environment"
  echo "  ./compose.sh prod down  # Stop production environment"
  echo ""
  echo "Available commands are standard docker-compose commands:"
  echo "  up, down, build, logs, ps, etc."
  exit 1
}

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
else
  echo "Error: Invalid environment. Use 'dev' or 'prod'."
  show_usage
fi

# Check if command is provided
if [ -z "$1" ]; then
  echo "Error: Command not specified!"
  show_usage
fi

# Execute docker-compose with the appropriate file and remaining arguments
echo "Running: docker-compose -f $COMPOSE_FILE $@"
docker-compose -f $COMPOSE_FILE "$@"
