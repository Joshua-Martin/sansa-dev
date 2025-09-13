#!/bin/bash

# Development startup script for Demo Agent
# This script starts both the NestJS backend and Vite frontend in the dev container

set -e

echo "🚀 Starting Demo Agent development environment..."

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "📋 Checking ports..."
check_port 3000 || echo "   Backend port 3000 is in use"
check_port 4200 || echo "   Frontend port 4200 is in use"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Note: Auto-start removed - use manual commands to start services:
# Backend: cd /workspace/packages/nest && pnpm run start:dev
# Frontend: cd /workspace/packages/frontend && pnpm run dev
echo "🏗️  Services ready to start manually:"
echo "   Backend: cd /workspace/packages/nest && pnpm run start:dev"
echo "   Frontend: cd /workspace/packages/frontend && pnpm run dev"

echo "✅ Development environment ready!"
echo "   📱 Frontend will be available at: http://localhost:4200 (when started)"
echo "   🔧 Backend will be available at: http://localhost:3000 (when started)"
echo "   📚 API Docs will be available at: http://localhost:3000/docs (when backend started)"
echo ""
echo "💡 Use the commands above to start services as needed"

