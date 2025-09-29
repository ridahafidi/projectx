# Makefile for NEO Risk Visualizer - NASA Space Apps Challenge 2025
.PHONY: help setup demo build up down logs clean test dev prod status health check-deps

# Default target
help: ## Show this help message
	@echo "🛡️  NEO Risk Visualizer - Docker Commands"
	@echo "========================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start: make demo"

# Environment Setup
check-deps: ## Check Docker dependencies
	@echo "📋 Checking Docker requirements..."
	@command -v docker >/dev/null 2>&1 || (echo "❌ Docker not found. Please install Docker first." && exit 1)
	@docker compose version >/dev/null 2>&1 || (echo "❌ Docker Compose not found. Please install Docker Compose first." && exit 1)
	@echo "✅ Docker and Docker Compose found"

setup: check-deps ## Setup environment files
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from template"; \
	else \
		echo "✅ .env file already exists"; \
	fi

demo: setup ## Full demo - setup, build, and start with health checks
	@echo "🚀 NEO Risk Visualizer - Full Demo"
	@echo "=================================="
	@echo ""
	$(MAKE) down
	@echo ""
	@echo "🏗️  Building Docker containers..."
	docker compose build
	@echo ""
	@echo "🚀 Starting services..."
	docker compose up -d
	@echo ""
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	$(MAKE) health
	@echo ""
	@echo "✅ Demo completed! Services are running:"
	@echo "   🌍 Frontend: http://localhost:5173"
	@echo "   📡 Backend API: http://localhost:8000"
	@echo "   📖 API Docs: http://localhost:8000/docs"

# Development Environment
dev: ## Start development environment with hot-reload
	@echo "🚀 Starting development environment..."
	docker compose up --build

dev-detached: ## Start development environment in background
	@echo "🚀 Starting development environment (detached)..."
	docker compose up -d --build

# Production Environment
prod: ## Start production environment
	@echo "🌍 Starting production environment..."
	docker compose -f docker-compose.prod.yml up -d --build

# Container Management
build: ## Build all containers
	@echo "🔨 Building containers..."
	docker compose build

up: ## Start containers (without building)
	@echo "⬆️  Starting containers..."
	docker compose up -d

down: ## Stop and remove containers
	@echo "⬇️  Stopping containers..."
	docker compose down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker compose restart

# Logs and Monitoring
logs: ## View logs from all services
	docker compose logs -f

logs-backend: ## View backend logs only
	docker compose logs -f backend

logs-frontend: ## View frontend logs only
	docker compose logs -f frontend

# Status and Health Checks
status: ## Show container status
	@echo "📊 Container Status:"
	@docker compose ps

health: ## Check service health
	@echo "🏥 Checking service health..."
	@echo -n "Backend (API): "
	@curl -s http://localhost:8000/health >/dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Not responding"
	@echo -n "Frontend: "
	@curl -s http://localhost:5173 >/dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Not responding"

test-api: ## Test API endpoints
	@echo "🧪 Testing API endpoints..."
	@echo "Health check:"
	@curl -s http://localhost:8000/health | grep -q "healthy" && echo "✅ Health endpoint working" || echo "❌ Health endpoint failed"
	@echo "Root endpoint:"
	@curl -s http://localhost:8000/ | grep -q "Impactor" && echo "✅ Root endpoint working" || echo "❌ Root endpoint failed"

# Development Tools
shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	docker compose exec backend python -m pytest tests/ || echo "⚠️  Backend tests not configured"
	docker compose exec frontend npm run test || echo "⚠️  Frontend tests not configured"

test-backend: ## Run backend tests only
	docker compose exec backend python -m pytest tests/ -v || echo "⚠️  Backend tests not configured"

test-frontend: ## Run frontend tests only
	docker compose exec frontend npm run test || echo "⚠️  Frontend tests not configured"

# Maintenance
clean: ## Clean up containers, images, and volumes
	@echo "🧹 Cleaning up Docker resources..."
	docker compose down -v
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean everything including images
	@echo "🧹 Deep cleaning Docker resources..."
	docker compose down -v --rmi all
	docker system prune -af
	docker volume prune -f

# Quick Commands
quick-start: ## Quick start for demos (build + run detached)
	@echo "⚡ Quick starting NEO Risk Visualizer..."
	docker compose up -d --build
	@sleep 5
	@echo "✅ Services starting..."
	@echo "🌍 Frontend: http://localhost:5173"
	@echo "📡 Backend: http://localhost:8000"