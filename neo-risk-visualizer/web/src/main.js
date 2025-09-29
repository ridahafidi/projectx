// index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/asteroid-icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Impactor-2025 | Asteroid Impact Simulator</title>
    <meta name="description" content="Interactive asteroid impact visualization and mitigation tool for NASA Space Apps Challenge" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet">
  </head>
  <body class="bg-space-dark text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// src/App.jsx
import React, { useState, useCallback } from 'react'
import { AlertTriangle, Zap, Shield, Info, Github, ExternalLink } from 'lucide-react'
import ImpactMap from './components/Map/ImpactMap'
import ParameterPanel from './components/Simulation/ParameterPanel'
import ResultsPanel from './components/Simulation/ResultsPanel'
import MitigationPanel from './components/Mitigation/MitigationPanel'
import LoadingSpinner from './components/Common/LoadingSpinner'
import InfoTooltip from './components/Common/InfoTooltip'

function App() {
  const [activeTab, setActiveTab] = useState('simulation')
  const [simulationData, setSimulationData] = useState(null)
  const [mitigationData, setMitigationData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleSimulationComplete = useCallback((data) => {
    setSimulationData(data)
    setError(null)
  }, [])

  const handleMitigationComplete = useCallback((data) => {
    setMitigationData(data)
  }, [])

  const handleError = useCallback((error) => {
    setError(error.message || 'An error occurred')
    setIsLoading(false)
  }, [])

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-blue to-space-dark">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-warning animate-pulse-slow" />
              <div>
                <h1 className="text-2xl font-bold text-white">Impactor-2025</h1>
                <p className="text-sm text-gray-300">Asteroid Impact Simulation & Mitigation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <InfoTooltip content="NASA Space Apps Challenge 2024 - Interactive tool for asteroid impact assessment and planetary defense planning">
                <Info className="h-5 w-5 text-gray-400 hover:text-white cursor-help" />
              </InfoTooltip>
              
              <a 
                href="https://github.com/your-team/impactor-2025" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        
        {/* Left Panel - Controls */}
        <div className="lg:w-96 bg-black/30 backdrop-blur-sm border-r border-white/10 overflow-y-auto">
          
          {/* Tab Navigation */}
          <div className="border-b border-white/10">
            <div className="flex">
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'simulation' 
                    ? 'bg-space-blue text-white border-b-2 border-warning' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('simulation')}
              >
                <Zap className="inline h-4 w-4 mr-2" />
                Impact Simulation
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'mitigation' 
                    ? 'bg-space-blue text-white border-b-2 border-warning' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('mitigation')}
              >
                <Shield className="inline h-4 w-4 mr-2" />
                Mitigation
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'simulation' && (
              <div className="space-y-6">
                <ParameterPanel
                  selectedLocation={selectedLocation}
                  onSimulationStart={() => setIsLoading(true)}
                  onSimulationComplete={handleSimulationComplete}
                  onError={handleError}
                />
                
                {isLoading && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                )}
                
                {simulationData && (
                  <ResultsPanel data={simulationData} />
                )}
              </div>
            )}
            
            {activeTab === 'mitigation' && (
              <MitigationPanel
                simulationData={simulationData}
                onMitigationComplete={handleMitigationComplete}
                onError={handleError}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          <ImpactMap
            simulationData={simulationData}
            mitigationData={mitigationData}
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
          
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-danger/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-red-500/50">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-white/70 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>© 2024 Impactor-2025 Team</span>
              <span>•</span>
              <span>NASA Space Apps Challenge</span>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <InfoTooltip content="Physics simplified for rapid prototyping. Not for operational use.">
                <span className="cursor-help">⚠️ Demo Version</span>
              </InfoTooltip>
              <span>•</span>
              <span>Data: NASA CNEOS, USGS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App