import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Html, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import useSimulationFlow, { PHASES } from '../store/useSimulationFlow'
import { FEATURED_LOCATIONS } from '../data/locations'
import { latLonToCartesian } from '../utils/geo'

const EARTH_RADIUS = 1.5

// Optimized Earth with proper texture management
function EarthGlobe({ cameraDistance }) {
  const meshRef = useRef()
  
  // Dynamic LOD based on camera distance
  const segments = cameraDistance < 3 ? 64 : cameraDistance < 5 ? 32 : 16
  
  // Load appropriate texture resolution
  const textureRes = cameraDistance < 2.5 ? '2048' : '1024'
  
  // Fallback to existing textures
  const [dayTexture, nightTexture, normalTexture] = useLoader(
    THREE.TextureLoader,
    [
      '/textures/earth/day_2048.jpg',
      '/textures/earth/night_2048.png', 
      '/textures/earth/normal_2048.jpg'
    ]
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(EARTH_RADIUS, segments, segments), [segments])

  useEffect(() => {
    // Optimize texture settings for crisp rendering
    [dayTexture, nightTexture, normalTexture].forEach(texture => {
      if (texture) {
        texture.generateMipmaps = true
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 16 // Maximum anisotropy for sharp textures
      }
    })
  }, [dayTexture, nightTexture, normalTexture])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002 // Slow rotation
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        map={dayTexture}
        normalMap={normalTexture}
        emissiveMap={nightTexture}
        emissive={new THREE.Color('#1a2440')}
        emissiveIntensity={0.3}
        roughness={0.7}
        metalness={0.15}
        envMapIntensity={1.0}
      />
    </mesh>
  )
}

// Optimized clouds
function Clouds({ cameraDistance }) {
  const meshRef = useRef()
  const segments = Math.max(16, Math.min(32, 64 - cameraDistance * 8))
  
  const cloudTexture = useLoader(THREE.TextureLoader, '/textures/earth/clouds_2048.jpeg')
  const geometry = useMemo(() => new THREE.SphereGeometry(EARTH_RADIUS * 1.01, segments, segments), [segments])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        map={cloudTexture}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Atmosphere glow
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS * 1.05, 16, 16]} />
      <meshBasicMaterial
        color="#4fb6ff"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Smooth camera controller
function SmoothCameraController({ targetLocation }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const animationFrameRef = useRef()
  const [transitioning, setTransitioning] = useState(false)
  
  const { phase, confirmAlignment, completeReset } = useSimulationFlow((state) => ({
    phase: state.phase,
    confirmAlignment: state.confirmAlignment,
    completeReset: state.completeReset
  }))

  useEffect(() => {
    if (targetLocation && !transitioning && phase !== PHASES.RESETTING) {
      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      setTransitioning(true)
      
      // Calculate target position
      const targetPos = latLonToCartesian(targetLocation.latitude, targetLocation.longitude, EARTH_RADIUS)
      const cameraTarget = targetPos.clone().multiplyScalar(2.5)
      
      // Smooth animation
      const startPos = camera.position.clone()
      const startTime = performance.now()
      const duration = 1500

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Smooth easing
        const eased = 1 - Math.pow(1 - progress, 3)
        
        camera.position.lerpVectors(startPos, cameraTarget, eased)
        camera.lookAt(targetPos)
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          animationFrameRef.current = null
          setTransitioning(false)
          confirmAlignment()
        }
      }
      
      animate()
    }
  }, [targetLocation, camera, transitioning, confirmAlignment, phase])

  // Handle reset to global view
  useEffect(() => {
    if (phase === PHASES.RESETTING) {
      console.log('Starting reset animation, interrupting any ongoing transitions')
      
      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // Force interrupt any ongoing transition and start reset immediately
      setTransitioning(true)
      
      // Return to global view
      const globalPosition = new THREE.Vector3(0, 0, 5)
      const startPos = camera.position.clone()
      const startTime = performance.now()
      const duration = 1200

      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Smooth easing
        const eased = 1 - Math.pow(1 - progress, 3)
        
        camera.position.lerpVectors(startPos, globalPosition, eased)
        camera.lookAt(0, 0, 0)
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          console.log('Reset animation complete, calling completeReset()')
          animationFrameRef.current = null
          setTransitioning(false)
          completeReset()
        }
      }
      
      animate()
    }
  }, [phase, camera, completeReset])

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!transitioning}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={8}
      enablePan={false}
      maxPolarAngle={Math.PI * 0.9}
      minPolarAngle={Math.PI * 0.1}
    />
  )
}

