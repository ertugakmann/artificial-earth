import * as THREE from 'three'
import type { GeoPosition } from '../types/continent'

const DEG = Math.PI / 180

/**
 * Convert latitude/longitude to a point on a sphere of the given radius.
 *
 * Matches the UV layout of Three.js `SphereGeometry` when an equirectangular
 * texture (longitude -180 at the left edge) is applied, so markers line up
 * with the drawn continents.
 */
export function latLngToVector3(pos: GeoPosition, radius: number): THREE.Vector3 {
  const phi = (90 - pos.lat) * DEG
  const theta = (pos.lng + 180) * DEG
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Equirectangular projection into a `width`×`height` image. */
export function lngLatToXY(lng: number, lat: number, width: number, height: number) {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  }
}
