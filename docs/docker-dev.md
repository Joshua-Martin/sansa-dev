# Docker Dev Container Overview

## Current State Analysis

The existing Docker setup provides basic Node.js tooling with PostgreSQL and Redis, but requires specific modifications to support the preview container spawning architecture that forms the core of this application.

## Required File Changes

### 1. Docker Compose Service Additions

**Add MinIO for Object Storage Simulation**

```yaml
# Add to docker-compose.yml services section
minio:
  image: minio/minio:latest
  platform: linux/arm64/v8
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  ports:
    - '9000:9000'
    - '9001:9001'
  volumes:
    - minio_data:/data
  networks:
    - sansa-dev

# Add to volumes section
minio_data:
```

**Add Container Registry for Preview Templates**

```yaml
# Add to docker-compose.yml services section
registry:
  image: registry:2.8
  platform: linux/arm64/v8
  ports:
    - '5000:5000'
  volumes:
    - registry_data:/var/lib/registry
  networks:
    - sansa-dev

# Add to volumes section
registry_data:
```

### 2. Main App Container Modifications

**Enable Docker-in-Docker for Backend**

```yaml
# Update app service in docker-compose.yml
app:
  privileged: true
  platform: linux/arm64/v8
  build:
    context: .
    dockerfile: Dockerfile
    platforms:
      - linux/arm64/v8
  mem_limit: 8g
  shm_size: 4g
  volumes:
    - ..:/workspace:cached
    - /var/run/docker.sock:/var/run/docker.sock # Add this line
    - pnpm_root_node_modules:/workspace/node_modules
    - pnpm_nest_node_modules:/workspace/packages/nest/node_modules
    - pnpm_react_ui_node_modules:/workspace/packages/react-ui/node_modules
    - pnpm_shared_node_modules:/workspace/packages/shared/node_modules
  environment:
    - NODE_OPTIONS=--max_old_space_size=8192
    - DOCKER_HOST=unix:///var/run/docker.sock # Add this line
    - MINIO_ENDPOINT=http://minio:9000 # Add this line
    - REGISTRY_ENDPOINT=http://registry:5000 # Add this line
  networks:
    - sansa-dev
  ports:
    - '3000:3000'
    - '4200:4200'
    - '8000-8100:8000-8100' # Port range for preview containers
  depends_on:
    - db
    - redis
    - minio
    - registry
  command: sleep infinity
```

### 3. Dockerfile Modifications

**Add Docker CLI and Container Management Tools**

```dockerfile
# Add after existing RUN commands in Dockerfile
RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    && rm -rf /var/lib/apt/lists/*

# Add container management utilities
RUN npm i -g pm2@5.3.0
RUN npm i -g concurrently@8.2.0

# Create preview container workspace template
RUN mkdir -p /opt/preview-template
COPY preview-template/ /opt/preview-template/
```

**Create Preview Container Template Directory Structure**

```bash
# New directory structure to create
.devcontainer/
├── preview-template/
│   ├── Dockerfile.preview
│   ├── package.json
│   ├── astro.config.mjs
│   └── entrypoint.sh
```

### 4. DevContainer Configuration Updates

**Update devcontainer.json**

```json
{
  "name": "Demo Agent Dev",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "cipchk.cssrem",
        "huizhou.githd",
        "ms-vscode.vscode-docker", // Add Docker extension
        "ms-azuretools.vscode-docker", // Add Docker tools
        "redhat.vscode-yaml" // Add YAML support
      ]
    }
  },
  "forwardPorts": [3000, 4200, 5432, 9000, 9001, 5000], // Add MinIO and registry ports
  "postAttachCommand": "/bin/bash .devcontainer/setup.sh",
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb"
  },
  "mounts": [
    "source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind" // Add Docker socket mount
  ],
  "remoteUser": "root"
}
```

### 5. Preview Container Template Files

**Create Dockerfile.preview**

