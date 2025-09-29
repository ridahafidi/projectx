import * as THREE from 'three'

const DEG2RAD = Math.PI / 180

export function latLonToCartesian(lat, lon, radius = 1) {
  const phi = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

export function normalizeLongitude(lon) {
  let normalized = lon
  while (normalized < -180) normalized += 360
  while (normalized > 180) normalized -= 360
  return normalized
}
