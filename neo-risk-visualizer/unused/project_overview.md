# Impactor-2025: NASA Space Apps Challenge
**Interactive Asteroid Impact Visualization & Mitigation Tool**

## Quick Start Guide

### Prerequisites
```bash
# Required software
- Python 3.9+
- Node.js 18+
- Git
- NASA API access (free)
```

### Repository Setup
```bash
git clone https://github.com/your-team/impactor-2025.git
cd impactor-2025

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Frontend setup (new terminal)
cd ../web
npm install
npm run dev
```

### Project Structure
```
impactor-2025/
├── backend/
│   ├── app.py                 # FastAPI main application
│   ├── requirements.txt       # Python dependencies
│   ├── physics/
│   │   ├── __init__.py
│   │   ├── impact_effects.py  # Blast, thermal, crater calculations
│   │   ├── deflection.py      # Mitigation physics
│   │   └── monte_carlo.py     # Uncertainty modeling
│   ├── data/
│   │   ├── __init__.py
│   │   ├── nasa_api.py        # CNEOS/SBDB data fetching
│   │   ├── population.py      # USGS population overlay
│   │   └── cache/             # Cached datasets
│   └── models/
│       ├── __init__.py
│       ├── requests.py        # Pydantic request models
│       └── responses.py       # Pydantic response models
├── web/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── ImpactMap.jsx
│   │   │   │   ├── EffectRings.jsx
│   │   │   │   └── PopulationOverlay.jsx
│   │   │   ├── Simulation/
│   │   │   │   ├── ParameterPanel.jsx
│   │   │   │   ├── ResultsPanel.jsx
│   │   │   │   └── UncertaintyView.jsx
│   │   │   ├── Mitigation/
│   │   │   │   ├── MitigationPanel.jsx
│   │   │   │   └── ComparisonView.jsx
│   │   │   └── Common/
│   │   │       ├── LoadingSpinner.jsx
│   │   │       └── InfoTooltip.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   └── styles/
│   │       └── globals.css
├── docs/
│   ├── README.md
│   ├── assumptions.md
│   ├── demo-script.md
│   └── assets/
└── .github/
    └── workflows/
        └── deploy.yml
```

## Team Task Distribution

### Day 1 Tasks
**T1 (Integrator/Lead)**
- [ ] Initialize repository with CI/CD
- [ ] Set up development environment
- [ ] Create API documentation with Swagger
- [ ] Review team PRs and resolve conflicts

**T2 (Backend/Physics)**
- [ ] FastAPI application scaffold
- [ ] Mock `/simulate` endpoint with sample data
- [ ] Basic physics formulas research
- [ ] Set up testing framework

**T3 (Data/Geo)**
- [ ] NASA CNEOS API integration
- [ ] Download and cache asteroid parameters
- [ ] Integrate USGS population data
- [ ] Create data validation pipeline

**T4 (Frontend/Map)**
- [ ] React + Vite + Mapbox setup
- [ ] Interactive map with click handlers
- [ ] Parameter sliders UI
- [ ] Mock effect rings visualization

**T5 (Comms & Validation)**
- [ ] Draft assumptions documentation
- [ ] Create UI copy and tooltips
- [ ] Demo script outline
- [ ] Pitch deck template

### Day 2 Tasks
**T2 (Backend/Physics)**
- [ ] Implement Earth Impact Effects formulas
- [ ] Monte Carlo uncertainty modeling
- [ ] Population exposure calculations
- [ ] API performance optimization

**T3 (Data/Geo)**
- [ ] Real-time population queries within effect radii
- [ ] Geographic boundary handling
- [ ] Data caching optimization
- [ ] Population density overlays

**T4 (Frontend/Map)**
- [ ] Connect to real simulation API
- [ ] Toggleable map overlays
- [ ] Results panel with exposure metrics
- [ ] Uncertainty visualization (error bands)

**T5 (Comms & Validation)**
- [ ] Physics validation & testing
- [ ] UI/UX improvements
- [ ] Limitations documentation
- [ ] Demo screenshots and content

### Day 3 Tasks
**T2 (Backend/Physics)**
- [ ] Implement `/deflect` endpoint
- [ ] Deflection physics (kinetic, gravity tractor)
- [ ] Impact corridor calculations
- [ ] Final API optimizations

**T3 (Data/Geo)**
- [ ] Impact corridor visualization data
- [ ] Pre/post mitigation comparisons
- [ ] Final data pipeline testing
- [ ] Performance monitoring

**T4 (Frontend/Map)**
- [ ] Mitigation tab implementation
- [ ] Side-by-side comparison views
- [ ] Polish animations and interactions
- [ ] Mobile responsiveness

**T5 (Comms & Validation)**
- [ ] Record 2-3 minute demo video
- [ ] Finalize README and one-pager
- [ ] Final testing and bug fixes
- [ ] Deployment and sharing setup

## Environment Variables
```bash
# backend/.env
NASA_API_KEY=your_nasa_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
POPULATION_DATA_URL=https://sedac.ciesin.columbia.edu/downloads/...
CORS_ORIGINS=http://localhost:5173,https://your-domain.com

# web/.env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## API Documentation Preview
The FastAPI app will auto-generate docs at `http://localhost:8000/docs`

Key endpoints:
- `POST /simulate` - Calculate impact effects and exposure
- `POST /deflect` - Simulate deflection scenarios
- `GET /asteroids` - Fetch NASA asteroid catalog
- `GET /health` - System health check

## Success Criteria Checklist
- [ ] Click map location → effect rings + population counts in <2 seconds
- [ ] Transparent assumptions with uncertainty bands displayed
- [ ] Mitigation sandbox shows impact probability changes
- [ ] 2-3 minute demo video recorded and polished
- [ ] All code committed with proper documentation
- [ ] Deployed demo accessible via public URL