// src/components/Mitigation/ComparisonView.jsx
import React from 'react'
import { ArrowRight, TrendingDown, Users } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

const ComparisonView = ({ beforeData, afterData }) => {
  if (!beforeData || !afterData) return null

  const beforePopulation = beforeData.exposure?.total_affected?.p50 || 0
  const reductionFactor = afterData.impact_probability_drop || 0
  const afterPopulation = beforePopulation * (1 - reductionFactor)
  const savedLives = beforePopulation - afterPopulation

  return (
    <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
      <h4 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingDown className="h-5 w-5 mr-2 text-safe" />
        Before vs After Mitigation
      </h4>

      {/* Population Impact Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="text-center p-3 bg-red-900/30 border border-red-600 rounded-lg">
          <Users className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <div className="text-sm text-gray-300 mb-1">Without Mitigation</div>
          <div className="text-xl font-bold text-red-400">
            {formatNumber(beforePopulation)}
          </div>
          <div className="text-xs text-gray-400">people at risk</div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-8 w-8 text-safe" />
        </div>

        <div className="text-center p-3 bg-green-900/30 border border-safe rounded-lg">
          <Users className="h-6 w-6 text-safe mx-auto mb-2" />
          <div className="text-sm text-gray-300 mb-1">With Mitigation</div>
          <div className="text-xl font-bold text-safe">
            {formatNumber(afterPopulation)}
          </div>
          <div className="text-xs text-gray-400">people at risk</div>
        </div>
      </div>

      {/* Lives Saved */}
      <div className="mt-4 text-center p-3 bg-blue-900/30 border border-blue-600 rounded-lg">
        <div className="text-2xl font-bold text-blue-400 mb-1">
          {formatNumber(savedLives)}
        </div>
        <div className="text-sm text-blue-300">potential lives saved</div>
        <div className="text-xs text-gray-400 mt-1">
          {(reductionFactor * 100).toFixed(1)}% risk reduction
        </div>
      </div>

      {/* Mission Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-300">Mission Method</div>
          <div className="font-semibold capitalize">{afterData.new_trajectory?.method || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-gray-300">Lead Time</div>
          <div className="font-semibold">{afterData.new_trajectory?.lead_time_years || 0} years</div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonView

// src/styles/globals.css
@tailwind base;
@tailwind components; 
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'cv02','cv03','cv04','cv11';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Mapbox overrides */
.mapboxgl-popup-content {
  background: rgba(17, 24, 39, 0.95) !important;
  color: white !important;
  border: 1px solid rgba(75, 85, 99, 0.5) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(8px) !important;
}

.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
  border-bottom-color: rgba(17, 24, 39, 0.95) !important;
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
  border-top-color: rgba(17, 24, 39, 0.95) !important;
}

.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
  border-right-color: rgba(17, 24, 39, 0.95) !important;
}

.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
  border-left-color: rgba(17, 24, 39, 0.95) !important;
}

/* Custom animations */
@keyframes meteor {
  0% {
    transform: rotate(-45deg) translate(-100px, -100px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: rotate(-45deg) translate(100px, 100px);
    opacity: 0;
  }
}

.animate-meteor {
  animation: meteor 3s linear infinite;
}

/* Glowing effects */
.glow-warning {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
}

.glow-danger {
  box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
}

.glow-safe {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

/* Loading states */
.skeleton {
  @apply bg-gray-700 animate-pulse rounded;
}

/* Focus states for accessibility */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}