# 🛡️ Impactor-2025
**Interactive Asteroid Impact Visualization & Mitigation Tool**  
*NASA Space Apps Challenge 2024*

[![Demo](https://img.shields.io/badge/🚀-Live%20Demo-orange)](https://impactor-2025.vercel.app)
[![API](https://img.shields.io/badge/📡-API%20Docs-blue)](https://api.impactor-2025.com/docs)
[![License](https://img.shields.io/badge/📄-MIT-green)](LICENSE)

> 🌍 **Making planetary defense as accessible as weather forecasting**

## 🎯 Challenge Overview

**NASA Space Apps Challenge:** Develop an interactive tool for asteroid impact assessment and mitigation planning that communicates risk clearly to decision-makers and the public.

**Our Solution:** Impactor-2025 combines real NASA data, scientifically-grounded physics, and intuitive visualization to democratize planetary defense planning.

## ✨ Key Features

- **🎯 Interactive Impact Simulation** - Click anywhere on Earth to simulate asteroid impacts
- **📊 Uncertainty Quantification** - Monte Carlo analysis shows probability ranges, not just point estimates  
- **🛡️ Mitigation Scenarios** - Model deflection missions (kinetic, gravity tractor, nuclear standoff)
- **🌍 Real Data Integration** - NASA CNEOS asteroid catalog and USGS population data
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices
- **⚡ Real-Time Performance** - Results in <2 seconds with modern web technologies

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **Python** 3.9+
- **NASA API Key** (free): https://api.nasa.gov/
- **Mapbox Token** (free): https://mapbox.com/

### Installation

```bash
# Clone repository
git clone https://github.com/your-team/impactor-2025.git
cd impactor-2025

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your NASA_API_KEY and MAPBOX_ACCESS_TOKEN

# Start backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Frontend setup (new terminal)
cd ../web
npm install
cp .env.example .env.local
# Edit .env.local with your tokens

# Start frontend
npm run dev
```

### 🌐 Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 📖 Usage Guide

### 1. Select Impact Location
Click anywhere on the interactive map to set the asteroid impact coordinates.

### 2. Configure Asteroid Parameters
- **Diameter:** 1m to 2km (affects total impact energy)
- **Density:** 1000-8000 kg/m³ (rocky ~2500, metallic ~5000, icy ~1000)
- **Velocity:** 11-50 km/s (typical Earth impacts: 15-25 km/s)
- **Angle:** 15-90° (shallow angles create elongated damage patterns)

### 3. Run Impact Simulation
Click "Simulate Impact" to calculate:
- **Blast Effects:** Overpressure zones (1, 5, 10, 20, 50 PSI)
- **Thermal Effects:** Heat flux zones causing burns and ignition
- **Crater Formation:** Rim radius, depth, and ejecta blanket
- **Population Exposure:** People at risk with uncertainty ranges

### 4. Explore Mitigation Options
Switch to the "Mitigation" tab to model deflection missions:
- **Kinetic Impactor:** High-speed spacecraft collision (like DART)
- **Gravity Tractor:** Slow gravitational deflection
- **Nuclear Standoff:** Nuclear explosion near asteroid (not direct impact)

### 5. Compare Scenarios
View before/after comparisons showing lives saved and risk reduction.

## 🛠️ Technical Architecture

```
impactor-2025/
├── backend/              # FastAPI + Python
│   ├── app.py           # Main API application  
│   ├── physics/         # Impact & deflection calculations
│   ├── data/            # NASA API integration & population analysis
│   └── models/          # Pydantic request/response schemas
├── web/                 # React + Vite frontend
│   ├── src/components/  # React components
│   ├── src/services/    # API integration
│   └── src/utils/       # Formatting & utilities
└── docs/               # Documentation & demo materials
```

### Backend Stack
- **FastAPI** - High-performance async API framework
- **NumPy/SciPy** - Scientific computing and Monte Carlo analysis
- **Pandas** - Data manipulation and analysis
- **Rasterio** - Geospatial population data processing
- **Pydantic** - Request/response validation and serialization

### Frontend Stack  
- **React 18** - Modern component-based UI framework
- **Vite** - Fast build tool and development server
- **Mapbox GL JS** - Interactive mapping and visualization
- **Tailwind CSS** - Utility-first styling framework
- **Recharts** - Data visualization components

### Physics & Data Sources
- **Earth Impact Effects Program** - Blast, thermal, and crater scaling laws
- **NASA CNEOS** - Close approach data and orbital parameters
- **NASA SBDB** - Small body database for physical properties
- **USGS/SEDAC** - Global population density datasets

## 📊 API Reference

### Core Endpoints

#### `POST /simulate`
Calculate asteroid impact effects and population exposure.

```json
{
  "lat": 40.7128,
  "lon": -74.0060,
  "diameter_m": 140,
  "density_kg_m3": 2500,
  "velocity_km_s": 25,
  "angle_deg": 30
}
```

**Response:** Impact effects with uncertainty bands and population exposure estimates.

#### `POST /deflect`
Simulate deflection mission effectiveness.

```json
{
  "delta_v_cm_s": 100,
  "lead_time_years": 10,
  "method": "kinetic",
  "asteroid_diameter_m": 140
}
```

**Response:** Mission results, feasibility assessment, and risk reduction.

#### `GET /asteroids`
Fetch potentially hazardous asteroids from NASA databases.

**Response:** Array of asteroids with physical and orbital parameters.

### Full API documentation available at `/docs` when running the backend.

## 🧪 Scientific Methodology

### Impact Physics
Our calculations use simplified but scientifically-grounded formulas from:
- **Collins, Melosh & Marcus (2005)** - Earth Impact Effects Program
- **Glasstone & Dolan (1977)** - Nuclear blast scaling laws  
- **Melosh (1989)** - Crater formation scaling relationships

### Uncertainty Quantification
- **Monte Carlo sampling** propagates parameter uncertainties
- **Log-normal distributions** model realistic asteroid property variations
- **Percentile ranges** (5th, 50th, 95th) communicate uncertainty clearly

### Population Analysis
- **Circular integration** within effect radii
- **Major city databases** for high-density areas
- **Regional density estimates** for rural areas
- **Geometric overlap** calculations for partial city impacts

### Limitations & Assumptions
- **Simplified atmospheric filtering** (production systems need full atmospheric models)
- **Uniform surface properties** (real impacts depend on local geology)  
- **Point-source explosions** (real impacts have complex 3D effects)
- **Static population data** (doesn't account for evacuation or time-of-day variations)

## 🚀 Deployment

### Environment Variables

```bash
# Backend (.env)
NASA_API_KEY=your_nasa_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here  
CORS_ORIGINS=http://localhost:5173,https://your-domain.com

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individually
docker build -t impactor-backend ./backend
docker build -t impactor-frontend ./web
```

### Cloud Deployment
- **Backend:** Deploy to Railway, Render, or AWS Lambda
- **Frontend:** Deploy to Vercel, Netlify, or GitHub Pages  
- **Database:** Use PostgreSQL for production (currently uses in-memory cache)

## 👥 Team

**Team Name:** [Your Team Name]  
**NASA Space Apps Challenge 2024**

- **T1 - Integrator/Lead:** Repository management, CI/CD, code reviews
- **T2 - Backend/Physics:** FastAPI development, impact physics, deflection modeling  
- **T3 - Data/Geo:** NASA API integration, population analysis, geospatial processing
- **T4 - Frontend/Map:** React development, Mapbox integration, user interface
- **T5 - Comms & Validation:** Documentation, UX copy, demo production, testing

## 🎬 Demo Video

[![Demo Video](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://youtu.be/YOUR_VIDEO_ID)

**Watch our 3-minute demo:** https://youtu.be/YOUR_VIDEO_ID

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run the linter (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA** for providing free access to asteroid databases and impact research
- **Mapbox** for beautiful and performant mapping services
- **Earth Impact Effects Program** for validated impact physics formulas
- **DART Mission Team** for proving kinetic deflection works
- **Planetary Defense Community** for inspiration and scientific guidance

## 📚 References & Further Reading

### Scientific Papers
- Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). Earth Impact Effects Program. *Meteoritics & Planetary Science*, 40(6), 817-840.
- Glasstone, S., & Dolan, P. J. (1977). *The Effects of Nuclear Weapons*. US Department of Defense.
- Melosh, H. J. (1989). *Impact Cratering: A Geologic Process*. Oxford University Press.

### NASA Resources
- [NASA Planetary Defense](https://www.nasa.gov/planetarydefense/)
- [CNEOS - Center for Near Earth Object Studies](https://cneos.jpl.nasa.gov/)
- [DART Mission](https://www.nasa.gov/dart/)

### Data Sources
- [NASA Small Body Database](https://ssd.jpl.nasa.gov/sbdb.cgi)
- [USGS Population of the World](https://www.usgs.gov/centers/eros/science/usgs-eros-archive-population-gridded-population-world-gpw-version-4-gpwv4)
- [SEDAC Population Data](https://sedac.ciesin.columbia.edu/data/sets/browse)

---

**🌍 Built with 💙 for planetary defense and public safety**

*For questions, issues, or collaboration opportunities, please open an issue or contact the team.*

---

## `.github/workflows/deploy.yml`

```yaml
name: Deploy Impactor-2025

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Run tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: web/package-lock.json
        
    - name: Install dependencies
      run: |
        cd web
        npm ci
        
    - name: Run linter
      run: |
        cd web
        npm run lint
        
    - name: Build
      run: |
        cd web
        npm run build

  deploy-backend:
    if: github.ref == 'refs/heads/main'
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: railwayapp/railway-deploy@v1
      with:
        service: impactor-backend
        project: ${{ secrets.RAILWAY_PROJECT_ID }}
        token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    if: github.ref == 'refs/heads/main'
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: web/package-lock.json
        
    - name: Install and build
      run: |
        cd web
        npm ci
        npm run build
        
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: web
```

## `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NASA_API_KEY=${NASA_API_KEY}
      - MAPBOX_ACCESS_TOKEN=${MAPBOX_ACCESS_TOKEN}
      - CORS_ORIGINS=http://localhost:5173
    volumes:
      - ./backend:/app
    command: uvicorn app:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./web  
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
      - VITE_MAPBOX_TOKEN=${MAPBOX_ACCESS_TOKEN}
    volumes:
      - ./web:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: impactor
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## `backend/Dockerfile`

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## `web/Dockerfile` 

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```