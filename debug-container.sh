#!/bin/bash

# Debug Container Startup Script
# This script simulates exactly what the NestJS server does when creating sessions
# Updated to work with current codebase and properly test tool server endpoints

set -e

# Configuration - matches what server uses
CONTAINER_NAME="debug-workspace-container"
IMAGE_NAME="localhost:5100/workspace-core:arm64"
CONTAINER_TOOL_PORT="4321"  # Port inside container where tool server runs
HOST_TOOL_PORT="9036"       # Port on host that maps to container tool port (matches server)
DEV_SERVER_PORT="8053"      # Dev server port (matches server allocation)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Debug Container Startup Script ===${NC}"
echo -e "${BLUE}Testing current tool server implementation...${NC}"
echo -e "${BLUE}Container Tool Port: $CONTAINER_TOOL_PORT (inside container)${NC}"
echo -e "${BLUE}Host Tool Port: $HOST_TOOL_PORT (mapped to host)${NC}"
echo -e "${BLUE}Dev Server Port: $DEV_SERVER_PORT (for testing)${NC}"
echo ""

# Clean up any existing debug container
echo -e "${YELLOW}Cleaning up existing debug container...${NC}"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Start the container EXACTLY like the server does
echo -e "${YELLOW}Starting debug container (simulating server)...${NC}"
CONTAINER_ID=$(docker run -d \
  --name "$CONTAINER_NAME" \
  --network sansa-dev_devcontainer_sansa-dev \
  -p "$HOST_TOOL_PORT:$CONTAINER_TOOL_PORT" \
  -p "$DEV_SERVER_PORT:8000" \
  --memory 512m \
  --cpus 0.5 \
  -e NODE_ENV=development \
  "$IMAGE_NAME")

echo -e "${GREEN}Container started with ID: $CONTAINER_ID${NC}"
echo -e "${GREEN}Container name: $CONTAINER_NAME${NC}"
echo ""

# Wait for container to be ready (like server does)
echo -e "${YELLOW}Waiting for container to be ready (like server initialization)...${NC}"
for i in {1..20}; do
    if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
        echo -e "${GREEN}Container is running${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting... ($i/20)${NC}"
    sleep 1
done

# ============================================================================
# SIMULATE EXACT SERVER BEHAVIOR - STEP BY STEP
# ============================================================================

echo -e "${BLUE}=== Step 1: Container Status Check ===${NC}"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo -e "${BLUE}=== Step 2: Wait for Tool Server to Start ===${NC}"
echo -e "${YELLOW}Waiting for container tool server to be ready...${NC}"
for i in {1..30}; do
    if docker exec "$CONTAINER_NAME" curl -s --max-time 2 "http://localhost:$CONTAINER_TOOL_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Tool server health endpoint is responding!${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for tool server... ($i/30)${NC}"
    sleep 2
done

# Verify tool server is actually ready
if ! docker exec "$CONTAINER_NAME" curl -s --max-time 2 "http://localhost:$CONTAINER_TOOL_PORT/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Tool server failed to start after 60 seconds${NC}"
    echo -e "${YELLOW}Checking container logs:${NC}"
    docker logs "$CONTAINER_NAME" | tail -20
    exit 1
fi

# ============================================================================
# STEP 3: TEST TOOL SERVER ENDPOINTS
# ============================================================================

echo -e "${BLUE}=== Step 3: Test Tool Server Endpoints ===${NC}"
echo -e "${YELLOW}Testing all available tool server endpoints...${NC}"

# Test basic health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(docker exec "$CONTAINER_NAME" curl -s "http://localhost:$CONTAINER_TOOL_PORT/health")
echo -e "${GREEN}Health Response: $HEALTH_RESPONSE${NC}"
echo ""

# Test search endpoint
echo -e "${YELLOW}Testing search endpoint...${NC}"
SEARCH_REQUEST='{"pattern":"*.ts","type":"glob","maxResults":5}'
SEARCH_RESPONSE=$(docker exec "$CONTAINER_NAME" curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$SEARCH_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/tools/search")
echo -e "${GREEN}Search Response: $SEARCH_RESPONSE${NC}"
echo ""

# Test read endpoint (try to read package.json)
echo -e "${YELLOW}Testing read endpoint...${NC}"
READ_REQUEST='{"path":"package.json"}'
READ_RESPONSE=$(docker exec "$CONTAINER_NAME" curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$READ_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/tools/read")
echo -e "${GREEN}Read Response Length: ${#READ_RESPONSE} characters${NC}"
echo ""

# Test port allocation endpoint
echo -e "${YELLOW}Testing port allocation endpoint...${NC}"
PORT_REQUEST='{"preferredPort":8080}'
PORT_RESPONSE=$(docker exec "$CONTAINER_NAME" curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PORT_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/api/ports/allocate")
echo -e "${GREEN}Port Allocation Response: $PORT_RESPONSE${NC}"
echo ""

# ============================================================================
# STEP 4: TEST EXTERNAL ACCESSIBILITY
# ============================================================================

echo -e "${BLUE}=== Step 4: Test External Accessibility ===${NC}"
echo -e "${YELLOW}Testing if tool server is accessible from host...${NC}"

# Test health endpoint from host (this is what the Nest server does)
echo -e "${YELLOW}Testing health endpoint from host (port $HOST_TOOL_PORT)...${NC}"
HOST_HEALTH_RESPONSE=$(curl -s --max-time 5 "http://localhost:$HOST_TOOL_PORT/health" 2>/dev/null || echo "Connection failed")
if [[ "$HOST_HEALTH_RESPONSE" == "Connection failed" ]]; then
    echo -e "${RED}✗ Host cannot connect to tool server on port $HOST_TOOL_PORT${NC}"
    echo -e "${YELLOW}This matches the original issue - tool server not accessible from host${NC}"
else
    echo -e "${GREEN}✓ Host can connect to tool server on port $HOST_TOOL_PORT${NC}"
    echo -e "${GREEN}Health Response from host: $HOST_HEALTH_RESPONSE${NC}"
fi
echo ""

# ============================================================================
# STEP 5: DIAGNOSIS SUMMARY
# ============================================================================

echo -e "${BLUE}=== Step 5: Diagnosis Summary ===${NC}"
echo -e "${YELLOW}Analyzing the connectivity issue...${NC}"

if [[ "$HOST_HEALTH_RESPONSE" == "Connection failed" ]]; then
    echo -e "${RED}🔴 DIAGNOSIS: Tool server is running inside container but not accessible from host${NC}"
    echo -e "${YELLOW}Possible causes:${NC}"
    echo -e "  1. Port mapping not working correctly"
    echo -e "  2. Tool server binding to wrong interface (127.0.0.1 vs 0.0.0.0)"
    echo -e "  3. Firewall/networking issues"
    echo -e "  4. Container networking configuration"
else
    echo -e "${GREEN}🟢 Tool server is accessible from host - issue may be elsewhere${NC}"
fi

echo -e "${YELLOW}Container networking info:${NC}"
docker inspect "$CONTAINER_NAME" --format='{{.NetworkSettings.Ports}}' | jq .

echo ""

# ============================================================================
# FINAL STATUS AND CLEANUP
# ============================================================================

echo -e "${BLUE}=== Final Status ===${NC}"
echo -e "${GREEN}Container ID: $CONTAINER_ID${NC}"
echo -e "${GREEN}Container Name: $CONTAINER_NAME${NC}"
echo -e "${GREEN}Tool Server URL: http://localhost:$HOST_TOOL_PORT${NC}"
echo -e "${GREEN}Dev Server URL: http://localhost:$DEV_SERVER_PORT${NC}"
echo ""
echo -e "${YELLOW}Debug Commands:${NC}"
echo -e "  docker logs -f $CONTAINER_NAME              # View container logs"
echo -e "  docker exec -it $CONTAINER_NAME /bin/bash   # Access container shell"
echo -e "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME  # Cleanup"
echo ""
echo -e "${BLUE}=== Debug Complete ===${NC}"
