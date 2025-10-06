#!/bin/bash

# Development startup script for Sansa AI Router
# This script provides instructions for starting the dual backend/frontend architecture
# - TB Backend (port 3001) + TB Frontend (port 4201)
# - S Backend (port 3000) + S Frontend (port 4200)

set -e

echo "🚀 Starting Sansa AI Router development environment..."

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports for dual backend/frontend architecture
echo "📋 Checking ports..."
check_port 3000 || echo "   S-Nest Backend port 3000 is in use"
check_port 3001 || echo "   TB-Nest Backend port 3001 is in use"
check_port 4200 || echo "   S-Frontend port 4200 is in use"
check_port 4201 || echo "   TB-Frontend port 4201 is in use"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Note: Auto-start removed - use manual commands to start services:
echo "🏗️  Sansa dual-backend services ready to start manually:"
echo ""
echo "   S Backend (port 3000):  cd /workspace/packages/s-nest && pnpm run start:dev"
echo "   S Frontend (port 4200): cd /workspace/packages/s-frontend && pnpm run dev"
echo ""
echo "   TB Backend (port 3001):  cd /workspace/packages/tb-nest && PORT=3001 pnpm run start:dev"
echo "   TB Frontend (port 4201): cd /workspace/packages/tb-frontend && pnpm run dev -- -p 4201"
echo ""

echo "✅ Sansa development environment ready!"
echo ""
echo "   📱 S-Frontend will be available at: http://localhost:4200 (when started)"
echo "   🔧 S-Backend will be available at: http://localhost:3000 (when started)"
echo "   📚 S-API Docs will be available at: http://localhost:3000/docs (when backend started)"
echo ""
echo "   📱 TB-Frontend will be available at: http://localhost:4201 (when started)"
echo "   🔧 TB-Backend will be available at: http://localhost:3001 (when started)"
echo "   📚 TB-API Docs will be available at: http://localhost:3001/docs (when backend started)"
echo ""
echo "   🗄️  TB PostgreSQL: localhost:5432 (database: tb-sansa-dev)"
echo "   🗄️  S PostgreSQL: localhost:5433 (database: s-sansa-dev)"
echo "   📦 Redis: localhost:6379"
echo "   🪣 MinIO: localhost:9100 (console: localhost:9101)"
echo ""
echo "💡 Use the commands above to start services as needed"

