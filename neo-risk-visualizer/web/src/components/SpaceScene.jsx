import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { Html, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import useSimulationFlow, { PHASES } from '../store/useSimulationFlow'
import { FEATURED_LOCATIONS } from '../data/locations'
import { latLonToCartesian } from '../utils/geo'

const EARTH_RADIUS = 1.5
const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.05
const CLOUD_RADIUS = EARTH_RADIUS * 1.01

const EARTH_TEXTURES = {
  day: '/textures/earth/day_2048.jpg',
  night: '/textures/earth/night_2048.png',
  normal: '/textures/earth/normal_2048.jpg',
  specular: '/textures/earth/specular_2048.jpg',
  clouds: '/textures/earth/clouds_2048.jpeg'
}

function useEarthTextures() {
  const [dayTexture, nightTexture, normalTexture, specularTexture, cloudTexture] = useLoader(
    THREE.TextureLoader,
    [EARTH_TEXTURES.day, EARTH_TEXTURES.night, EARTH_TEXTURES.normal, EARTH_TEXTURES.specular, EARTH_TEXTURES.clouds]
  )

  return useMemo(() => {
    // Optimize texture settings for performance
    dayTexture.colorSpace = THREE.SRGBColorSpace
    dayTexture.generateMipmaps = true
    dayTexture.minFilter = THREE.LinearMipmapLinearFilter
    dayTexture.magFilter = THREE.LinearFilter
    
    nightTexture.colorSpace = THREE.SRGBColorSpace
    nightTexture.generateMipmaps = true
    nightTexture.minFilter = THREE.LinearMipmapLinearFilter
    
    cloudTexture.colorSpace = THREE.SRGBColorSpace
    cloudTexture.generateMipmaps = true
    cloudTexture.minFilter = THREE.LinearMipmapLinearFilter
    
    normalTexture.colorSpace = THREE.LinearSRGBColorSpace
    normalTexture.generateMipmaps = true
    
    specularTexture.colorSpace = THREE.LinearSRGBColorSpace
    specularTexture.generateMipmaps = true
    
    return { dayTexture, nightTexture, normalTexture, specularTexture, cloudTexture }
  }, [dayTexture, nightTexture, normalTexture, specularTexture, cloudTexture])
}

function EarthGlobe() {
  const { dayTexture, nightTexture, normalTexture, specularTexture } = useEarthTextures()

  // Memoize geometry to prevent recreation
  const geometry = useMemo(() => new THREE.SphereGeometry(EARTH_RADIUS, 32, 32), [])
  
  return (
    <group>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial
          map={dayTexture}
          normalMap={normalTexture}
          metalnessMap={specularTexture}
          metalness={0.15}
          roughness={0.7}
          emissiveMap={nightTexture}
          emissiveIntensity={0.28}
          emissive={new THREE.Color('#1a2440')}
        />
      </mesh>
    </group>
  )
}

function CloudLayer() {
  const { cloudTexture } = useEarthTextures()

  // Reduced geometry complexity and optimized material
  const geometry = useMemo(() => new THREE.SphereGeometry(CLOUD_RADIUS, 24, 24), [])
  
  return (
    <mesh rotation={[0, 0, 0]} geometry={geometry}>
      <meshBasicMaterial
        map={cloudTexture}
        transparent
        opacity={0.45}
        depthWrite={false}
        alphaTest={0.1}
      />
    </mesh>
  )
}

function Atmosphere() {
  // Much simpler geometry for atmosphere glow
  const geometry = useMemo(() => new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 16, 16), [])
  
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial 
        color="#4fb6ff" 
        transparent 
        opacity={0.18} 
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function EarthController({ earthRef }) {
  const { phase, targetLocation } = useSimulationFlow((state) => ({
    phase: state.phase,
    targetLocation: state.targetLocation
  }))
  const confirmAlignment = useSimulationFlow((state) => state.confirmAlignment)
  const rotationTarget = useRef(new THREE.Quaternion())
  const aligning = useRef(false)
  const tempQuaternion = useRef(new THREE.Quaternion())
  const identityQuaternion = useRef(new THREE.Quaternion())

  useEffect(() => {
    if (!earthRef.current) return
    if (!targetLocation) {
      aligning.current = false
      return
    }

    const targetVector = latLonToCartesian(targetLocation.latitude, targetLocation.longitude, 1).normalize()
    const frontVector = new THREE.Vector3(0, 0, 1)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(targetVector, frontVector)
    rotationTarget.current.copy(quaternion)
    aligning.current = true
  }, [targetLocation, earthRef])

  useFrame((state, delta) => {
    if (!earthRef.current) return

    if (aligning.current) {
      tempQuaternion.current.copy(earthRef.current.quaternion)
      tempQuaternion.current.slerp(rotationTarget.current, 1 - Math.pow(0.0001, delta))
      earthRef.current.quaternion.copy(tempQuaternion.current)
      if (earthRef.current.quaternion.angleTo(rotationTarget.current) < 0.01) {
        earthRef.current.quaternion.copy(rotationTarget.current)
        aligning.current = false
        confirmAlignment()
      }
    } else if (phase === PHASES.SPACE_IDLE) {
      earthRef.current.rotation.y += delta * 0.12
      earthRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.07) * 0.08
    } else if (phase === PHASES.RESETTING) {
      tempQuaternion.current.copy(earthRef.current.quaternion)
      tempQuaternion.current.slerp(identityQuaternion.current, 1 - Math.pow(0.0001, delta))
      earthRef.current.quaternion.copy(tempQuaternion.current)
    }
  })

  return null
}

