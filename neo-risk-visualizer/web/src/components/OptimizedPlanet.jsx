import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree, useLoader, extend } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import useSimulationFlow, { PHASES } from '../store/useSimulationFlow'
import { FEATURED_LOCATIONS } from '../data/locations'
import { latLonToCartesian } from '../utils/geo'

// Custom shaders for better performance and quality
const EarthShaderMaterial = shaderMaterial(
  {
    uDayTexture: null,
    uNightTexture: null,
    uNormalTexture: null,
    uCloudTexture: null,
    uSunDirection: new THREE.Vector3(1, 0, 0),
    uAtmosphereColor: new THREE.Color('#4fb6ff'),
    uTime: 0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uDayTexture;
    uniform sampler2D uNightTexture;
    uniform sampler2D uNormalTexture;
    uniform sampler2D uCloudTexture;
    uniform vec3 uSunDirection;
    uniform vec3 uAtmosphereColor;
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Sample textures
      vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
      vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
      vec3 normalMap = texture2D(uNormalTexture, vUv).rgb;
      
      // Calculate lighting
      float sunDot = dot(vNormal, normalize(uSunDirection));
      float dayFactor = smoothstep(-0.2, 0.2, sunDot);
      
      // Mix day and night
      vec3 color = mix(nightColor * 0.3, dayColor, dayFactor);
      
      // Add atmosphere glow
      float fresnel = 1.0 - abs(dot(vNormal, normalize(cameraPosition - vPosition)));
      vec3 atmosphere = uAtmosphereColor * pow(fresnel, 2.0) * 0.3;
      
      gl_FragColor = vec4(color + atmosphere, 1.0);
    }
  `
)

extend({ EarthShaderMaterial })

// Optimized Earth component with LOD
function OptimizedEarth({ zoomLevel }) {
  const meshRef = useRef()
  const materialRef = useRef()
  
  // Load textures with different resolutions based on zoom
  const textureSize = zoomLevel > 2 ? '2048' : zoomLevel > 1 ? '1024' : '512'
  
  const [dayTexture, nightTexture, normalTexture] = useLoader(
    THREE.TextureLoader,
    [
      `/textures/earth/day_${textureSize}.jpg`,
      `/textures/earth/night_${textureSize}.png`,
      `/textures/earth/normal_${textureSize}.jpg`,
    ]
  )

  // Dynamic geometry resolution based on zoom level
  const geometry = useMemo(() => {
    const segments = zoomLevel > 3 ? 128 : zoomLevel > 2 ? 64 : zoomLevel > 1 ? 32 : 16
    return new THREE.SphereGeometry(1.5, segments, segments)
  }, [zoomLevel])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime
      materialRef.current.uSunDirection.set(
        Math.cos(state.clock.elapsedTime * 0.1),
        Math.sin(state.clock.elapsedTime * 0.1) * 0.3,
        Math.sin(state.clock.elapsedTime * 0.1)
      ).normalize()
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <earthShaderMaterial
        ref={materialRef}
        uDayTexture={dayTexture}
        uNightTexture={nightTexture}
        uNormalTexture={normalTexture}
      />
    </mesh>
  )
}

// Lightweight cloud layer
function CloudLayer({ zoomLevel }) {
  const meshRef = useRef()
  const cloudTexture = useLoader(THREE.TextureLoader, '/textures/earth/clouds_1024.jpeg')
  
  const geometry = useMemo(() => {
    const segments = Math.max(16, Math.min(64, zoomLevel * 16))
    return new THREE.SphereGeometry(1.51, segments, segments)
  }, [zoomLevel])

  useFrame((state) => {
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

// Efficient location markers using instanced rendering
function LocationMarkers({ onSelect, zoomLevel }) {
  const meshRef = useRef()
  const { activeLocation, targetLocation } = useSimulationFlow((state) => ({
    activeLocation: state.activeLocation,
    targetLocation: state.targetLocation
  }))

  const instancedMesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(0.02, 8, 8)
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff' })
    const mesh = new THREE.InstancedMesh(geometry, material, FEATURED_LOCATIONS.length)
    
    FEATURED_LOCATIONS.forEach((location, i) => {
      const position = latLonToCartesian(location.latitude, location.longitude, 1.52)
      const matrix = new THREE.Matrix4()
      matrix.setPosition(position)
      mesh.setMatrixAt(i, matrix)
      
      // Color based on state
      const isActive = activeLocation?.id === location.id
      const isTarget = targetLocation?.id === location.id
      const color = new THREE.Color(isActive ? '#ff6b35' : isTarget ? '#4f9cff' : '#ffffff')
      mesh.setColorAt(i, color)
    })
    
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    
    return mesh
  }, [activeLocation, targetLocation])

  return <primitive object={instancedMesh} ref={meshRef} />
}

// Smooth camera controller
function CameraController({ target, onTargetReached }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (target && !isTransitioning) {
      setIsTransitioning(true)
      
      // Smooth transition to target
      const targetPos = latLonToCartesian(target.latitude, target.longitude, 2.5)
      const lookAtPos = latLonToCartesian(target.latitude, target.longitude, 1.5)
      
      // Animate camera position
      const startPos = camera.position.clone()
      const startTime = Date.now()
      const duration = 2000 // 2 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Smooth easing function
        const eased = 1 - Math.pow(1 - progress, 3)
        
        camera.position.lerpVectors(startPos, targetPos, eased)
        camera.lookAt(lookAtPos)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsTransitioning(false)
          if (onTargetReached) onTargetReached()
        }
      }
      
      animate()
    }
  }, [target, camera, isTransitioning, onTargetReached])

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isTransitioning}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1.8}
      maxDistance={10}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      dampingFactor={0.05}
      enableDamping={true}
    />
  )
}

// Interactive location labels that appear on hover
function LocationLabel({ location, onSelect, visible }) {
  const position = latLonToCartesian(location.latitude, location.longitude, 1.6)
  
  if (!visible) return null

  return (
    <Html position={position} distanceFactor={6}>
      <div 
        className="pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
        onClick={() => onSelect(location)}
      >
        <div className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/20 hover:bg-black/90 hover:border-white/40 transition-all">
          {location.name}
        </div>
      </div>
    </Html>
  )
}

// Main optimized planet component
function OptimizedPlanet({ onLocationSelect }) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const { camera } = useThree()
  
  const selectLocation = useSimulationFlow((state) => state.selectLocation)

  // Monitor zoom level for LOD
  useFrame(() => {
    const distance = camera.position.length()
    const newZoomLevel = distance < 2 ? 4 : distance < 3 ? 3 : distance < 4 ? 2 : 1
    if (newZoomLevel !== zoomLevel) {
      setZoomLevel(newZoomLevel)
    }
  })

  const handleLocationSelect = useCallback((location) => {
    setSelectedTarget(location)
    selectLocation(location)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }, [selectLocation, onLocationSelect])

  const handleTargetReached = useCallback(() => {
    // Target reached, can trigger next phase
  }, [])

  return (
    <>
      <Stars radius={100} depth={50} factor={3} saturation={0} fade speed={0.3} />
      <ambientLight intensity={0.3} color="#1a2744" />
      <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
      
      <OptimizedEarth zoomLevel={zoomLevel} />
      <CloudLayer zoomLevel={zoomLevel} />
      <LocationMarkers onSelect={handleLocationSelect} zoomLevel={zoomLevel} />
      
      {FEATURED_LOCATIONS.map((location) => (
        <LocationLabel
          key={location.id}
          location={location}
          onSelect={handleLocationSelect}
          visible={zoomLevel > 2}
        />
      ))}
      
      <CameraController 
        target={selectedTarget} 
        onTargetReached={handleTargetReached}
      />
    </>
  )
}

// Main component with optimized Canvas settings
function OptimizedSpaceScene({ onLocationSelect }) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.8 }}
      >
        <color attach="background" args={["#0a0a0f"]} />
        <fog attach="fog" args={["#0a0a0f", 15, 35]} />
        
        <Suspense fallback={null}>
          <OptimizedPlanet onLocationSelect={onLocationSelect} />
        </Suspense>
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-sky-200 mb-2">🌍 Earth Explorer</h3>
          <p className="text-xs text-slate-300">
            Zoom, rotate, and click to explore impact locations. 
            Higher zoom reveals more detail and city labels.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OptimizedSpaceScene