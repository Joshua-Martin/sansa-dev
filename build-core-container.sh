#!/bin/bash

# Core Container Build Script
#
# Builds the core workspace container image that serves as the foundation for all workspace sessions.
# The image is pushed to the local Docker registry for use by the workspace service.
#
# Usage:
#   ./build-core-container.sh
#
# Environment Variables:
#   REGISTRY_PORT - Docker registry port (default: 5100)
#   REGISTRY_HOST - Docker registry host (default: localhost)
#   BUILD_CONTEXT - Build context (default: packages/x21-container)
#
# Examples:
#   ./build-core-container.sh   # Build core container image

set -e

# Configuration
REGISTRY_HOST="${REGISTRY_HOST:-localhost}"
REGISTRY_PORT="${REGISTRY_PORT:-5100}"
REGISTRY_URL="${REGISTRY_HOST}:${REGISTRY_PORT}"
BUILD_CONTEXT="${BUILD_CONTEXT:-packages/x21-container}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_DIR="${SCRIPT_DIR}/${BUILD_CONTEXT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        exit 1
    fi
}

# Function to check if registry is accessible
check_registry() {
    log_info "Checking registry connectivity at ${REGISTRY_URL}..."
    
    # Try localhost first, then fall back to internal network name
    local registry_endpoints=("http://${REGISTRY_URL}/v2/" "http://registry:5000/v2/")
    local registry_accessible=false
    
    for endpoint in "${registry_endpoints[@]}"; do
        if curl -f "$endpoint" >/dev/null 2>&1; then
            registry_accessible=true
            log_success "Registry is accessible at $endpoint"
            break
        fi
    done
    
    if ! $registry_accessible; then
        log_error "Docker registry is not accessible at any of: ${registry_endpoints[*]}"
        log_info "Make sure the development environment is running with:"
        log_info "  cd .devcontainer && docker-compose up -d"
        exit 1
    fi
}

# Function to build the core container
build_core_container() {
    if [ ! -d "$CONTAINER_DIR" ]; then
        log_error "Container directory not found: $CONTAINER_DIR"
        return 1
    fi

    if [ ! -f "$CONTAINER_DIR/Dockerfile" ]; then
        log_error "Dockerfile not found in: $CONTAINER_DIR"
        return 1
    fi

    log_info "Building core workspace container"

    # Build TypeScript first
    log_info "Building TypeScript for x21-container package"
    if ! (cd "$CONTAINER_DIR" && npm run build); then
        log_error "Failed to build TypeScript"
        return 1
    fi

    # Build the Docker image
    local image_name="${REGISTRY_URL}/workspace-core"
    local image_tag="latest"
    local full_image_name="${image_name}:${image_tag}"

    log_info "Building Docker image: $full_image_name"

    if docker build \
        --platform linux/amd64 \
        -t "$full_image_name" \
        "$CONTAINER_DIR"; then
        log_success "Built image: $full_image_name"
    else
        log_error "Failed to build image: $full_image_name"
        return 1
    fi

    # Push the image to registry
    log_info "Pushing image to registry: $full_image_name"

    if docker push "$full_image_name"; then
        log_success "Pushed image: $full_image_name"
    else
        log_error "Failed to push image: $full_image_name"
        return 1
    fi

    return 0
}

# Function to validate container directory
validate_container_dir() {
    if [ ! -d "$CONTAINER_DIR" ]; then
        log_error "Container directory not found: $CONTAINER_DIR"
        exit 1
    fi

    if [ ! -f "$CONTAINER_DIR/Dockerfile" ]; then
        log_error "Dockerfile not found in container directory: $CONTAINER_DIR"
        exit 1
    fi

    if [ ! -f "$CONTAINER_DIR/package.json" ]; then
        log_error "package.json not found in container directory: $CONTAINER_DIR"
        exit 1
    fi
}

# Function to display usage
show_usage() {
    echo "Usage: $0"
    echo ""
    echo "Builds the core workspace container image from packages/x21-container/"
    echo ""
    echo "This script builds the unified container image that serves as the foundation"
    echo "for all workspace sessions, replacing the previous template-specific images."
    echo ""
    echo "Examples:"
    echo "  $0   # Build core container image"
}

# Main execution
main() {
    # Check for help first
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi

    log_info "Starting core container build process..."
    log_info "Registry: ${REGISTRY_URL}"
    log_info "Container directory: ${CONTAINER_DIR}"

    # Check prerequisites
    check_docker
    check_registry

    # Validate container directory
    validate_container_dir

    # Build core container
    log_info "Building core workspace container..."

    if build_core_container; then
        log_success "Successfully built core container"
    else
        log_error "Failed to build core container"
        exit 1
    fi

    # Summary
    log_info "Build Summary:"
    log_success "  Core container built and pushed successfully!"

    log_info "Core container is now available in the registry at ${REGISTRY_URL}"
    log_info "Image: ${REGISTRY_URL}/workspace-core:latest"
    log_info "You can verify by running: curl http://${REGISTRY_URL}/v2/_catalog"
}

# Run main function with all arguments
main "$@"