function CameraRig() {
  const { camera } = useThree()
  const {
    phase,
    activeLocation,
    enterSurfaceView,
    completeReset
  } = useSimulationFlow((state) => ({
    phase: state.phase,
    activeLocation: state.activeLocation,
    enterSurfaceView: state.enterSurfaceView,
    completeReset: state.completeReset
  }))

  const defaultPosition = useMemo(() => new THREE.Vector3(0, 1.8, 5.2), [])
  const lookAtOrigin = new THREE.Vector3(0, 0, 0)
  const targetCameraPosition = useRef(defaultPosition.clone())

  useEffect(() => {
    if (!activeLocation) return
    const normalised = latLonToCartesian(activeLocation.latitude, activeLocation.longitude, 1).normalize()
    const elevated = normalised.clone().multiplyScalar(2.1)
    elevated.add(new THREE.Vector3(0, 0.6, 0))
    targetCameraPosition.current.copy(elevated)
  }, [activeLocation])

  useFrame((state, delta) => {
    if (phase === PHASES.SPACE_IDLE || phase === PHASES.ALIGNING) {
      targetCameraPosition.current.copy(defaultPosition)
    }

    if (phase === PHASES.TRANSITION_TO_SURFACE && activeLocation) {
      camera.position.lerp(targetCameraPosition.current, 1 - Math.pow(0.0001, delta))
      const focusPoint = latLonToCartesian(activeLocation.latitude, activeLocation.longitude, EARTH_RADIUS * 0.9)
      camera.lookAt(focusPoint.x, focusPoint.y, focusPoint.z)

      if (camera.position.distanceTo(targetCameraPosition.current) < 0.02) {
        enterSurfaceView()
      }
    } else if (phase === PHASES.SPACE_IDLE || phase === PHASES.ALIGNING) {
      camera.position.lerp(defaultPosition, Math.min(1, delta * 0.8))
      camera.lookAt(lookAtOrigin)
    } else if (phase === PHASES.RESETTING) {
      camera.position.lerp(defaultPosition, Math.min(1, delta * 0.6))
      camera.lookAt(lookAtOrigin)
      if (camera.position.distanceTo(defaultPosition) < 0.03) {
        completeReset()
      }
    } else if (!targetLocation && phase !== PHASES.TRANSITION_TO_SURFACE) {
      camera.position.lerp(defaultPosition, Math.min(1, delta * 0.5))
      camera.lookAt(lookAtOrigin)
    }
  })

  useEffect(() => {
    camera.position.copy(defaultPosition)
    camera.lookAt(0, 0, 0)
  }, [camera, defaultPosition])

  return null
}