```dockerfile
# New file: .devcontainer/preview-template/Dockerfile.preview
FROM node:20-alpine
WORKDIR /workspace
COPY package.json .
RUN npm install
COPY . .
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Create package.json for Preview Template**

```json
// New file: .devcontainer/preview-template/package.json
{
  "name": "preview-workspace",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build"
  },
  "dependencies": {
    "astro": "^3.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

**Create astro.config.mjs for Preview Template**

```javascript
// New file: .devcontainer/preview-template/astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
```

### 6. Setup Script Enhancements

**Update .devcontainer/setup.sh**

```bash
#!/bin/bash

# Existing setup commands
echo "Installing dependencies..."
cd /workspace
pnpm install

# Add new setup steps
echo "Setting up MinIO buckets..."
# Wait for MinIO to be ready
sleep 10
curl -X PUT http://minio:9000/minio/health/ready || echo "MinIO not ready yet"

# Create default buckets using MinIO client
docker run --rm --network sansa-dev_sansa-dev \
  -v /tmp:/tmp \
  minio/mc:latest \
  config host add local http://minio:9000 minioadmin minioadmin123

docker run --rm --network sansa-dev_sansa-dev \
  minio/mc:latest \
  mb local/projects

docker run --rm --network sansa-dev_sansa-dev \
  minio/mc:latest \
  mb local/exports

echo "Building preview container template..."
cd /opt/preview-template
docker build -f Dockerfile.preview -t localhost:5000/preview-template:latest .
docker push localhost:5000/preview-template:latest

echo "Setup complete!"
```

### 7. Network Configuration

**Add Preview Network Creation Script**

```bash
# New file: .devcontainer/create-preview-network.sh
#!/bin/bash
NETWORK_NAME="preview-$1"
docker network create --driver bridge "$NETWORK_NAME" 2>/dev/null || true
echo "$NETWORK_NAME"
```

### 8. Resource Monitoring Setup

**Add Container Resource Monitoring**

```yaml
# Add to docker-compose.yml services section
cadvisor:
  image: gcr.io/cadvisor/cadvisor:v0.47.0
  platform: linux/arm64/v8
  ports:
    - '8080:8080'
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
    - /dev/disk/:/dev/disk:ro
  networks:
    - sansa-dev
  privileged: true
```

## Implementation Steps

### Phase 1: Basic Infrastructure

1. Update docker-compose.yml with MinIO and registry services
2. Modify Dockerfile to include Docker CLI tools
3. Update devcontainer.json with new ports and extensions
4. Create preview-template directory structure

### Phase 2: Preview Container Support

1. Build preview container Dockerfile and templates
2. Update setup.sh with MinIO initialization
3. Test container spawning from backend service
4. Implement network creation scripts

### Phase 3: Monitoring and Optimization

1. Add cAdvisor for container monitoring
2. Implement resource cleanup scripts
3. Test preview container lifecycle management
4. Optimize container startup performance

## Testing the Implementation

### Validation Commands

```bash
# Test Docker-in-Docker capability
docker ps

# Test MinIO access
curl http://localhost:9000/minio/health/ready

# Test registry
curl http://localhost:5000/v2/_catalog

# Test preview container spawning
docker run -d --network sansa-dev_sansa-dev \
  --name test-preview \
  -p 8001:4321 \
  localhost:5000/preview-template:latest

# Cleanup test container
docker stop test-preview && docker rm test-preview
```

### Expected Outcomes

- Backend can spawn preview containers using Docker API
- MinIO provides S3-compatible storage for project files
- Registry serves as local container image storage
- cAdvisor provides resource monitoring dashboard
- Preview containers can communicate with main services

## Resource Requirements

### Minimum System Requirements

- 16GB RAM (8GB for main services + 8GB for preview containers)
- 4 CPU cores minimum
- 50GB free disk space for container images and volumes
- Docker Desktop with at least 12GB memory allocation

### Port Allocations

- 3000: NestJS Backend
- 4200: Next.js Frontend
- 5432: PostgreSQL
- 6379: Redis
- 9000: MinIO API
- 9001: MinIO Console
- 5000: Container Registry
- 8080: cAdvisor Monitoring
- 8000-8100: Preview Container Range
