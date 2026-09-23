import type { ContinentId } from '../types/continent'
import { continentsById } from '../data/continents'
import { isPointOnLand, distanceKm } from '../utils/continentLandGeometry'
import { landmarks } from '../data/landmarks'
import type { DataCenterInstance } from '../types/game'

/**
 * Keep new buildings this far (km) clear of a landmark's real-world spot.
 * Bumped up alongside the larger landmark/data-centre models so the bigger
 * visuals never end up overlapping.
 */
const LANDMARK_SAFETY_KM = 320
/** Preferred, but not mandatory, minimum spacing between data centres. */
const DATA_CENTER_SPACING_KM = 420
const MAX_ATTEMPTS = 60

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Picks a lat/lng for a new data centre on the given continent: must be on
 * actual land, clear of every landmark's safety radius, and — best effort —
 * spaced away from existing data centres. Falls back to the least-bad
 * candidate seen if nothing fully satisfies every rule within the attempt
 * budget, so building can never hang or silently fail.
 */
export function pickBuildSite(
  continentId: ContinentId,
  existing: DataCenterInstance[],
): { lat: number; lng: number } {
  const continent = continentsById[continentId]
  const bounds = continent.iconBounds ?? { minLng: -180, maxLng: 180, minLat: -85, maxLat: -60 }

  const nearbyLandmarks = landmarks.filter((l) => l.continentId === continentId)
  const nearbyCenters = existing.filter((d) => d.continentId === continentId)

  let bestFallback: { lat: number; lng: number } | null = null
  let bestFallbackScore = -Infinity

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const lat = randomInRange(bounds.minLat, bounds.maxLat)
    const lng = randomInRange(bounds.minLng, bounds.maxLng)

    const onLand = isPointOnLand(continentId, lat, lng) || continentId === 'antarctica'
    if (!onLand) continue

    const minLandmarkDist = nearbyLandmarks.length
      ? Math.min(...nearbyLandmarks.map((l) => distanceKm({ lat, lng }, l.position)))
      : Infinity
    if (minLandmarkDist < LANDMARK_SAFETY_KM) continue

    const minCenterDist = nearbyCenters.length
      ? Math.min(...nearbyCenters.map((d) => distanceKm({ lat, lng }, d)))
      : Infinity

    if (minCenterDist >= DATA_CENTER_SPACING_KM) {
      return { lat, lng }
    }

    // Not perfectly spaced from other centres, but valid land clear of
    // landmarks — keep as a fallback candidate, preferring the most spaced-out one.
    if (minCenterDist > bestFallbackScore) {
      bestFallbackScore = minCenterDist
      bestFallback = { lat, lng }
    }
  }

  if (bestFallback) return bestFallback

  // Last resort: the continent's marker position, which is always valid land.
  return { lat: continent.marker.lat, lng: continent.marker.lng }
}