// Interactive location markers with proper positioning
function LocationMarker({ location, isActive, onSelect, cameraDistance }) {
  const meshRef = useRef()
  const labelRef = useRef()
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  // Precise surface positioning
  const surfacePosition = useMemo(() => 
    latLonToCartesian(location.latitude, location.longitude, EARTH_RADIUS), 
    [location]
  )
  
  // Elevated position for marker
  const markerPosition = useMemo(() => 
    latLonToCartesian(location.latitude, location.longitude, EARTH_RADIUS + 0.03), 
    [location]
  )
  
  // Label position slightly above marker
  const labelPosition = useMemo(() => 
    latLonToCartesian(location.latitude, location.longitude, EARTH_RADIUS + 0.15), 
    [location]
  )
  
  const { camera } = useThree()
  
  // Check if location is visible (facing camera)
  useFrame(() => {
    if (surfacePosition && camera) {
      const cameraDirection = camera.position.clone().normalize()
      const locationDirection = surfacePosition.clone().normalize()
      const dot = locationDirection.dot(cameraDirection)
      const visible = dot > -0.2 // Show markers even slightly on the back side
      
      if (visible !== isVisible) {
        setIsVisible(visible)
      }
    }
  })
  
  const markerScale = Math.max(0.8, Math.min(2.0, (8 - cameraDistance) * 0.4))
  const showLabel = isVisible && (cameraDistance < 5 || isActive || isHovered)
  
  return (
    <group>
      {/* Surface marker dot */}
      <mesh
        ref={meshRef}
        position={markerPosition}
        scale={markerScale}
        visible={isVisible}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(location)
        }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshBasicMaterial 
          color={isActive ? '#ff4444' : isHovered ? '#ffaa00' : '#00ccff'} 
          emissive={isActive ? '#ff4444' : isHovered ? '#ffaa00' : '#00ccff'}
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Pulsing ring for active locations */}
      {(isActive || isHovered) && isVisible && (
        <mesh position={markerPosition} scale={markerScale}>
          <ringGeometry args={[0.03, 0.05, 16]} />
          <meshBasicMaterial
            color={isActive ? '#ff4444' : '#ffaa00'}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Connecting line from surface to label */}
      {showLabel && (
        <Line
          points={[markerPosition, labelPosition]}
          color={isActive ? '#ff4444' : '#00ccff'}
          lineWidth={1.5}
          transparent
          opacity={0.6}
          dashed={false}
        />
      )}
      
      {/* City name label */}
      {showLabel && (
        <Html 
          ref={labelRef}
          position={labelPosition} 
          distanceFactor={6}
          occlude
          style={{
            pointerEvents: 'auto',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease',
          }}
        >
          <div
            onClick={() => onSelect(location)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              cursor-pointer select-none transition-all duration-300 transform
              ${isActive ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'}
            `}
          >
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border
              ${isActive 
                ? 'bg-red-500/90 text-white border-red-400/50 shadow-red-500/30' 
                : isHovered
                ? 'bg-orange-500/90 text-white border-orange-400/50 shadow-orange-500/30'
                : 'bg-slate-900/85 text-sky-200 border-slate-700/50 hover:bg-slate-800/90'
              }
            `}>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-white animate-pulse' : 'bg-current opacity-60'
                }`} />
                <span className="whitespace-nowrap font-medium tracking-wide">
                  {location.name}
                </span>
              </div>
            </div>
            
            {/* Tooltip with coordinates on hover */}
            {isHovered && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap border border-white/20 z-10">
                {Math.abs(location.latitude).toFixed(2)}°{location.latitude >= 0 ? 'N' : 'S'}, {Math.abs(location.longitude).toFixed(2)}°{location.longitude >= 0 ? 'E' : 'W'}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Main scene content
function SceneContent({ onLocationSelect }) {
  const { camera } = useThree()
  const [cameraDistance, setCameraDistance] = useState(5)
  
  const { targetLocation, activeLocation } = useSimulationFlow((state) => ({
    targetLocation: state.targetLocation,
    activeLocation: state.activeLocation
  }))
  
  const selectLocation = useSimulationFlow((state) => state.selectLocation)

  // Monitor camera distance for LOD
  useFrame(() => {
    const distance = camera.position.length()
    if (Math.abs(distance - cameraDistance) > 0.1) {
      setCameraDistance(distance)
    }
  })

  const handleLocationSelect = (location) => {
    selectLocation(location)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  return (
    <>
      <Stars radius={100} depth={50} factor={2} saturation={0} fade speed={0.5} />
      
      {/* Main sun light */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={3.0} 
        color="#ffffff"
        castShadow={false}
      />
      
      {/* Fill light for shadows */}
      <ambientLight intensity={0.6} color="#87ceeb" />
      
      {/* Rim light */}
      <directionalLight 
        position={[-5, 2, -3]} 
        intensity={0.8} 
        color="#4a90e2" 
      />
      
      {/* Space environment light */}
      <hemisphereLight 
        skyColor="#87ceeb" 
        groundColor="#1a1a2e" 
        intensity={0.3} 
      />
      
      <EarthGlobe cameraDistance={cameraDistance} />
      <Clouds cameraDistance={cameraDistance} />
      <Atmosphere />
      
      {FEATURED_LOCATIONS.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          isActive={activeLocation?.id === location.id || targetLocation?.id === location.id}
          onSelect={handleLocationSelect}
          cameraDistance={cameraDistance}
        />
      ))}
      
      <SmoothCameraController targetLocation={targetLocation} />
    </>
  )
}

// Main component with optimized settings
function SmoothPlanetScene({ onLocationSelect }) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.LinearToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.8 }}
        frameloop="always" // Smooth continuous rendering
      >
        <color attach="background" args={["#1a1a2e"]} />
        <fog attach="fog" args={["#1a1a2e", 15, 30]} />
        
        <Suspense fallback={null}>
          <SceneContent onLocationSelect={onLocationSelect} />
        </Suspense>
      </Canvas>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur border border-white/20 rounded-lg p-3 text-xs text-white">
          <div className="font-semibold mb-1">🌍 Planet Controls</div>
          <div className="space-y-1 text-slate-300">
            <div>• Drag to rotate • Scroll to zoom</div>
            <div>• Click locations to target</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmoothPlanetScene