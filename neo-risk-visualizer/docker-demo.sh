#!/bin/bash
# Docker Demo Script for Impactor-2025
# This script demonstrates the full Docker setup

echo "🚀 Impactor-2025 Docker Demo"
echo "=============================="
echo ""

# Check Docker requirements
echo "📋 Checking Docker requirements..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi
echo ""

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker compose down 2>/dev/null
echo ""

# Build and start services
echo "🏗️  Building Docker containers..."
docker compose build

echo ""
echo "🚀 Starting Impactor-2025 services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for backend
echo -n "   Backend API"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo " ✅ Ready"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for frontend  
echo -n "   Frontend Web"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo " ✅ Ready"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "🎉 Impactor-2025 is now running!"
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🌐 Access URLs:"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"  
echo "   API Docs:     http://localhost:8000/docs"
echo ""

echo "🧪 Testing API..."
echo "Health Check:"
curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health

echo ""
echo ""
echo "📝 Quick Commands:"
echo "   View logs:    make logs"
echo "   Stop:         make down"  
echo "   Restart:      make restart"
echo "   Clean up:     make clean"
echo ""

echo "🚀 Ready for NASA Space Apps Challenge demo!"
echo "   Open http://localhost:5173 in your browser"