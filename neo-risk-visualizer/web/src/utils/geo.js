import * as THREE from 'three'

const DEG2RAD = Math.PI / 180

export function latLonToCartesian(lat, lon, radius = 1) {
  // Convert latitude and longitude to radians
  const latRad = lat * DEG2RAD
  const lonRad = lon * DEG2RAD

  // Standard spherical to cartesian conversion
  // Note: Three.js uses Y-up coordinate system
  const x = radius * Math.cos(latRad) * Math.cos(lonRad)
  const y = radius * Math.sin(latRad)
  const z = -radius * Math.cos(latRad) * Math.sin(lonRad)

  return new THREE.Vector3(x, y, z)
}

export function normalizeLongitude(lon) {
  let normalized = lon
  while (normalized < -180) normalized += 360
  while (normalized > 180) normalized -= 360
  return normalized
}
