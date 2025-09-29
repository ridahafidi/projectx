# 🐳 Docker Deployment Guide for Impactor-2025

## Quick Start

### Prerequisites
- Docker 20.0+
- Docker Compose 2.0+
- 4GB+ available RAM

### One-Command Setup
```bash
# Copy environment template and start development environment
make setup
make quick-start
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Impactor-2025 Stack                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │       Services          │
│   React + Vite  │   FastAPI       │                         │
│   Port: 5173    │   Port: 8000    │   Redis (Cache)         │
│   Nginx (Prod)  │   Python 3.13   │   Port: 6379           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🚀 Development Mode

### Start Development Environment
```bash
# With hot-reload enabled
make dev

# In background (detached)
make dev-detached

# View logs
make logs
```

### Features:
- **Hot Reload**: Code changes automatically reflected
- **Volume Mounting**: Source code mounted for live editing
- **Debug Mode**: Full error traces and development tools
- **Port Exposure**: Direct access to both services

## 🌍 Production Mode

### Deploy Production Build
```bash
# Build optimized containers and deploy
make prod

# Check deployment status
make status
make health
```

### Production Features:
- **Optimized Builds**: Minified assets, smaller images
- **Multi-stage Docker**: Separate build and runtime environments  
- **Load Balancing**: Nginx reverse proxy
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Automatic service monitoring
- **Security**: Non-root users, minimal attack surface

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start development environment |
| `make prod` | Deploy production environment |
| `make build` | Build Docker images |
| `make logs` | View all service logs |
| `make shell-backend` | Open backend container shell |
| `make test` | Run all tests |
| `make clean` | Remove containers and volumes |
| `make health` | Check service health |
| `make quick-start` | One-command demo startup |

## 📁 Docker Files Structure

```
impactor-2025/
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration  
├── Makefile                    # Docker management commands
├── .env.example               # Environment template
├── backend/
│   ├── Dockerfile             # Backend container definition
│   └── .dockerignore          # Backend build exclusions
└── web/
    ├── Dockerfile             # Multi-stage frontend build
    ├── nginx.conf             # Production web server config
    └── .dockerignore          # Frontend build exclusions
```

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# NASA API (get free key from NASA)
NASA_API_KEY=your_nasa_api_key

# Mapbox for 3D Earth visualization  
VITE_MAPBOX_TOKEN=your_mapbox_token

# Environment mode
ENVIRONMENT=development
```

### Custom Configuration
- **Backend**: Modify `backend/Dockerfile` for Python dependencies
- **Frontend**: Update `web/Dockerfile` for Node.js configuration
- **Nginx**: Edit `web/nginx.conf` for routing and performance tuning
- **Services**: Adjust `docker-compose.yml` for port mapping and resources

## 🎯 Use Cases

### For Developers
```bash
# Daily development workflow
make dev
# Edit code with hot-reload
make logs-backend  # Debug backend issues
make test          # Run tests before commit
```

### For Demos/Presentations  
```bash
# Quick demo setup
make quick-start
# Opens both frontend (5173) and backend (8000)
# Professional NASA-style interface ready in 30 seconds
```

### For Production Deployment
```bash
# Production deployment
make prod
# Optimized, load-balanced, monitored deployment
# Ready for cloud deployment (AWS, Azure, GCP)
```

### For NASA Space Apps Challenge
```bash
# Team collaboration
git clone <your-repo>
make setup
make dev
# Consistent environment across all team members
# No "works on my machine" issues
```

## 🔍 Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check what's using ports
lsof -i :5173
lsof -i :8000

# Stop conflicting services or change ports in docker-compose.yml
```

**Build Failures**
```bash
# Clean rebuild
make clean
make build

# Check logs for specific errors
make logs
```

**Memory Issues**
```bash
# Check Docker resource usage
docker system df
docker stats

# Clean up unused resources
make clean
```

**Service Health**
```bash
# Check all services
make health

# Individual service logs
make logs-backend
make logs-frontend
```

## 📊 Monitoring

### Health Checks
- **Backend**: HTTP health endpoint at `/health`
- **Frontend**: HTTP response check
- **Redis**: Connection test
- **Automated**: Docker Compose health checks

### Log Aggregation
```bash
# All services
make logs

# Specific services
make logs-backend
make logs-frontend

# Follow live logs
docker-compose logs -f --tail=50
```

## 🔒 Security Features

- **Non-root containers**: All services run as non-privileged users
- **Minimal base images**: Alpine Linux for smaller attack surface  
- **Network isolation**: Services communicate via internal Docker network
- **Resource limits**: CPU and memory constraints prevent resource exhaustion
- **Health monitoring**: Automatic restart of unhealthy containers

## 🚀 Cloud Deployment Ready

The Docker configuration supports deployment to:
- **AWS ECS/Fargate**: Production-ready container definitions
- **Google Cloud Run**: Auto-scaling serverless containers  
- **Azure Container Instances**: Managed container hosting
- **Kubernetes**: Orchestration-ready with health checks and resource limits
- **DigitalOcean Apps**: Simple container deployment

## 📈 Performance Optimization

### Development
- **Volume caching**: Dependencies cached in named volumes
- **Layer optimization**: Dockerfile layers ordered for maximum caching
- **Parallel builds**: Multi-service builds run concurrently

### Production  
- **Multi-stage builds**: Separate build and runtime images
- **Asset optimization**: Vite production builds with tree-shaking
- **Nginx caching**: Static asset caching and gzip compression
- **Resource limits**: Prevents resource contention

---

**Ready for NASA Space Apps Challenge! 🚀🌍**