function LocationMarker({ location, isActive, isTarget, onSelect }) {
  const camera = useThree((state) => state.camera)
  const baseRadius = EARTH_RADIUS + 0.05
  const radialLabelDistance = 0.4
  const positionVector = useMemo(() => latLonToCartesian(location.latitude, location.longitude, baseRadius), [location])
  const haloRef = useRef()
  const groupRef = useRef()
  const labelRef = useRef()
  const [isVisible, setIsVisible] = React.useState(true)
  const surfaceVector = useRef(new THREE.Vector3())
  const cameraVector = useRef(new THREE.Vector3())

  // Memoize geometries to prevent recreation
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), [])
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.03, 0.055, 16), [])

  useEffect(() => {
    if (!groupRef.current) return
    const outward = positionVector.clone().normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward)
    groupRef.current.quaternion.copy(quaternion)
  }, [positionVector])

  // Throttle visibility calculations for better performance
  useFrame((state) => {
    const frameCount = Math.floor(state.clock.elapsedTime * 60) // 60fps
    
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.05)
    }

    // Only check visibility every 5th frame to reduce CPU load
    if (frameCount % 5 === 0 && groupRef.current) {
      cameraVector.current.copy(camera.position).normalize()
      groupRef.current.getWorldPosition(surfaceVector.current)
      surfaceVector.current.normalize()
      const facingValue = surfaceVector.current.dot(cameraVector.current)
      const currentlyVisible = facingValue < 0.35
      if (isVisible !== currentlyVisible) {
        setIsVisible(currentlyVisible)
      }
    }

    if (labelRef.current && frameCount % 3 === 0) {
      labelRef.current.style.opacity = isVisible ? '1' : '0'
      labelRef.current.style.transform = isVisible ? 'scale(1)' : 'scale(0.95)'
      labelRef.current.style.pointerEvents = isVisible ? 'auto' : 'none'
    }
  })

  return (
    <group ref={groupRef} position={positionVector}>
      <mesh geometry={sphereGeometry}>
        <meshStandardMaterial color={isActive ? '#ff7a45' : isTarget ? '#4f9cff' : '#f5f5f5'} emissive="#2c3f6c" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={haloRef} geometry={ringGeometry}>
        <meshBasicMaterial
          color={isActive ? '#ffb26f' : '#4f9cff'}
          transparent
          opacity={isActive ? 0.75 : 0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Line
        points={[new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(0, 0, radialLabelDistance)]}
        color={isActive ? '#ffae6d' : '#5ab6ff'}
        lineWidth={1.5}
        dashed
        dashSize={0.04}
        gapSize={0.02}
      />
      <Html
        position={[0, 0, radialLabelDistance]}
        distanceFactor={8}
        style={{ pointerEvents: 'auto', transition: 'opacity 0.3s ease, transform 0.3s ease' }}
        ref={labelRef}
      >
        <button
          onClick={() => onSelect(location)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm transition-transform duration-200 ${
            isActive ? 'bg-orange-500/90 text-white scale-105' : 'bg-slate-900/85 text-sky-200 hover:scale-105 hover:bg-slate-800/90'
          }`}
        >
          {location.name}
        </button>
      </Html>
    </group>
  )
}

function LocationMarkers({ onSelect }) {
  const { activeLocation, targetLocation } = useSimulationFlow((state) => ({
    activeLocation: state.activeLocation,
    targetLocation: state.targetLocation
  }))

  return (
    <group>
      {FEATURED_LOCATIONS.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          onSelect={onSelect}
          isActive={activeLocation?.id === location.id}
          isTarget={targetLocation?.id === location.id && activeLocation?.id !== location.id}
        />
      ))}
    </group>
  )
}

function SceneContent({ onSelect }) {
  const earthRef = useRef()

  return (
    <>
      <Stars radius={100} depth={50} factor={3} saturation={0} fade speed={0.6} />
      <group ref={earthRef}>
        <EarthGlobe />
        <CloudLayer />
        <Atmosphere />
        <LocationMarkers onSelect={onSelect} />
      </group>
      <EarthController earthRef={earthRef} />
      <CameraRig />
    </>
  )
}

const overlayGradient = 'pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60'

function SunLight() {
  const lightRef = useRef()
  const glowRef = useRef()
  const haloRef = useRef()
  const basePosition = useMemo(() => new THREE.Vector3(6, 4, 8), [])
  const rotationAxis = useMemo(() => new THREE.Vector3(0, 1, 0).normalize(), [])
  const rotationQuat = useRef(new THREE.Quaternion())
  const sunPosition = useRef(new THREE.Vector3())

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05
    rotationQuat.current.setFromAxisAngle(rotationAxis, t)
    sunPosition.current.copy(basePosition).applyQuaternion(rotationQuat.current)
    if (lightRef.current) {
      lightRef.current.position.copy(sunPosition.current)
      lightRef.current.target.position.set(0, 0, 0)
      lightRef.current.target.updateMatrixWorld()
    }
    if (glowRef.current) {
      glowRef.current.position.copy(sunPosition.current)
      const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.08
      glowRef.current.scale.setScalar(pulse)
    }
    if (haloRef.current) {
      haloRef.current.position.copy(sunPosition.current)
    }
  })

  return (
    <group>
      <directionalLight
        ref={lightRef}
        intensity={2.1}
        color="#ffe7b3"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffd283" transparent opacity={0.7} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

function SpaceScene({ onLocationSelect }) {
  const selectLocation = useSimulationFlow((state) => state.selectLocation)

  const handleSelect = (location) => {
    selectLocation(location)
    if (onLocationSelect) {
      onLocationSelect(location)
    }
  }

  return (
    <div className="relative w-full h-full">
      <Canvas 
        shadows 
        camera={{ position: [0, 1.8, 5.2], fov: 45 }}
        gl={{ 
          antialias: false,  // Disable expensive antialiasing 
          alpha: false,      // Disable alpha channel
          powerPreference: "high-performance",
          pixelRatio: Math.min(window.devicePixelRatio, 2) // Limit pixel ratio
        }}
        performance={{ min: 0.2 }} // Allow lower framerates if needed
      >
        <color attach="background" args={["#040511"]} />
        <fog attach="fog" args={["#040511", 14, 26]} />
        <Suspense fallback={null}>
          <SunLight />
          <ambientLight intensity={0.35} color="#1c2e4f" />
          <SceneContent onSelect={handleSelect} />
        </Suspense>
      </Canvas>
      <div className={overlayGradient} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-8 pt-6">
        <div className="pointer-events-auto backdrop-blur-xl bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 shadow-2xl max-w-sm">
          <h3 className="text-sm font-semibold text-sky-200 tracking-wide uppercase">Select Impact Location</h3>
          <p className="text-xs text-slate-300 mt-2">
            Choose a target directly on the globe or from the quick list below to initiate the cinematic flyover.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {FEATURED_LOCATIONS.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location)}
                className="pointer-events-auto bg-slate-800/70 hover:bg-slate-700/70 text-sky-200 text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpaceScene
