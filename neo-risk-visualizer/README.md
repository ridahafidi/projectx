# 🛡️ NEO Risk Visualizer
**Interactive Asteroid Impact Visualization & Mitigation Tool**  
*NASA Space Apps Challenge 2025*

[![GitHub stars](https://img.shields.io/github/stars/abouguri/neo-risk-visualizer?style=social)](https://github.com/abouguri/neo-risk-visualizer/stargazers)
[![License](https://img.shields.io/badge/📄-MIT-green)](LICENSE)
[![Docker](https://img.shields.io/badge/🐳-Docker%20Ready-blue)](docker-compose.yml)
[![API](https://img.shields.io/badge/📡-FastAPI-009688)](http://localhost:8000/docs)

> 🌍 **Making planetary defense as accessible as weather forecasting**

## 🎯 Challenge Overview

**NASA Space Apps Challenge 2025:** Develop an interactive tool for asteroid impact assessment and mitigation planning that communicates risk clearly to decision-makers and the public.

**Our Solution:** NEO Risk Visualizer combines real NASA data, scientifically-grounded physics simulations, and intuitive space-themed visualization to democratize planetary defense planning.

## ✨ Key Features

- **🎯 Interactive Impact Simulation** - Click anywhere on Earth to simulate asteroid impacts with real physics
- **📊 Uncertainty Quantification** - Monte Carlo analysis shows probability ranges and confidence intervals
- **🛡️ Mitigation Scenarios** - Model deflection missions (kinetic impactor, gravity tractor, nuclear standoff)
- **🌍 Real Data Integration** - NASA CNEOS asteroid catalog and population density overlays
- **📱 Space-Themed UI** - Beautiful, responsive design with cosmic gradients and animations
- **⚡ Real-Time Performance** - Sub-second simulation results with modern web technologies
- **🐳 Docker Ready** - One-command deployment with full containerization

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/abouguri/neo-risk-visualizer.git
cd neo-risk-visualizer

# Start all services with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Option 2: Local Development

#### Prerequisites
- **Python** 3.9+ with pip
- **Node.js** 18+ with npm
- **Git** for cloning

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# In a new terminal
cd web
npm install
npm run dev

# Frontend will be available at http://localhost:3000
```

## 🏗️ Project Architecture

```
neo-risk-visualizer/
├── backend/                    # FastAPI Python backend
│   ├── app.py                 # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── physics/               # Physics simulation modules
│   │   ├── impact_effects.py  # Blast, thermal, crater calculations
│   │   ├── deflection.py      # Mitigation strategy physics
│   │   └── monte_carlo.py     # Uncertainty quantification
│   ├── data/                  # Data access layer
│   │   ├── nasa_api.py        # NASA CNEOS/SBDB integration
│   │   └── population.py      # Population density analysis
│   └── models/                # Pydantic data models
│       ├── requests.py        # API request schemas
│       └── responses.py       # API response schemas
├── web/                       # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main React application
│   │   ├── styles/           # Tailwind CSS and custom styles
│   │   └── components.js     # UI component library
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.js    # Tailwind CSS configuration
├── docker-compose.yml         # Multi-service orchestration
├── Makefile                   # Development shortcuts
└── README.md                  # This file
```

## 🎮 Usage Examples

### Basic Impact Simulation
```bash
# Simulate 100m asteroid impact in New York
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "diameter": 100,
    "velocity": 20000,
    "angle": 45
  }'
```

### Deflection Mission Planning
```bash
# Model kinetic impactor mission
curl -X POST "http://localhost:8000/deflect" \
  -H "Content-Type: application/json" \
  -d '{
    "asteroid_mass": 5e12,
    "velocity": 25000,
    "method": "kinetic_impactor",
    "lead_time": 10
  }'
```

### Real Asteroid Data
```bash
# Get current near-Earth asteroids
curl "http://localhost:8000/asteroids?limit=10&min_diameter=50"
```

## 🧪 Scientific Foundation

### Physics Models
- **Atmospheric Entry:** Detailed ablation and fragmentation modeling
- **Ground Impact:** Crater formation, seismic effects, and ejecta distribution  
- **Thermal Radiation:** Fireball temperature and thermal injury radii
- **Blast Wave:** Overpressure calculations and structural damage assessment
- **Uncertainty Analysis:** Monte Carlo simulation with realistic parameter distributions

### Data Sources
- **NASA CNEOS:** Near-Earth Object observations and orbital data
- **USGS Population:** Global population density for impact assessment
- **Planetary Science Literature:** Peer-reviewed impact physics models

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests  
cd web
npm test
```

### Docker Development
```bash
# Build and start development environment
make dev

# View logs
make logs

# Stop services
make stop

# Production build
make prod
```

### API Documentation
When running locally, comprehensive API documentation is available at:
- **Interactive Docs:** http://localhost:8000/docs (Swagger UI)
- **ReDoc:** http://localhost:8000/redoc (Alternative documentation)
- **OpenAPI Schema:** http://localhost:8000/openapi.json

## 🌟 Demo & Screenshots

### Main Interface
- **Parameter Panel:** Asteroid size, velocity, impact angle, and location selection
- **Results Visualization:** Impact effects with uncertainty ranges and damage radii
- **Mitigation Planning:** Deflection mission scenarios with success probabilities

### Key Capabilities
- **Real-time Simulation:** Sub-second response times for complex physics calculations
- **Uncertainty Quantification:** Confidence intervals on all major outputs
- **Population Impact:** Casualty estimates based on real population density data
- **Mission Planning:** Deflection effectiveness for different lead times and methods

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup
```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run linting
make lint

# Format code
make format
```

## 📊 Technical Specifications

### Backend (FastAPI + Python)
- **Framework:** FastAPI 0.104+ with async/await support
- **Physics:** NumPy/SciPy for numerical simulations
- **Data:** Pydantic for type validation and serialization
- **Performance:** <1 second response times for typical queries
- **Scalability:** Stateless design ready for horizontal scaling

### Frontend (React + Tailwind)
- **Framework:** React 18 with modern hooks and context
- **Styling:** Tailwind CSS with custom space theme
- **Build:** Vite for fast development and optimized production builds
- **Responsive:** Mobile-first design with desktop enhancements
- **Performance:** Lazy loading and optimized bundle sizes

### Infrastructure (Docker + Compose)
- **Containerization:** Multi-stage builds for production optimization
- **Orchestration:** Docker Compose with service dependencies
- **Networking:** Internal service communication with external API access
- **Volumes:** Persistent data storage for caching and logs
- **Health Checks:** Automatic service monitoring and restart policies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 NASA Space Apps Challenge

This project was developed for the **NASA Space Apps Challenge 2025** under the challenge:
**"Develop an interactive asteroid impact and deflection analysis tool"**

### Team Credits
- **Development:** Full-stack application with modern web technologies
- **Science:** Peer-reviewed physics models and NASA data integration  
- **Design:** Space-themed UI with accessibility and mobile support
- **Infrastructure:** Production-ready Docker deployment

### Challenge Requirements Met
- ✅ **Interactive Visualization:** Click-to-simulate impact anywhere on Earth
- ✅ **Scientific Accuracy:** Physics-based models with uncertainty quantification
- ✅ **Real Data:** NASA CNEOS asteroid catalog and population overlays
- ✅ **Mitigation Analysis:** Deflection mission planning and effectiveness modeling
- ✅ **Public Communication:** Clear, accessible presentation of complex data
- ✅ **Technical Excellence:** Modern, scalable, well-documented codebase

## 🔗 Links

- **GitHub Repository:** https://github.com/abouguri/neo-risk-visualizer
- **Live Demo:** http://localhost:3000 (when running locally)
- **API Documentation:** http://localhost:8000/docs (when running locally)
- **NASA Space Apps Challenge:** https://spaceapps.nasa.gov/

---

*Built with 💙 for planetary defense and space exploration*