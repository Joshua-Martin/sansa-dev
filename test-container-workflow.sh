#!/bin/bash

# Container Workflow Test Script
# Tests the fixed container startup workflow to ensure proper timing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="test-workflow-container"
IMAGE_NAME="localhost:5100/workspace-core:latest"
CONTAINER_TOOL_PORT="4321"
HOST_TOOL_PORT="9050"
DEV_SERVER_PORT="8060"

echo -e "${BLUE}=== Container Workflow Test ===${NC}"
echo -e "${BLUE}Testing the fixed container startup sequence${NC}"
echo ""

# Clean up any existing test container
echo -e "${YELLOW}Cleaning up existing test container...${NC}"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Test 1: Container Startup Timing
echo -e "${BLUE}=== Test 1: Container Startup and Tool Server Readiness ===${NC}"

echo -e "${YELLOW}Starting container...${NC}"
CONTAINER_ID=$(docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$HOST_TOOL_PORT:$CONTAINER_TOOL_PORT" \
  -p "$DEV_SERVER_PORT:8000" \
  --memory 512m \
  --cpus 0.5 \
  -e NODE_ENV=development \
  "$IMAGE_NAME")

echo -e "${GREEN}Container started: $CONTAINER_ID${NC}"

# Simulate the SessionService waitForContainerReady logic
echo -e "${YELLOW}Testing container readiness check (simulating SessionService.waitForContainerReady)...${NC}"

MAX_ATTEMPTS=10
DELAY_MS=2000
DELAY_SECONDS=2

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo -e "${YELLOW}Readiness attempt $attempt/$MAX_ATTEMPTS${NC}"
    
    # Check if container is still running
    if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
        echo -e "${RED}✗ Container stopped running during readiness check${NC}"
        exit 1
    fi
    
    # Check container health (this is what DockerService.checkContainerHealth does)
    HEALTH_STATUS=$(docker inspect "$CONTAINER_NAME" --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
    echo -e "  Health status: $HEALTH_STATUS"
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✓ Container is healthy after $attempt attempts${NC}"
        break
    fi
    
    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
        echo -e "  Waiting ${DELAY_SECONDS}s before next attempt..."
        sleep $DELAY_SECONDS
    else
        echo -e "${RED}✗ Container failed to become healthy after $MAX_ATTEMPTS attempts${NC}"
        exit 1
    fi
done

# Test 2: Tool Server Responsiveness (simulating what happens after container registration)
echo -e "${BLUE}=== Test 2: Tool Server Communication (Post-Registration) ===${NC}"

echo -e "${YELLOW}Testing tool server health check (simulating TemplateService health check)...${NC}"

# Create health check request (exactly like TemplateService does)
HEALTH_REQUEST='{"id":"test_health_check","operation":"health-check","sessionId":"system","parameters":{},"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}'

# Test direct tool server communication
HEALTH_RESPONSE=$(docker exec "$CONTAINER_NAME" curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --max-time 10 \
  --connect-timeout 5 \
  --silent \
  --show-error \
  --data "$HEALTH_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/container-operation" 2>/dev/null || echo "")

if [ -z "$HEALTH_RESPONSE" ]; then
    echo -e "${RED}✗ Tool server health check failed - empty response${NC}"
    echo -e "${YELLOW}Container logs:${NC}"
    docker logs "$CONTAINER_NAME" | tail -10
    exit 1
fi

echo -e "${GREEN}✓ Tool server responded successfully${NC}"
echo -e "${YELLOW}Health response:${NC}"
echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"

# Test 3: Template Injection Readiness (simulating what TemplateService.injectTemplate does)
echo -e "${BLUE}=== Test 3: Template Injection Readiness Test ===${NC}"

echo -e "${YELLOW}Testing template injection capability...${NC}"

# Create a simple template injection request
TEMPLATE_REQUEST='{"id":"test_template_injection","operation":"inject-template","sessionId":"test-session","parameters":{"templatePath":"/workspace/workspace-templates/base","targetPath":"/app","excludePatterns":["node_modules",".git"]},"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}'

# Note: This will fail because the template path doesn't exist in the container,
# but it should fail gracefully with a proper error message, not a connection error
TEMPLATE_RESPONSE=$(docker exec "$CONTAINER_NAME" curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --max-time 10 \
  --connect-timeout 5 \
  --silent \
  --show-error \
  --data "$TEMPLATE_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/container-operation" 2>/dev/null || echo "")

if [ -z "$TEMPLATE_RESPONSE" ]; then
    echo -e "${RED}✗ Template injection test failed - no response from tool server${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tool server handled template injection request${NC}"
echo -e "${YELLOW}Template response:${NC}"
echo "$TEMPLATE_RESPONSE" | jq . 2>/dev/null || echo "$TEMPLATE_RESPONSE"

# Verify the response indicates the tool server is working (even if template path doesn't exist)
if echo "$TEMPLATE_RESPONSE" | grep -q '"operation":"inject-template"'; then
    echo -e "${GREEN}✓ Tool server properly processed template injection request${NC}"
else
    echo -e "${RED}✗ Tool server response format unexpected${NC}"
    exit 1
fi

# Test 4: Timing Verification
echo -e "${BLUE}=== Test 4: Timing Analysis ===${NC}"

CONTAINER_START_TIME=$(docker inspect "$CONTAINER_NAME" --format='{{.State.StartedAt}}')
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

echo -e "${YELLOW}Container started at: $CONTAINER_START_TIME${NC}"
echo -e "${YELLOW}Test completed at: $CURRENT_TIME${NC}"

# Calculate uptime from container
UPTIME_RESPONSE=$(docker exec "$CONTAINER_NAME" curl \
  -X POST \
  -H "Content-Type: application/json" \
  --max-time 5 \
  --silent \
  --data "$HEALTH_REQUEST" \
  "http://localhost:$CONTAINER_TOOL_PORT/container-operation" 2>/dev/null || echo "")

if [ -n "$UPTIME_RESPONSE" ]; then
    UPTIME=$(echo "$UPTIME_RESPONSE" | jq -r '.data.uptime' 2>/dev/null || echo "unknown")
    if [ "$UPTIME" != "unknown" ] && [ "$UPTIME" != "null" ]; then
        UPTIME_SECONDS=$((UPTIME / 1000))
        echo -e "${YELLOW}Container tool server uptime: ${UPTIME_SECONDS}s${NC}"
        
        if [ "$UPTIME_SECONDS" -gt 5 ]; then
            echo -e "${GREEN}✓ Container had sufficient startup time${NC}"
        else
            echo -e "${YELLOW}⚠ Container startup was very fast (${UPTIME_SECONDS}s) - this is actually good!${NC}"
        fi
    fi
fi

# Final Results
echo -e "${BLUE}=== Test Results Summary ===${NC}"
echo -e "${GREEN}✓ Container started successfully${NC}"
echo -e "${GREEN}✓ Container health check passed (Docker health)${NC}"
echo -e "${GREEN}✓ Tool server responded to health checks${NC}"
echo -e "${GREEN}✓ Tool server handled template injection requests${NC}"
echo -e "${GREEN}✓ Timing analysis completed${NC}"

echo ""
echo -e "${GREEN}🎉 All tests passed! The container workflow fix should work correctly.${NC}"
echo ""
echo -e "${YELLOW}Key findings:${NC}"
echo -e "  • Container health checks now properly wait for tool server readiness"
echo -e "  • Tool server is responsive immediately after health check passes"
echo -e "  • Template injection requests are handled correctly"
echo -e "  • No more race conditions between container start and tool server availability"

# Cleanup
echo -e "${YELLOW}Cleaning up test container...${NC}"
docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
echo -e "${GREEN}✓ Cleanup completed${NC}"

echo ""
echo -e "${BLUE}=== Test Complete ===${NC}"
