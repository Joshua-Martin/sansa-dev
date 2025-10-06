#!/bin/bash
set -e

echo "Setting up Sansa AI Router development environment..."

cd /workspace

# Increase Node.js memory limits to prevent bus errors
export NODE_OPTIONS="--max_old_space_size=8192"

# Clean up any potential conflicts from previous installs
echo "Cleaning up potential package management conflicts..."
rm -rf node_modules/.cache || true
rm -rf node_modules/@swc || true

# Check if node_modules already exists and has content
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "Node modules not found or empty, installing dependencies..."
  
  # Install dependencies using pnpm (monorepo setup)
  echo "Installing dependencies with pnpm..."
  pnpm install --frozen-lockfile || {
    echo "pnpm install with lockfile failed, trying regular install..."
    pnpm install
  }
else
  echo "Node modules already installed, skipping installation"
fi

# Make development scripts executable
echo "Setting up development scripts..."
chmod +x .devcontainer/start-dev.sh

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Setup MinIO buckets
echo "Setting up MinIO buckets..."
# Wait for MinIO to be ready with better health check
echo "Waiting for MinIO service to be ready..."
RETRY_COUNT=0
MAX_RETRIES=30
until curl -f http://minio:9000/minio/health/ready 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "MinIO not ready yet (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  sleep 5
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "MinIO failed to become ready after $MAX_RETRIES attempts, skipping bucket creation"
else
  echo "MinIO is ready, creating buckets..."
  
  # Get the actual network name created by Docker Compose
  # Docker Compose creates networks with project prefix, so look for the actual network
  NETWORK_NAME=$(docker network ls --format "{{.Name}}" | grep "sansa-dev" | grep -v "sansa-dev" | head -1)
  if [ -z "$NETWORK_NAME" ]; then
    echo "Warning: Could not find sansa-dev network, trying alternative discovery..."
    NETWORK_NAME=$(docker network ls --format "{{.Name}}" | grep "devcontainer.*sansa-dev" | head -1)
  fi
  if [ -z "$NETWORK_NAME" ]; then
    echo "Trying broader devcontainer network search..."
    NETWORK_NAME=$(docker network ls --format "{{.Name}}" | grep devcontainer | head -1)
  fi

  if [ -z "$NETWORK_NAME" ]; then
    echo "Error: Could not find Docker network. Available networks:"
    docker network ls
    echo "Skipping MinIO bucket creation..."
  else
    echo "Using network: $NETWORK_NAME"
    
    # Configure MinIO client with better error handling
    echo "Configuring MinIO client..."
    echo "DEBUG: Testing MinIO container environment..."
    docker run --rm --network "$NETWORK_NAME" minio/mc:latest --version || echo "Version check failed"
    echo "DEBUG: Attempting to configure MinIO client..."
    docker run --rm --network "$NETWORK_NAME" \
      minio/mc:latest \
      alias set local http://minio:9000 minioadmin minioadmin123 || {
      echo "Failed to configure MinIO client, but continuing..."
    }

    # Verify MinIO connection
    echo "Testing MinIO connection..."
    echo "DEBUG: Running connection test with network: $NETWORK_NAME"
    docker run --rm --network "$NETWORK_NAME" \
      --entrypoint=/bin/sh \
      minio/mc:latest \
      -c "mc alias set local http://minio:9000 minioadmin minioadmin123 && mc admin info local" || {
      echo "MinIO connection test failed, but continuing..."
    }

    # Create buckets with individual error handling
    echo "Creating projects bucket..."
    echo "DEBUG: Creating projects bucket with network: $NETWORK_NAME"
    docker run --rm --network "$NETWORK_NAME" \
      --entrypoint=/bin/sh \
      minio/mc:latest \
      -c "mc alias set local http://minio:9000 minioadmin minioadmin123 && mc mb local/projects --ignore-existing" || {
      echo "Failed to create projects bucket, but continuing..."
    }

    echo "Creating exports bucket..."
    echo "DEBUG: Creating exports bucket with network: $NETWORK_NAME"
    docker run --rm --network "$NETWORK_NAME" \
      --entrypoint=/bin/sh \
      minio/mc:latest \
      -c "mc alias set local http://minio:9000 minioadmin minioadmin123 && mc mb local/exports --ignore-existing" || {
      echo "Failed to create exports bucket, but continuing..."
    }
  fi
fi

echo "MinIO setup complete!"

# Test registry connectivity
echo "Testing container registry..."
until curl -f http://registry:5000/v2/ 2>/dev/null; do
  echo "Waiting for container registry to be ready..."
  sleep 5
done
echo "Container registry is ready!"

echo "Setup complete!"
